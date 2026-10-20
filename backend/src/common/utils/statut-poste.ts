import { parametres } from '../../config/configuration';

export function estEnLigne(derniereConnexion: Date | null | undefined, maintenant = new Date()): boolean {
  if (!derniereConnexion) return false;
  return maintenant.getTime() - derniereConnexion.getTime() <= parametres.horsLigneSecondes() * 1000;
}

export function limiteHorsLigne(maintenant = new Date()): Date {
  return new Date(maintenant.getTime() - parametres.horsLigneSecondes() * 1000);
}
