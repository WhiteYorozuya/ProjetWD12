import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, StatutCommande, StatutReinstallation, TypeCommande } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiltreReinstallationsDto } from './reinstallations.dto';

const ACTIVES: StatutReinstallation[] = [StatutReinstallation.DEMANDEE, StatutReinstallation.EN_COURS];
const IMAGE_DEFAUT = 'Master standard';

@Injectable()
export class ReinstallationsService {
  constructor(private readonly prisma: PrismaService) {}

  lister(filtre: FiltreReinstallationsDto) {
    const where: Prisma.ReinstallationWhereInput = {};
    if (filtre.statut) where.statut = filtre.statut;
    if (filtre.lot) where.lot = filtre.lot;
    if (filtre.salleId) where.poste = { salleId: filtre.salleId };
    return this.prisma.reinstallation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        poste: { select: { id: true, hostname: true, salle: { select: { id: true, code: true, nom: true } } } },
        demandeur: { select: { nom: true, prenom: true } },
      },
    });
  }

  /** Crée la demande et l'ordre REINSTALLER que l'agent recevra à son prochain heartbeat. */
  private async creerDemande(
    tx: Prisma.TransactionClient,
    posteId: number,
    image: string,
    demandeurId: number,
    lot: string | null,
  ) {
    const reinstallation = await tx.reinstallation.create({
      data: { posteId, image, demandeurId, lot },
    });
    await tx.commandeAgent.create({
      data: {
        posteId,
        type: TypeCommande.REINSTALLER,
        parametres: { image, reinstallationId: reinstallation.id },
        auteurId: demandeurId,
        reinstallationId: reinstallation.id,
      },
    });
    return reinstallation;
  }

  async demanderPourPoste(posteId: number, image: string | undefined, demandeurId: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.poste.findUniqueOrThrow({ where: { id: posteId } });
      const enCours = await tx.reinstallation.count({ where: { posteId, statut: { in: ACTIVES } } });
      if (enCours) throw new ConflictException('Une réinstallation est déjà en cours pour ce poste');
      return this.creerDemande(tx, posteId, image ?? IMAGE_DEFAUT, demandeurId, null);
    });
  }

  /** Replaquage d'une salle : une demande par poste, regroupées dans un lot. */
  async replaquerSalle(salleId: number, image: string | undefined, demandeurId: number) {
    return this.prisma.$transaction(async (tx) => {
      const salle = await tx.salle.findUniqueOrThrow({
        where: { id: salleId },
        include: {
          postes: { include: { reinstallations: { where: { statut: { in: ACTIVES } }, select: { id: true } } } },
        },
      });
      if (salle.postes.length === 0) throw new BadRequestException('Aucun poste dans cette salle');

      const horodatage = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      const lot = `LOT-${salle.code}-${horodatage}`;
      const aTraiter = salle.postes.filter((p) => p.reinstallations.length === 0);

      for (const poste of aTraiter) {
        await this.creerDemande(tx, poste.id, image ?? IMAGE_DEFAUT, demandeurId, lot);
      }
      return {
        lot,
        creees: aTraiter.length,
        ignorees: salle.postes.length - aTraiter.length, // postes déjà en cours de réinstallation
      };
    });
  }

  async annuler(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.reinstallation.findUniqueOrThrow({ where: { id }, include: { commande: true } });
      if (r.statut !== StatutReinstallation.DEMANDEE || r.commande?.statut !== StatutCommande.EN_ATTENTE) {
        throw new ConflictException("La réinstallation a déjà été transmise au poste : elle ne peut plus être annulée");
      }
      await tx.commandeAgent.update({
        where: { id: r.commande.id },
        data: { statut: StatutCommande.ECHEC, resultat: 'Annulée par un administrateur', termineeLe: new Date() },
      });
      return tx.reinstallation.update({
        where: { id },
        data: { statut: StatutReinstallation.ANNULEE, fin: new Date() },
      });
    });
  }
}
