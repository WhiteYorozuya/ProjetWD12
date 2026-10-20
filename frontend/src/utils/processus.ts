/** Processus du système d'exploitation : jamais arrêtés depuis l'interface (l'API les protège aussi). */
export function estSysteme(p: { utilisateur: string | null }): boolean {
  const u = (p.utilisateur ?? '').toUpperCase();
  return u === 'SYSTEM' || u === 'SYSTÈME' || u === 'ROOT' || u.startsWith('NT AUTHORITY');
}
