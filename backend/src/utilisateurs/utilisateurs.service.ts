import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hacherMotDePasse, motDePasseRobuste } from '../auth/mot-de-passe';
import { CreerUtilisateurDto, ModifierUtilisateurDto } from './utilisateurs.dto';

const SANS_MOT_DE_PASSE = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  role: true,
  actif: true,
  createdAt: true,
} as const;

const MESSAGE_POLITIQUE =
  'Le mot de passe doit contenir 12 caractères dont une majuscule, une minuscule, un chiffre et un caractère spécial';

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  lister() {
    return this.prisma.utilisateur.findMany({ select: SANS_MOT_DE_PASSE, orderBy: [{ nom: 'asc' }, { prenom: 'asc' }] });
  }

  async creer(dto: CreerUtilisateurDto) {
    if (!motDePasseRobuste(dto.motDePasse)) throw new BadRequestException(MESSAGE_POLITIQUE);
    const { motDePasse, ...donnees } = dto;
    return this.prisma.utilisateur.create({
      data: { ...donnees, email: dto.email.toLowerCase().trim(), passwordHash: await hacherMotDePasse(motDePasse) },
      select: SANS_MOT_DE_PASSE,
    });
  }

  modifier(id: number, dto: ModifierUtilisateurDto, auteurId: number) {
    if (id === auteurId && (dto.actif === false || (dto.role && dto.role !== 'ADMIN'))) {
      throw new BadRequestException('Vous ne pouvez pas vous désactiver ni retirer votre propre rôle administrateur');
    }
    return this.prisma.utilisateur.update({ where: { id }, data: dto, select: SANS_MOT_DE_PASSE });
  }

  async reinitialiserMotDePasse(id: number, motDePasse: string) {
    if (!motDePasseRobuste(motDePasse)) throw new BadRequestException(MESSAGE_POLITIQUE);
    await this.prisma.utilisateur.update({
      where: { id },
      data: { passwordHash: await hacherMotDePasse(motDePasse) },
    });
  }
}
