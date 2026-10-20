import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PUBLIC_KEY, ROLES_KEY } from '../decorators';
import { RolesGuard } from './roles.guard';

function contexte(role: Role | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: 1, role } : undefined }) }),
  } as unknown as ExecutionContext;
}

function garde(metadonnees: Record<string, unknown>) {
  const reflector = { getAllAndOverride: (cle: string) => metadonnees[cle] } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('laisse passer une route sans restriction de rôle', () => {
    expect(garde({}).canActivate(contexte(Role.FORMATEUR))).toBe(true);
  });

  it('laisse passer une route publique', () => {
    expect(garde({ [PUBLIC_KEY]: true, [ROLES_KEY]: [Role.ADMIN] }).canActivate(contexte(undefined))).toBe(true);
  });

  it('autorise le rôle attendu', () => {
    expect(garde({ [ROLES_KEY]: [Role.GESTIONNAIRE] }).canActivate(contexte(Role.GESTIONNAIRE))).toBe(true);
  });

  it("donne toujours accès à l'administrateur", () => {
    expect(garde({ [ROLES_KEY]: [Role.FORMATEUR] }).canActivate(contexte(Role.ADMIN))).toBe(true);
  });

  it('refuse un autre rôle', () => {
    expect(() => garde({ [ROLES_KEY]: [Role.GESTIONNAIRE] }).canActivate(contexte(Role.FORMATEUR))).toThrow(
      ForbiddenException,
    );
  });
});
