import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { genererJetonAgent, hacherJeton } from '../common/utils/jeton';
import { estEnLigne } from '../common/utils/statut-poste';
import { libelleSalle } from '../materiels/materiels.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreerPosteDto, DeclarerApplicationDto, ModifierPosteDto } from './postes.dto';

/** Champs exposés : jamais l'empreinte du jeton de l'agent. */
const CHAMPS_POSTE = {
  id: true,
  hostname: true,
  adresseIp: true,
  systeme: true,
  salleId: true,
  derniereConnexion: true,
  cpu: true,
  ram: true,
  utilisateurConnecte: true,
  createdAt: true,
} satisfies Prisma.PosteSelect;

@Injectable()
export class PostesService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(salleId?: number) {
    const postes = await this.prisma.poste.findMany({
      where: salleId ? { salleId } : undefined,
      orderBy: { hostname: 'asc' },
      select: {
        ...CHAMPS_POSTE,
        salle: { select: { id: true, code: true, nom: true } },
        _count: { select: { processus: true, applications: true } },
        remontees: { where: { statut: { not: 'RESOLUE' } }, select: { id: true } },
      },
    });
    return postes.map(({ _count, remontees, ...p }) => ({
      ...p,
      enLigne: estEnLigne(p.derniereConnexion),
      nbProcessus: _count.processus,
      nbApplications: _count.applications,
      nbRemonteesOuvertes: remontees.length,
    }));
  }

  async detail(id: number) {
    const poste = await this.prisma.poste.findUniqueOrThrow({
      where: { id },
      select: {
        ...CHAMPS_POSTE,
        salle: true,
        applications: { include: { application: true }, orderBy: { application: { nom: 'asc' } } },
        materiels: { include: { type: true } },
        processus: { orderBy: [{ cpu: 'desc' }, { nom: 'asc' }] },
        reinstallations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { demandeur: { select: { nom: true, prenom: true } } },
        },
        remontees: { orderBy: { createdAt: 'desc' }, take: 10 },
        commandes: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    return { ...poste, enLigne: estEnLigne(poste.derniereConnexion) };
  }

  /** Crée le poste et renvoie le jeton de l'agent EN CLAIR — il ne sera plus jamais affiché. */
  async creer(dto: CreerPosteDto) {
    const jetonAgent = genererJetonAgent();
    const poste = await this.prisma.poste.create({
      data: { ...dto, hostname: dto.hostname.toUpperCase(), agentTokenHash: hacherJeton(jetonAgent) },
      select: CHAMPS_POSTE,
    });
    return { poste, jetonAgent };
  }

  async regenererJeton(id: number) {
    const jetonAgent = genererJetonAgent();
    await this.prisma.poste.update({ where: { id }, data: { agentTokenHash: hacherJeton(jetonAgent) } });
    return { jetonAgent };
  }

  /** Si le poste change de salle, le matériel qui lui est rattaché le suit (avec traçabilité). */
  async modifier(id: number, dto: ModifierPosteDto, auteurId: number) {
    return this.prisma.$transaction(async (tx) => {
      const avant = await tx.poste.findUniqueOrThrow({ where: { id }, include: { salle: true } });
      const poste = await tx.poste.update({
        where: { id },
        data: { ...dto, hostname: dto.hostname?.toUpperCase() },
        select: { ...CHAMPS_POSTE, salle: true },
      });
      if (dto.salleId && dto.salleId !== avant.salleId) {
        const materiels = await tx.materiel.findMany({ where: { posteId: id }, select: { id: true } });
        await tx.materiel.updateMany({ where: { posteId: id }, data: { salleId: dto.salleId } });
        await tx.mouvement.createMany({
          data: materiels.map((m) => ({
            materielId: m.id,
            deSalle: libelleSalle(avant.salle),
            versSalle: libelleSalle(poste.salle),
            dePoste: avant.hostname,
            versPoste: poste.hostname,
            motif: 'Déplacement du poste',
            auteurId,
          })),
        });
      }
      return poste;
    });
  }

  async supprimer(id: number) {
    await this.prisma.poste.delete({ where: { id } });
  }

  declarerApplication(posteId: number, dto: DeclarerApplicationDto) {
    return this.prisma.posteApplication.upsert({
      where: { posteId_applicationId: { posteId, applicationId: dto.applicationId } },
      create: { posteId, applicationId: dto.applicationId, version: dto.version },
      update: { version: dto.version },
      include: { application: true },
    });
  }

  async retirerApplication(posteId: number, applicationId: number) {
    await this.prisma.posteApplication.delete({
      where: { posteId_applicationId: { posteId, applicationId } },
    });
  }
}
