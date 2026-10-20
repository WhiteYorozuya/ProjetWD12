import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { StatutCommande, TypeCommande } from '@prisma/client';
import { estEnLigne } from '../common/utils/statut-poste';
import { PrismaService } from '../prisma/prisma.service';
import { calculerInterdits, estProcessusSysteme } from './regles';
import { CreerRegleDto } from './supervision.dto';

@Injectable()
export class SupervisionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────── Règles de processus ───────────────

  listerRegles(salleId?: number) {
    return this.prisma.regleProcessus.findMany({
      where: salleId ? { OR: [{ salleId }, { salleId: null }] } : undefined,
      include: { salle: { select: { id: true, code: true, nom: true } } },
      orderBy: [{ salleId: { sort: 'asc', nulls: 'first' } }, { nom: 'asc' }],
    });
  }

  async creerRegle(dto: CreerRegleDto) {
    const nom = dto.nom.trim().toLowerCase();
    // L'index unique (nom, salleId) ne protège pas les règles globales (NULL ≠ NULL en SQL)
    const doublon = await this.prisma.regleProcessus.findFirst({ where: { nom, salleId: dto.salleId ?? null } });
    if (doublon) throw new ConflictException('Une règle existe déjà pour ce processus à ce niveau');
    return this.prisma.regleProcessus.create({
      data: { ...dto, nom },
      include: { salle: { select: { id: true, code: true, nom: true } } },
    });
  }

  async supprimerRegle(id: number) {
    await this.prisma.regleProcessus.delete({ where: { id } });
  }

  async processusInterdits(salleId: number): Promise<Set<string>> {
    const regles = await this.prisma.regleProcessus.findMany({
      where: { OR: [{ salleId: null }, { salleId }] },
    });
    return calculerInterdits(regles, salleId);
  }

  // ─────────────── Vue temps réel ───────────────

  /** État de tous les postes d'une salle, pour la vue « formateur ». */
  async vueSalle(salleId: number) {
    const [salle, interdits] = await Promise.all([
      this.prisma.salle.findUniqueOrThrow({
        where: { id: salleId },
        select: {
          id: true,
          code: true,
          nom: true,
          postes: {
            orderBy: { hostname: 'asc' },
            select: {
              id: true,
              hostname: true,
              adresseIp: true,
              derniereConnexion: true,
              cpu: true,
              ram: true,
              utilisateurConnecte: true,
              processus: { orderBy: [{ cpu: 'desc' }, { nom: 'asc' }] },
              alertes: { where: { acquittee: false }, select: { id: true, type: true, message: true } },
              commandes: {
                where: { type: TypeCommande.TUER_PROCESSUS, statut: { in: [StatutCommande.EN_ATTENTE, StatutCommande.ENVOYEE] } },
                select: { parametres: true },
              },
            },
          },
        },
      }),
      this.processusInterdits(salleId),
    ]);

    return {
      ...salle,
      processusInterdits: [...interdits],
      postes: salle.postes.map(({ commandes, ...p }) => {
        const pidsEnCoursArret = new Set(commandes.map((c) => (c.parametres as { pid: number }).pid));
        return {
          ...p,
          enLigne: estEnLigne(p.derniereConnexion),
          processus: p.processus.map((pr) => ({
            ...pr,
            interdit: interdits.has(pr.nom.toLowerCase()),
            arretDemande: pidsEnCoursArret.has(pr.pid),
          })),
        };
      }),
    };
  }

  /** Dépose un ordre d'arrêt de processus pour l'agent du poste. */
  async tuerProcessus(posteId: number, pid: number, auteurId: number) {
    const processus = await this.prisma.processusActif.findFirst({ where: { posteId, pid } });
    if (!processus) throw new BadRequestException("Ce processus n'est plus actif sur le poste");
    if (estProcessusSysteme(processus.utilisateur)) {
      throw new ForbiddenException("Les processus du système d'exploitation ne peuvent pas être arrêtés à distance");
    }

    const dejaDemande = await this.prisma.commandeAgent.findFirst({
      where: {
        posteId,
        type: TypeCommande.TUER_PROCESSUS,
        statut: { in: [StatutCommande.EN_ATTENTE, StatutCommande.ENVOYEE] },
        parametres: { path: ['pid'], equals: pid },
      },
    });
    if (dejaDemande) return dejaDemande;

    return this.prisma.commandeAgent.create({
      data: {
        posteId,
        type: TypeCommande.TUER_PROCESSUS,
        parametres: { pid, nom: processus.nom },
        auteurId,
      },
    });
  }
}
