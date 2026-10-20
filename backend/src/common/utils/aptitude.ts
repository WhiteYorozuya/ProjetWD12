export const JOURS_PREAVIS_APTITUDE = 90;

export type StatutAptitude = 'APTE' | 'ECHEANCE_PROCHE' | 'EXPIREE';

/** Date de fin d'aptitude = date de réception + durée d'aptitude du type (en mois). */
export function calculerFinAptitude(dateReception: Date, dureeMois: number): Date {
  const fin = new Date(dateReception.getTime());
  const jour = fin.getUTCDate();
  fin.setUTCDate(1);
  fin.setUTCMonth(fin.getUTCMonth() + dureeMois);
  // Gère les fins de mois (ex. 31 janvier + 1 mois → 28/29 février)
  const dernierJour = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() + 1, 0)).getUTCDate();
  fin.setUTCDate(Math.min(jour, dernierJour));
  return fin;
}

export function statutAptitude(finAptitude: Date, maintenant = new Date()): StatutAptitude {
  if (finAptitude.getTime() <= maintenant.getTime()) return 'EXPIREE';
  const preavis = JOURS_PREAVIS_APTITUDE * 24 * 3600 * 1000;
  if (finAptitude.getTime() - maintenant.getTime() <= preavis) return 'ECHEANCE_PROCHE';
  return 'APTE';
}
