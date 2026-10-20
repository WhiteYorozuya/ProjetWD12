import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StatutRemontee } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreerRemonteeDto, FiltreRemonteesDto, TraiterRemonteeDto } from './remontees.dto';

const INCLUDE = {
  salle: { select: { id: true, code: true, nom: true } },
  poste: { select: { id: true, hostname: true } },
  auteur: { select: { id: true, nom: true, prenom: true } },
  traitant: { select: { id: true, nom: true, prenom: true } },
} satisfies Prisma.RemonteeInclude;

@Injectable()
export class RemonteesService {
  constructor(private readonly prisma: PrismaService) {}

  lister(filtre: FiltreRemonteesDto, utilisateurId: number) {
    const where: Prisma.RemonteeWhereInput = {};
    if (filtre.statut) where.statut = filtre.statut;
    if (filtre.type) where.type = filtre.type;
    if (filtre.salleId) where.salleId = filtre.salleId;
    if (filtre.posteId) where.posteId = filtre.posteId;
    if (filtre.miennes) where.auteurId = utilisateurId;
    return this.prisma.remontee.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ statut: 'asc' }, { priorite: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  async creer(dto: CreerRemonteeDto, auteurId: number) {
    let salleId = dto.salleId;
    if (dto.posteId) {
      const poste = await this.prisma.poste.findUnique({ where: { id: dto.posteId } });
      if (!poste) throw new BadRequestException('Poste introuvable');
      if (salleId && salleId !== poste.salleId) throw new BadRequestException("Le poste n'est pas dans cette salle");
      salleId = poste.salleId;
    }
    if (!salleId) throw new BadRequestException('Indiquez une salle ou un poste');

    return this.prisma.remontee.create({
      data: {
        type: dto.type,
        priorite: dto.priorite,
        titre: dto.titre.trim(),
        description: dto.description.trim(),
        salleId,
        posteId: dto.posteId,
        auteurId,
      },
      include: INCLUDE,
    });
  }

  traiter(id: number, dto: TraiterRemonteeDto, traitantId: number) {
    return this.prisma.remontee.update({
      where: { id },
      data: {
        statut: dto.statut,
        reponse: dto.reponse,
        traitantId,
        resolueLe: dto.statut === StatutRemontee.RESOLUE ? new Date() : null,
      },
      include: INCLUDE,
    });
  }
}
