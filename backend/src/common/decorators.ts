import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PosteAgent, RequeteAuthentifiee, UtilisateurConnecte } from './types';

export const PUBLIC_KEY = 'estPublic';
/** Route accessible sans jeton JWT (connexion, agent). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restreint une route aux rôles indiqués. ADMIN a toujours accès. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Utilisateur authentifié de la requête. */
export const UtilisateurCourant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UtilisateurConnecte => {
    const req = ctx.switchToHttp().getRequest<RequeteAuthentifiee>();
    return req.user as UtilisateurConnecte;
  },
);

/** Poste identifié par le jeton de l'agent. */
export const PosteCourant = createParamDecorator((_: unknown, ctx: ExecutionContext): PosteAgent => {
  const req = ctx.switchToHttp().getRequest<RequeteAuthentifiee>();
  return req.poste as PosteAgent;
});
