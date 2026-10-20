import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { estEnLigne, limiteHorsLigne } from '../common/utils/statut-poste';
import { CreerSalleDto, ModifierSalleDto } from './salles.dto';

@Injectable()
export class SallesService {
  constructor(private readonly prisma: PrismaService) {}

  async lister() {
    const [salles, enLigne, remontees] = await Promise.all([
      this.prisma.salle.findMany({
        orderBy: { code: 'asc' },
        include: { _count: { select: { postes: true, materiels: true } } },
      }),
      this.prisma.poste.groupBy({
        by: ['salleId'],
        where: { derniereConnexion: { gte: limiteHorsLigne() } },
        _count: { _all: true },
      }),
      this.prisma.remontee.groupBy({
        by: ['salleId'],
        where: { statut: { not: 'RESOLUE' } },
        _count: { _all: true },
      }),
    ]);
    const enLigneParSalle = new Map(enLigne.map((e) => [e.salleId, e._count._all]));
    const remonteesParSalle = new Map(remontees.map((r) => [r.salleId, r._count._all]));

    return salles.map(({ _count, ...s }) => ({
      ...s,
      nbPostes: _count.postes,
      nbMateriels: _count.materiels,
      nbPostesEnLigne: enLigneParSalle.get(s.id) ?? 0,
      nbRemonteesOuvertes: remonteesParSalle.get(s.id) ?? 0,
    }));
  }

  async detail(id: number) {
    const salle = await this.prisma.salle.findUniqueOrThrow({
      where: { id },
      include: {
        postes: { orderBy: { hostname: 'asc' } },
        materiels: { include: { type: true, poste: { select: { hostname: true } } }, orderBy: { numeroSerie: 'asc' } },
      },
    });
    return {
      ...salle,
      postes: salle.postes.map(({ agentTokenHash: _h, ...p }) => ({ ...p, enLigne: estEnLigne(p.derniereConnexion) })),
    };
  }

  creer(dto: CreerSalleDto) {
    return this.prisma.salle.create({ data: dto });
  }

  modifier(id: number, dto: ModifierSalleDto) {
    return this.prisma.salle.update({ where: { id }, data: dto });
  }

  async supprimer(id: number) {
    const [postes, materiels] = await Promise.all([
      this.prisma.poste.count({ where: { salleId: id } }),
      this.prisma.materiel.count({ where: { salleId: id } }),
    ]);
    if (postes > 0 || materiels > 0) {
      throw new ConflictException('La salle contient encore des postes ou du matériel : déplacez-les avant de la supprimer');
    }
    await this.prisma.salle.delete({ where: { id } });
  }
}
