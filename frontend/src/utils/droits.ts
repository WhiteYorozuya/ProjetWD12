import type { Role } from '@/api/types';

/** Matrice des droits — identique à docs/HYPOTHESES.md (l'API reste l'autorité). */
export const DROITS = {
  gererMateriel: ['GESTIONNAIRE'],
  gererSalles: ['GESTIONNAIRE'],
  parametrer: ['GESTIONNAIRE'],
  gererPostes: ['ADMIN_SALLE'],
  gererApplications: ['ADMIN_SALLE', 'GESTIONNAIRE'],
  gererRegles: ['ADMIN_SALLE'],
  superviser: ['ADMIN_SALLE', 'FORMATEUR'],
  tuerProcessus: ['ADMIN_SALLE', 'FORMATEUR'],
  traiterRemontees: ['ADMIN_SALLE'],
  acquitterAlertes: ['ADMIN_SALLE', 'GESTIONNAIRE'],
  documents: ['GESTIONNAIRE', 'ADMIN_SALLE'],
  gererUtilisateurs: [],
} satisfies Record<string, Role[]>;

export type Droit = keyof typeof DROITS;

export function aLeDroit(role: Role | undefined, droit: Droit): boolean {
  if (!role) return false;
  return role === 'ADMIN' || (DROITS[droit] as Role[]).includes(role);
}
