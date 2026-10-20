import { Role } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export interface UtilisateurConnecte {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
}

export interface PosteAgent {
  id: number;
  hostname: string;
  salleId: number;
}

export type RequeteAuthentifiee = FastifyRequest & {
  user?: UtilisateurConnecte;
  poste?: PosteAgent;
};

export interface JwtPayload {
  sub: number;
  role: Role;
}
