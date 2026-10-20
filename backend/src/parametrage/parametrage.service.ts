import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplicationDto,
  FormationDto,
  ModifierApplicationDto,
  ModifierFormationDto,
  ModifierTypeMaterielDto,
  TypeMaterielDto,
} from './parametrage.dto';

@Injectable()
export class ParametrageService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────── Types de matériel & durées d'aptitude ───────────────

  listerTypes() {
    return this.prisma.typeMateriel.findMany({
      orderBy: { libelle: 'asc' },
      include: { formations: true, _count: { select: { materiels: true } } },
    });
  }

  creerType({ formationIds, ...dto }: TypeMaterielDto) {
    return this.prisma.typeMateriel.create({
      data: { ...dto, formations: formationIds ? { connect: formationIds.map((id) => ({ id })) } : undefined },
      include: { formations: true },
    });
  }

  modifierType(id: number, { formationIds, ...dto }: ModifierTypeMaterielDto) {
    return this.prisma.typeMateriel.update({
      where: { id },
      data: { ...dto, formations: formationIds ? { set: formationIds.map((fid) => ({ id: fid })) } : undefined },
      include: { formations: true },
    });
  }

  async supprimerType(id: number) {
    if (await this.prisma.materiel.count({ where: { typeId: id } })) {
      throw new ConflictException('Des matériels utilisent ce type');
    }
    await this.prisma.typeMateriel.delete({ where: { id } });
  }

  // ─────────────── Formations induites ───────────────

  listerFormations() {
    return this.prisma.formation.findMany({
      orderBy: { intitule: 'asc' },
      include: { typesMateriel: { select: { id: true, libelle: true } } },
    });
  }

  creerFormation(dto: FormationDto) {
    return this.prisma.formation.create({ data: dto });
  }

  modifierFormation(id: number, dto: ModifierFormationDto) {
    return this.prisma.formation.update({ where: { id }, data: dto });
  }

  async supprimerFormation(id: number) {
    await this.prisma.formation.delete({ where: { id } });
  }

  // ─────────────── Catalogue des applications ───────────────

  listerApplications() {
    return this.prisma.application.findMany({
      orderBy: [{ metier: 'desc' }, { nom: 'asc' }],
      include: { _count: { select: { postes: true } } },
    });
  }

  creerApplication(dto: ApplicationDto) {
    return this.prisma.application.create({ data: dto });
  }

  modifierApplication(id: number, dto: ModifierApplicationDto) {
    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async supprimerApplication(id: number) {
    await this.prisma.application.delete({ where: { id } });
  }
}
