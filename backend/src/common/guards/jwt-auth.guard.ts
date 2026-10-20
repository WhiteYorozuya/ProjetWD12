import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PUBLIC_KEY } from '../decorators';
import { JwtPayload, RequeteAuthentifiee } from '../types';

/**
 * Vérifie le jeton JWT (en-tête Authorization: Bearer …) sur toutes les routes non publiques.
 * Le compte est relu en base à chaque requête : un compte désactivé perd l'accès immédiatement.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const estPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublic) return true;

    const req = context.switchToHttp().getRequest<RequeteAuthentifiee>();
    const entete = req.headers.authorization ?? '';
    const [schema, jeton] = entete.split(' ');
    if (schema !== 'Bearer' || !jeton) {
      throw new UnauthorizedException('Authentification requise');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(jeton);
    } catch {
      throw new UnauthorizedException('Session expirée ou jeton invalide');
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true },
    });
    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedException('Compte inexistant ou désactivé');
    }

    const { actif: _actif, ...user } = utilisateur;
    req.user = user;
    return true;
  }
}
