import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PUBLIC_KEY, ROLES_KEY } from '../decorators';
import { RequeteAuthentifiee } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const cibles = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, cibles)) return true;

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, cibles);
    if (!roles || roles.length === 0) return true; // tout utilisateur authentifié

    const { user } = context.switchToHttp().getRequest<RequeteAuthentifiee>();
    if (!user) throw new ForbiddenException();
    if (user.role === Role.ADMIN || roles.includes(user.role)) return true;

    throw new ForbiddenException("Vos droits ne permettent pas d'effectuer cette action");
  }
}
