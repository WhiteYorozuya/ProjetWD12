import { createHash, randomBytes } from 'node:crypto';

/** Génère un jeton d'agent aléatoire (affiché une seule fois à l'administrateur). */
export function genererJetonAgent(): string {
  return `pf_${randomBytes(32).toString('base64url')}`;
}

/** Seule l'empreinte SHA-256 du jeton est stockée en base. */
export function hacherJeton(jeton: string): string {
  return createHash('sha256').update(jeton, 'utf8').digest('hex');
}
