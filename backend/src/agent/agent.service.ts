import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  NiveauAlerte,
  Prisma,
  StatutCommande,
  StatutReinstallation,
  TypeAlerte,
  TypeCommande,
} from '@prisma/client';
import { AlertesService } from '../alertes/alertes.service';
import { PosteAgent } from '../common/types';
import { parametres } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { estProcessusSysteme } from '../supervision/regles';
import { SupervisionService } from '../supervision/supervision.service';
import { ApplicationRemonteeDto, HeartbeatDto, ResultatCommandeDto } from './agent.dto';

export const INTERVALLE_HEARTBEAT_SECONDES = 10;
const NB_ECHANTILLONS_CPU = 3;

/**
 * Durée (en secondes) à imputer aux processus vus pendant ce heartbeat :
 * temps écoulé depuis le précédent, plafonné pour ne pas compter les périodes d'arrêt.
 */
export function dureeImputable(precedent: Date | null, maintenant: Date): number {
  if (!precedent) return INTERVALLE_HEARTBEAT_SECONDES;
  const ecart = Math.round((maintenant.getTime() - precedent.getTime()) / 1000);
  if (ecart <= 0) return 0;
  return Math.min(ecart, INTERVALLE_HEARTBEAT_SECONDES * 3);
}

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supervision: SupervisionService,
    private readonly alertes: AlertesService,
  ) {}

  async heartbeat(poste: PosteAgent, dto: HeartbeatDto) {
    const maintenant = new Date();
    const precedent = await this.prisma.poste.findUniqueOrThrow({
      where: { id: poste.id },
      select: { derniereConnexion: true },
    });
    const secondes = dureeImputable(precedent.derniereConnexion, maintenant);
    // Les statistiques d'usage ne portent que sur les logiciels lancés par les utilisateurs
    const nomsProcessus = [
      ...new Set(dto.processus.filter((p) => !estProcessusSysteme(p.utilisateur)).map((p) => p.nom.toLowerCase())),
    ];
    const jour = maintenant.toISOString().slice(0, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.poste.update({
        where: { id: poste.id },
        data: {
          derniereConnexion: maintenant,
          cpu: dto.cpu,
          ram: dto.ram,
          utilisateurConnecte: dto.utilisateur ?? null,
          ...(dto.adresseIp ? { adresseIp: dto.adresseIp } : {}),
          ...(dto.systeme ? { systeme: dto.systeme } : {}),
        },
      });

      // Photo des processus : remplacée intégralement
      await tx.processusActif.deleteMany({ where: { posteId: poste.id } });
      if (dto.processus.length) {
        await tx.processusActif.createMany({
          data: dto.processus.map((p) => ({
            posteId: poste.id,
            pid: p.pid,
            nom: p.nom,
            utilisateur: p.utilisateur,
            cpu: p.cpu,
            memoireMo: p.memoireMo,
            vuLe: maintenant,
          })),
        });
      }

      await tx.echantillonUsage.create({
        data: {
          posteId: poste.id,
          horodatage: maintenant,
          cpu: dto.cpu,
          ram: dto.ram,
          sessionOuverte: !!dto.utilisateur,
          dureeSecondes: secondes,
        },
      });

      // Statistiques : temps cumulé par processus et par jour (une seule requête)
      if (secondes > 0 && nomsProcessus.length) {
        await tx.$executeRaw`
          INSERT INTO stats_processus ("posteId", jour, nom, secondes)
          SELECT ${poste.id}, ${jour}::date, n, ${secondes}
          FROM unnest(${nomsProcessus}::text[]) AS n
          ON CONFLICT ("posteId", jour, nom)
          DO UPDATE SET secondes = stats_processus.secondes + EXCLUDED.secondes`;
      }

      if (dto.applications) await this.synchroniserApplications(tx, poste.id, dto.applications);
    });

    await this.appliquerRegles(poste, dto);
    await this.verifierCpu(poste);

    return {
      intervalleSecondes: INTERVALLE_HEARTBEAT_SECONDES,
      processusInterdits: [...(await this.supervision.processusInterdits(poste.salleId))],
      commandes: await this.transmettreCommandes(poste.id),
    };
  }

  /** Remplace la liste des applications du poste ; les applications inconnues entrent au catalogue. */
  private async synchroniserApplications(tx: Prisma.TransactionClient, posteId: number, apps: ApplicationRemonteeDto[]) {
    const ids: number[] = [];
    for (const app of apps) {
      const application = await tx.application.upsert({
        where: { nom: app.nom },
        create: { nom: app.nom, editeur: app.editeur, metier: false },
        update: {},
        select: { id: true },
      });
      ids.push(application.id);
      await tx.posteApplication.upsert({
        where: { posteId_applicationId: { posteId, applicationId: application.id } },
        create: { posteId, applicationId: application.id, version: app.version },
        update: { version: app.version },
      });
    }
    await tx.posteApplication.deleteMany({ where: { posteId, applicationId: { notIn: ids } } });
  }

  /** Processus interdit détecté → alerte + ordre d'arrêt automatique. */
  private async appliquerRegles(poste: PosteAgent, dto: HeartbeatDto) {
    const interdits = await this.supervision.processusInterdits(poste.salleId);
    const fautifs = dto.processus.filter((p) => interdits.has(p.nom.toLowerCase()));
    if (!fautifs.length) return;

    const enAttente = await this.prisma.commandeAgent.findMany({
      where: {
        posteId: poste.id,
        type: TypeCommande.TUER_PROCESSUS,
        statut: { in: [StatutCommande.EN_ATTENTE, StatutCommande.ENVOYEE] },
      },
      select: { parametres: true },
    });
    const pidsDejaDemandes = new Set(enAttente.map((c) => (c.parametres as { pid: number }).pid));

    for (const p of fautifs) {
      await this.alertes.creerSiAbsente({
        type: TypeAlerte.PROCESSUS_INTERDIT,
        niveau: NiveauAlerte.CRITIQUE,
        message: `Processus interdit « ${p.nom} » détecté sur ${poste.hostname}${p.utilisateur ? ` (utilisateur ${p.utilisateur})` : ''}`,
        posteId: poste.id,
        salleId: poste.salleId,
      });
      if (!pidsDejaDemandes.has(p.pid)) {
        await this.prisma.commandeAgent.create({
          data: { posteId: poste.id, type: TypeCommande.TUER_PROCESSUS, parametres: { pid: p.pid, nom: p.nom, automatique: true } },
        });
      }
    }
  }

  /** Alerte si les N derniers échantillons dépassent le seuil CPU. */
  private async verifierCpu(poste: PosteAgent) {
    const derniers = await this.prisma.echantillonUsage.findMany({
      where: { posteId: poste.id },
      orderBy: { horodatage: 'desc' },
      take: NB_ECHANTILLONS_CPU,
      select: { cpu: true },
    });
    const seuil = parametres.cpuAlerte();
    if (derniers.length === NB_ECHANTILLONS_CPU && derniers.every((e) => e.cpu >= seuil)) {
      await this.alertes.creerSiAbsente({
        type: TypeAlerte.CPU_ELEVE,
        niveau: NiveauAlerte.AVERTISSEMENT,
        message: `CPU au-dessus de ${seuil} % depuis ${NB_ECHANTILLONS_CPU} relevés sur ${poste.hostname}`,
        posteId: poste.id,
        salleId: poste.salleId,
      });
    }
  }

  /** Renvoie les ordres en attente et les marque comme transmis. */
  private async transmettreCommandes(posteId: number) {
    const commandes = await this.prisma.commandeAgent.findMany({
      where: { posteId, statut: StatutCommande.EN_ATTENTE },
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, parametres: true },
    });
    if (commandes.length) {
      await this.prisma.commandeAgent.updateMany({
        where: { id: { in: commandes.map((c) => c.id) }, statut: StatutCommande.EN_ATTENTE },
        data: { statut: StatutCommande.ENVOYEE, envoyeeLe: new Date() },
      });
    }
    return commandes;
  }

  /** Compte rendu d'exécution d'un ordre par l'agent. */
  async resultatCommande(poste: PosteAgent, commandeId: number, dto: ResultatCommandeDto) {
    const commande = await this.prisma.commandeAgent.findUniqueOrThrow({ where: { id: commandeId } });
    if (commande.posteId !== poste.id) throw new ForbiddenException("Cet ordre n'est pas destiné à ce poste");

    const maintenant = new Date();
    const termine = dto.statut !== 'EN_COURS';

    await this.prisma.$transaction(async (tx) => {
      await tx.commandeAgent.update({
        where: { id: commandeId },
        data: {
          statut: termine ? (dto.statut as StatutCommande) : StatutCommande.ENVOYEE,
          resultat: dto.message,
          termineeLe: termine ? maintenant : null,
        },
      });

      if (commande.type === TypeCommande.TUER_PROCESSUS && dto.statut === 'EXECUTEE') {
        const { pid } = commande.parametres as { pid: number };
        await tx.processusActif.deleteMany({ where: { posteId: poste.id, pid } });
      }

      if (commande.type === TypeCommande.REINSTALLER && commande.reinstallationId) {
        const statut =
          dto.statut === 'EN_COURS'
            ? StatutReinstallation.EN_COURS
            : dto.statut === 'EXECUTEE'
              ? StatutReinstallation.TERMINEE
              : StatutReinstallation.ECHEC;
        await tx.reinstallation.update({
          where: { id: commande.reinstallationId },
          data: {
            statut,
            message: dto.message,
            ...(dto.statut === 'EN_COURS' ? { debut: maintenant } : { fin: maintenant }),
          },
        });
      }
    });
    return { ok: true };
  }
}
