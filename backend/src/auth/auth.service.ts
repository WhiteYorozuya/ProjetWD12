import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, UtilisateurConnecte } from '../common/types';
import { hacherMotDePasse, motDePasseRobuste, verifierMotDePasse } from './mot-de-passe';

// Empreinte factice : évite de révéler par le temps de réponse qu'un e-mail n'existe pas.
const HASH_FACTICE = bcrypt.hashSync('compte-inexistant', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async connecter(email: string, motDePasse: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    const valide = await verifierMotDePasse(motDePasse, utilisateur?.passwordHash ?? HASH_FACTICE);
    if (!utilisateur || !valide || !utilisateur.actif) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const payload: JwtPayload = { sub: utilisateur.id, role: utilisateur.role };
    const jeton = await this.jwt.signAsync(payload);

    const user: UtilisateurConnecte = {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
    };
    return { jeton, utilisateur: user };
  }

  async changerMotDePasse(id: number, ancien: string, nouveau: string) {
    const utilisateur = await this.prisma.utilisateur.findUniqueOrThrow({ where: { id } });
    if (!(await verifierMotDePasse(ancien, utilisateur.passwordHash))) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }
    if (!motDePasseRobuste(nouveau)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir 12 caractères dont une majuscule, une minuscule, un chiffre et un caractère spécial',
      );
    }
    await this.prisma.utilisateur.update({
      where: { id },
      data: { passwordHash: await hacherMotDePasse(nouveau) },
    });
  }
}
