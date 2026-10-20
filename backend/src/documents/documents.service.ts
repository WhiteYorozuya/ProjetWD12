import { Injectable } from '@nestjs/common';
import { EtatMateriel } from '@prisma/client';
import { calculerFinAptitude, statutAptitude } from '../common/utils/aptitude';
import { PrismaService } from '../prisma/prisma.service';
import { creerDocument, enBuffer, numeroterPages, paragraphe, signatures, tableau, titreSection } from './pdf';

export const LIBELLES_ETAT: Record<EtatMateriel, string> = {
  EN_STOCK: 'En stock',
  EN_SERVICE: 'En service',
  EN_PANNE: 'En panne',
  EN_REPARATION: 'En réparation',
  REFORME: 'Réformé',
};

const LIBELLES_APTITUDE = { APTE: 'Apte', ECHEANCE_PROCHE: 'Échéance < 90 j', EXPIREE: 'Échue' } as const;

const dateFr = (d: Date) => d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** État des lieux d'une salle (entrée / sortie de stage) avec cadres de signature. */
  async etatDesLieuxSalle(salleId: number, auteur: string): Promise<{ nomFichier: string; contenu: Buffer }> {
    const salle = await this.prisma.salle.findUniqueOrThrow({
      where: { id: salleId },
      include: {
        postes: { orderBy: { hostname: 'asc' }, include: { applications: { include: { application: true } } } },
        materiels: {
          include: { type: true, poste: { select: { hostname: true } } },
          orderBy: [{ posteId: 'asc' }, { typeId: 'asc' }],
        },
        remontees: { where: { statut: { not: 'RESOLUE' } }, orderBy: { createdAt: 'desc' } },
      },
    });

    const maintenant = new Date();
    const doc = creerDocument(
      `État des lieux — salle ${salle.code}`,
      `${salle.nom}${salle.batiment ? ` · ${salle.batiment}` : ''} · capacité ${salle.capacite} places · édité le ${dateFr(maintenant)} par ${auteur}`,
    );

    paragraphe(doc, 'Nature :   [  ] Entrée de stage      [  ] Sortie de stage      [  ] Contrôle périodique');
    paragraphe(doc, 'Stage / unité : ..............................................................................................');

    titreSection(doc, `Matériel inventorié (${salle.materiels.length})`);
    const compte = new Map<EtatMateriel, number>();
    salle.materiels.forEach((m) => compte.set(m.etat, (compte.get(m.etat) ?? 0) + 1));
    paragraphe(
      doc,
      [...compte.entries()].map(([e, n]) => `${LIBELLES_ETAT[e]} : ${n}`).join('   ·   ') || 'Aucun matériel',
    );
    doc.moveDown(0.4);
    tableau(
      doc,
      [
        { titre: 'Poste', largeur: 70 },
        { titre: 'Type', largeur: 60 },
        { titre: 'N° de série', largeur: 85 },
        { titre: 'Marque / modèle', largeur: 110 },
        { titre: 'État', largeur: 60 },
        { titre: 'Constat (OK / remarque)', largeur: 130 },
      ],
      salle.materiels.map((m) => [
        m.poste?.hostname ?? '—',
        m.type.libelle,
        m.numeroSerie,
        `${m.marque} ${m.modele}`,
        LIBELLES_ETAT[m.etat],
        '',
      ]),
    );

    titreSection(doc, `Postes (${salle.postes.length})`);
    tableau(
      doc,
      [
        { titre: 'Poste', largeur: 80 },
        { titre: 'Adresse IP', largeur: 80 },
        { titre: 'Système', largeur: 110 },
        { titre: 'Applications métier', largeur: 245 },
      ],
      salle.postes.map((p) => [
        p.hostname,
        p.adresseIp ?? '—',
        p.systeme ?? '—',
        p.applications
          .filter((a) => a.application.metier)
          .map((a) => a.application.nom)
          .join(', ') || '—',
      ]),
    );

    titreSection(doc, `Remontées en cours (${salle.remontees.length})`);
    tableau(
      doc,
      [
        { titre: 'Date', largeur: 65 },
        { titre: 'Titre', largeur: 300 },
        { titre: 'Statut', largeur: 70 },
        { titre: 'Priorité', largeur: 80 },
      ],
      salle.remontees.map((r) => [dateFr(r.createdAt), r.titre, r.statut.replace('_', ' '), r.priorite]),
    );

    titreSection(doc, 'Observations');
    doc.rect(40, doc.y, doc.page.width - 80, 60).lineWidth(0.7).strokeColor('#c9ced8').stroke();
    doc.y += 65;

    signatures(doc, 'Remis par (gestionnaire / administrateur de salle)', 'Pris en compte par (responsable de stage)');
    numeroterPages(doc, `ParcForm · État des lieux salle ${salle.code} · ${dateFr(maintenant)}`);

    return {
      nomFichier: `etat-des-lieux-${salle.code}-${maintenant.toISOString().slice(0, 10)}.pdf`,
      contenu: await enBuffer(doc),
    };
  }

  /** Inventaire général du parc, regroupé par salle. */
  async inventaireGeneral(auteur: string): Promise<{ nomFichier: string; contenu: Buffer }> {
    const [salles, nonAffectes] = await Promise.all([
      this.prisma.salle.findMany({
        orderBy: { code: 'asc' },
        include: { materiels: { include: { type: true }, orderBy: { numeroSerie: 'asc' } } },
      }),
      this.prisma.materiel.findMany({ where: { salleId: null }, include: { type: true } }),
    ]);
    const maintenant = new Date();
    const total = salles.reduce((s, x) => s + x.materiels.length, 0) + nonAffectes.length;
    const doc = creerDocument(
      'Inventaire général du parc informatique',
      `${total} matériel(s) · ${salles.length} salle(s) · édité le ${dateFr(maintenant)} par ${auteur}`,
    );

    const colonnes = [
      { titre: 'Type', largeur: 65 },
      { titre: 'N° de série', largeur: 95 },
      { titre: 'Marque / modèle', largeur: 140 },
      { titre: 'État', largeur: 70 },
      { titre: 'Réception', largeur: 60 },
      { titre: 'Aptitude', largeur: 85 },
    ];
    const versLigne = (m: (typeof nonAffectes)[number]) => {
      const fin = calculerFinAptitude(m.dateReception, m.type.dureeAptitudeMois);
      return [
        m.type.libelle,
        m.numeroSerie,
        `${m.marque} ${m.modele}`,
        LIBELLES_ETAT[m.etat],
        dateFr(m.dateReception),
        `${LIBELLES_APTITUDE[statutAptitude(fin, maintenant)]} (${dateFr(fin)})`,
      ];
    };

    for (const salle of salles) {
      titreSection(doc, `Salle ${salle.code} — ${salle.nom} (${salle.materiels.length})`);
      tableau(doc, colonnes, salle.materiels.map(versLigne));
    }
    if (nonAffectes.length) {
      titreSection(doc, `Sans affectation (${nonAffectes.length})`);
      tableau(doc, colonnes, nonAffectes.map(versLigne));
    }
    numeroterPages(doc, `ParcForm · Inventaire général · ${dateFr(maintenant)}`);

    return {
      nomFichier: `inventaire-general-${maintenant.toISOString().slice(0, 10)}.pdf`,
      contenu: await enBuffer(doc),
    };
  }
}
