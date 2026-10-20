/**
 * Validation des variables d'environnement au démarrage :
 * l'application refuse de démarrer avec une configuration dangereuse.
 */
export function validerConfiguration(config: Record<string, unknown>) {
  const erreurs: string[] = [];

  if (!config.DATABASE_URL) erreurs.push('DATABASE_URL est obligatoire');

  const secret = String(config.JWT_SECRET ?? '');
  if (secret.length < 32) erreurs.push('JWT_SECRET doit contenir au moins 32 caractères');
  if (secret.startsWith('remplacer-par')) erreurs.push("JWT_SECRET n'a pas été personnalisé");

  if (erreurs.length > 0) {
    throw new Error(`Configuration invalide :\n - ${erreurs.join('\n - ')}`);
  }
  return config;
}

export const parametres = {
  /** Délai sans heartbeat au-delà duquel un poste est considéré hors ligne */
  horsLigneSecondes: () => Number(process.env.POSTE_HORS_LIGNE_SECONDES ?? 120),
  /** Seuil CPU déclenchant une alerte après 3 échantillons consécutifs */
  cpuAlerte: () => Number(process.env.CPU_ALERTE_POURCENT ?? 90),
};
