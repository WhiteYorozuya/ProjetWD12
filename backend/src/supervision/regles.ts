import { RegleProcessus, TypeRegle } from '@prisma/client';

/**
 * Calcule la liste des processus interdits sur une salle.
 * - règles globales (salleId null) INTERDIT ;
 * - une règle AUTORISE propre à la salle lève une interdiction globale (exception) ;
 * - une règle INTERDIT propre à la salle s'ajoute.
 * Comparaison insensible à la casse.
 */
export function calculerInterdits(regles: Pick<RegleProcessus, 'nom' | 'type' | 'salleId'>[], salleId: number): Set<string> {
  const interdits = new Set<string>();
  for (const r of regles) {
    if (r.salleId === null && r.type === TypeRegle.INTERDIT) interdits.add(r.nom.toLowerCase());
  }
  for (const r of regles) {
    if (r.salleId !== salleId) continue;
    if (r.type === TypeRegle.AUTORISE) interdits.delete(r.nom.toLowerCase());
    else interdits.add(r.nom.toLowerCase());
  }
  return interdits;
}

/** Processus lancés par le système (SYSTEM, NT AUTHORITY\…, root) : protégés et exclus des statistiques. */
export function estProcessusSysteme(utilisateur: string | null | undefined): boolean {
  const u = (utilisateur ?? '').toUpperCase();
  return u === 'SYSTEM' || u === 'ROOT' || u.startsWith('NT AUTHORITY');
}
