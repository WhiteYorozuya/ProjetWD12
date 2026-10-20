import { BadRequestException, Injectable } from '@nestjs/common';
import { EtatMateriel, Poste, Prisma, Salle, TypeSalle } from '@prisma/client';
import { pagine } from '../common/dto/pagination.dto';
import { JOURS_PREAVIS_APTITUDE, calculerFinAptitude, statutAptitude } from '../common/utils/aptitude';
import { ecrireCsv, lireCsvObjets } from '../common/utils/csv';
import { PrismaService } from '../prisma/prisma.service';
import {
  AffectationGroupeeDto,
  AffecterMaterielDto,
  CreerMaterielDto,
  ImportMaterielsDto,
  ModifierMaterielDto,
  RechercheMaterielDto,
} from './materiels.dto';

type Tx = Prisma.TransactionClient;
type Destination = { salle: Salle | null; poste: Poste | null };

const INCLUDE_LISTE = {
  type: true,
  salle: { select: { id: true, code: true, nom: true } },
  poste: { select: { id: true, hostname: true } },
} satisfies Prisma.MaterielInclude;

export const MAX_LIGNES_IMPORT = 5000;

export function libelleSalle(salle: Pick<Salle, 'code' | 'nom'> | null | undefined): string | null {
  return salle ? `${salle.code} – ${salle.nom}` : null;
}

/** Accepte « EN_STOCK », « en stock », « En-service »… */
export function lireEtat(valeur: string): EtatMateriel | null {
  const v = valeur
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (v === 'REFORMEE') return EtatMateriel.REFORME;
  return (Object.values(EtatMateriel) as string[]).includes(v) ? (v as EtatMateriel) : null;
}

/** Accepte AAAA-MM-JJ ou JJ/MM/AAAA. */
export function lireDate(valeur: string): Date | null {
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur.trim());
  if (m) return dateValide(+m[1], +m[2], +m[3]);
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valeur.trim());
  if (m) return dateValide(+m[3], +m[2], +m[1]);
  return null;
}

function dateValide(annee: number, mois: number, jour: number): Date | null {
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  return d.getUTCFullYear() === annee && d.getUTCMonth() === mois - 1 && d.getUTCDate() === jour ? d : null;
}

/** État logique d'un matériel après un déplacement. */
export function etatApresDeplacement(etat: EtatMateriel, versMagasin: boolean): EtatMateriel {
  if (etat === EtatMateriel.EN_STOCK && !versMagasin) return EtatMateriel.EN_SERVICE;
  if (etat === EtatMateriel.EN_SERVICE && versMagasin) return EtatMateriel.EN_STOCK;
  return etat;
}

@Injectable()
export class MaterielsService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichir<T extends { dateReception: Date; type: { dureeAptitudeMois: number } }>(m: T) {
    const finAptitude = calculerFinAptitude(m.dateReception, m.type.dureeAptitudeMois);
    return { ...m, finAptitude, statutAptitude: statutAptitude(finAptitude) };
  }

  // ─────────────── Consultation ───────────────

  async rechercher(dto: RechercheMaterielDto) {
    const where: Prisma.MaterielWhereInput = {};
    const et: Prisma.MaterielWhereInput[] = [];

    if (dto.recherche) {
      const contient = { contains: dto.recherche.trim(), mode: 'insensitive' as const };
      et.push({ OR: [{ numeroSerie: contient }, { marque: contient }, { modele: contient }] });
    }
    if (dto.typeId) where.typeId = dto.typeId;
    if (dto.etat) where.etat = dto.etat;
    if (dto.salleId) where.salleId = dto.salleId;
    if (dto.posteId) where.posteId = dto.posteId;

    if (dto.aptitude) {
      et.push({ OR: await this.conditionsAptitude(dto.aptitude) });
      if (!dto.etat) where.etat = { not: EtatMateriel.REFORME };
    }
    if (et.length) where.AND = et;

    const [elements, total] = await this.prisma.$transaction([
      this.prisma.materiel.findMany({
        where,
        include: INCLUDE_LISTE,
        orderBy: { updatedAt: 'desc' },
        ...pagine(dto),
      }),
      this.prisma.materiel.count({ where }),
    ]);
    return { elements: elements.map((m) => this.enrichir(m)), total, page: dto.page, taille: dto.taille };
  }

  /** Traduit « aptitude expirée / proche » en conditions sur la date de réception, type par type. */
  private async conditionsAptitude(filtre: 'EXPIREE' | 'ECHEANCE_PROCHE'): Promise<Prisma.MaterielWhereInput[]> {
    const types = await this.prisma.typeMateriel.findMany();
    const maintenant = new Date();
    const dansPreavis = new Date(maintenant.getTime() + JOURS_PREAVIS_APTITUDE * 24 * 3600 * 1000);
    const conditions = types.map((t) => {
      const limiteExpiree = calculerFinAptitude(maintenant, -t.dureeAptitudeMois);
      if (filtre === 'EXPIREE') return { typeId: t.id, dateReception: { lte: limiteExpiree } };
      const limiteProche = calculerFinAptitude(dansPreavis, -t.dureeAptitudeMois);
      return { typeId: t.id, dateReception: { gt: limiteExpiree, lte: limiteProche } };
    });
    return conditions.length ? conditions : [{ id: -1 }];
  }

  async detail(id: number) {
    const materiel = await this.prisma.materiel.findUniqueOrThrow({
      where: { id },
      include: {
        type: { include: { formations: true } },
        salle: true,
        poste: { select: { id: true, hostname: true, salleId: true } },
        mouvements: {
          orderBy: { date: 'desc' },
          include: { auteur: { select: { nom: true, prenom: true } } },
        },
      },
    });
    return this.enrichir(materiel);
  }

  // ─────────────── Création / modification ───────────────

  async creer(dto: CreerMaterielDto, auteurId: number) {
    return this.prisma.$transaction(async (tx) => {
      const dest = await this.resoudreDestination(tx, dto.salleId, dto.posteId);
      const versMagasin = !dest.salle || dest.salle.type === TypeSalle.MAGASIN;
      const materiel = await tx.materiel.create({
        data: {
          numeroSerie: dto.numeroSerie.trim().toUpperCase(),
          typeId: dto.typeId,
          marque: dto.marque.trim(),
          modele: dto.modele.trim(),
          etat: dto.etat ?? (versMagasin ? EtatMateriel.EN_STOCK : EtatMateriel.EN_SERVICE),
          dateReception: dto.dateReception ?? new Date(),
          origine: dto.origine?.trim() || 'CND',
          commentaire: dto.commentaire,
          salleId: dest.salle?.id ?? null,
          posteId: dest.poste?.id ?? null,
        },
        include: INCLUDE_LISTE,
      });
      await tx.mouvement.create({
        data: {
          materielId: materiel.id,
          versSalle: libelleSalle(dest.salle),
          versPoste: dest.poste?.hostname ?? null,
          motif: `Réception (${materiel.origine})`,
          auteurId,
        },
      });
      return this.enrichir(materiel);
    });
  }

  async modifier(id: number, dto: ModifierMaterielDto) {
    const materiel = await this.prisma.materiel.update({
      where: { id },
      data: {
        ...dto,
        numeroSerie: dto.numeroSerie?.trim().toUpperCase(),
      },
      include: INCLUDE_LISTE,
    });
    return this.enrichir(materiel);
  }

  async supprimer(id: number) {
    await this.prisma.materiel.delete({ where: { id } });
  }

  // ─────────────── Affectation / déplacement ───────────────

  async affecter(id: number, dto: AffecterMaterielDto, auteurId: number) {
    return this.prisma.$transaction(async (tx) => {
      const dest = await this.resoudreDestination(tx, dto.salleId, dto.posteId, true);
      return this.deplacer(tx, id, dest, dto.motif, auteurId);
    });
  }

  async affecterGroupe(dto: AffectationGroupeeDto, auteurId: number) {
    return this.prisma.$transaction(async (tx) => {
      const dest = await this.resoudreDestination(tx, dto.salleId, dto.posteId, true);
      let deplaces = 0;
      for (const id of new Set(dto.ids)) {
        await this.deplacer(tx, id, dest, dto.motif, auteurId, true);
        deplaces++;
      }
      return { deplaces };
    });
  }

  private async deplacer(
    tx: Tx,
    id: number,
    dest: Destination,
    motif: string | undefined,
    auteurId: number,
    ignorerSiIdentique = false,
  ) {
    const actuel = await tx.materiel.findUniqueOrThrow({
      where: { id },
      include: { salle: true, poste: true },
    });
    const identique = actuel.salleId === (dest.salle?.id ?? null) && actuel.posteId === (dest.poste?.id ?? null);
    if (identique) {
      if (ignorerSiIdentique) return this.enrichir(await tx.materiel.findUniqueOrThrow({ where: { id }, include: INCLUDE_LISTE }));
      throw new BadRequestException('Le matériel est déjà à cet emplacement');
    }

    const versMagasin = !dest.salle || dest.salle.type === TypeSalle.MAGASIN;
    if (actuel.etat === EtatMateriel.REFORME && !versMagasin) {
      throw new BadRequestException(`Le matériel ${actuel.numeroSerie} est réformé : il ne peut être affecté qu'au magasin`);
    }

    const materiel = await tx.materiel.update({
      where: { id },
      data: {
        salleId: dest.salle?.id ?? null,
        posteId: dest.poste?.id ?? null,
        etat: etatApresDeplacement(actuel.etat, versMagasin),
      },
      include: INCLUDE_LISTE,
    });
    await tx.mouvement.create({
      data: {
        materielId: id,
        deSalle: libelleSalle(actuel.salle),
        versSalle: libelleSalle(dest.salle),
        dePoste: actuel.poste?.hostname ?? null,
        versPoste: dest.poste?.hostname ?? null,
        motif: motif?.trim() || null,
        auteurId,
      },
    });
    return this.enrichir(materiel);
  }

  /**
   * Détermine la salle et le poste de destination.
   * - poste seul → salle du poste ; salle + poste → le poste doit être dans la salle ;
   * - rien → magasin (première salle de type MAGASIN) s'il existe.
   */
  private async resoudreDestination(
    tx: Tx,
    salleId?: number,
    posteId?: number,
    magasinObligatoire = false,
  ): Promise<Destination> {
    if (posteId) {
      const poste = await tx.poste.findUnique({ where: { id: posteId }, include: { salle: true } });
      if (!poste) throw new BadRequestException('Poste introuvable');
      if (salleId && poste.salleId !== salleId) {
        throw new BadRequestException("Le poste n'appartient pas à la salle choisie");
      }
      const { salle, ...p } = poste;
      return { salle, poste: p };
    }
    if (salleId) {
      const salle = await tx.salle.findUnique({ where: { id: salleId } });
      if (!salle) throw new BadRequestException('Salle introuvable');
      return { salle, poste: null };
    }
    const magasin = await tx.salle.findFirst({ where: { type: TypeSalle.MAGASIN }, orderBy: { id: 'asc' } });
    if (!magasin && magasinObligatoire) {
      throw new BadRequestException('Aucune destination indiquée et aucune salle de type MAGASIN définie');
    }
    return { salle: magasin, poste: null };
  }

  // ─────────────── Import / export CSV ───────────────

  async importer(dto: ImportMaterielsDto, auteurId: number) {
    const lignes = lireCsvObjets(dto.csv);
    if (lignes.length === 0) throw new BadRequestException('Le fichier est vide');
    if (lignes.length > MAX_LIGNES_IMPORT) {
      throw new BadRequestException(`Import limité à ${MAX_LIGNES_IMPORT} lignes`);
    }
    const colonnesManquantes = ['numeroserie', 'type', 'marque', 'modele'].filter((c) => !(c in lignes[0]));
    if (colonnesManquantes.length) {
      throw new BadRequestException(`Colonnes manquantes : ${colonnesManquantes.join(', ')}`);
    }

    const [types, salles, magasin] = await Promise.all([
      this.prisma.typeMateriel.findMany(),
      this.prisma.salle.findMany(),
      this.prisma.salle.findFirst({ where: { type: TypeSalle.MAGASIN }, orderBy: { id: 'asc' } }),
    ]);
    const typeParLibelle = new Map(types.map((t) => [t.libelle.toLowerCase(), t]));
    const salleParCode = new Map(salles.map((s) => [s.code.toLowerCase(), s]));

    const series = lignes.map((l) => l.numeroserie.toUpperCase()).filter(Boolean);
    const existants = new Set(
      (await this.prisma.materiel.findMany({ where: { numeroSerie: { in: series } }, select: { numeroSerie: true } })).map(
        (m) => m.numeroSerie,
      ),
    );

    const erreurs: { ligne: number; message: string }[] = [];
    const vus = new Set<string>();
    const aCreer: (Prisma.MaterielCreateManyInput & { _salle: Salle | null })[] = [];

    lignes.forEach((l, i) => {
      const numLigne = i + 2; // +1 pour l'en-tête, +1 car les lignes commencent à 1
      const problemes: string[] = [];
      const serie = l.numeroserie.toUpperCase();

      if (!serie) problemes.push('numéro de série manquant');
      else if (existants.has(serie)) problemes.push(`numéro de série ${serie} déjà inventorié`);
      else if (vus.has(serie)) problemes.push(`numéro de série ${serie} en double dans le fichier`);
      vus.add(serie);

      const type = typeParLibelle.get(l.type.toLowerCase());
      if (!type) problemes.push(`type « ${l.type} » inconnu`);
      if (!l.marque) problemes.push('marque manquante');
      if (!l.modele) problemes.push('modèle manquant');

      let salle: Salle | null = magasin;
      if (l.salle) {
        salle = salleParCode.get(l.salle.toLowerCase()) ?? null;
        if (!salle) problemes.push(`salle « ${l.salle} » inconnue`);
      }

      const versMagasin = !salle || salle.type === TypeSalle.MAGASIN;
      let etat: EtatMateriel = versMagasin ? EtatMateriel.EN_STOCK : EtatMateriel.EN_SERVICE;
      if (l.etat) {
        const lu = lireEtat(l.etat);
        if (!lu) problemes.push(`état « ${l.etat} » inconnu`);
        else etat = lu;
      }

      let dateReception = new Date();
      if (l.datereception) {
        const lue = lireDate(l.datereception);
        if (!lue) problemes.push(`date « ${l.datereception} » invalide (attendu JJ/MM/AAAA ou AAAA-MM-JJ)`);
        else dateReception = lue;
      }

      if (problemes.length) {
        erreurs.push({ ligne: numLigne, message: problemes.join(' ; ') });
        return;
      }
      aCreer.push({
        numeroSerie: serie,
        typeId: type!.id,
        marque: l.marque,
        modele: l.modele,
        etat,
        dateReception,
        origine: l.origine || 'CND',
        salleId: salle?.id ?? null,
        _salle: salle,
      });
    });

    const bilan = { total: lignes.length, valides: aCreer.length, erreurs, importes: 0 };
    if (dto.simulation || erreurs.length > 0) return bilan; // tout ou rien

    await this.prisma.$transaction(async (tx) => {
      const crees = await tx.materiel.createManyAndReturn({
        data: aCreer.map(({ _salle, ...m }) => m),
        select: { id: true, numeroSerie: true },
      });
      const salleParSerie = new Map(aCreer.map((m) => [m.numeroSerie, m._salle]));
      await tx.mouvement.createMany({
        data: crees.map((m) => ({
          materielId: m.id,
          versSalle: libelleSalle(salleParSerie.get(m.numeroSerie)),
          motif: 'Réception — import CSV',
          auteurId,
        })),
      });
    });
    return { ...bilan, importes: aCreer.length };
  }

  async exporterCsv(): Promise<string> {
    const materiels = await this.prisma.materiel.findMany({ include: INCLUDE_LISTE, orderBy: { numeroSerie: 'asc' } });
    const lignes = materiels.map((m) => {
      const e = this.enrichir(m);
      return [
        e.numeroSerie,
        e.type.libelle,
        e.marque,
        e.modele,
        e.salle?.code ?? '',
        e.etat,
        e.dateReception,
        e.poste?.hostname ?? '',
        e.finAptitude,
        e.statutAptitude,
        e.origine,
        e.commentaire ?? '',
      ];
    });
    return ecrireCsv(
      [
        'numeroSerie',
        'type',
        'marque',
        'modele',
        'salle',
        'etat',
        'dateReception',
        'poste',
        'finAptitude',
        'statutAptitude',
        'origine',
        'commentaire',
      ],
      lignes,
    );
  }
}
