import type {
  EtatMateriel,
  NiveauAlerte,
  Priorite,
  Role,
  StatutAptitude,
  StatutReinstallation,
  StatutRemontee,
  TypeAlerte,
  TypeRemontee,
  TypeSalle,
} from '@/api/types';

export const ROLES: Record<Role, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE: 'Gestionnaire de matériel',
  ADMIN_SALLE: 'Administrateur de salle',
  FORMATEUR: 'Formateur',
};

export const ETATS: Record<EtatMateriel, string> = {
  EN_STOCK: 'En stock',
  EN_SERVICE: 'En service',
  EN_PANNE: 'En panne',
  EN_REPARATION: 'En réparation',
  REFORME: 'Réformé',
};

export const APTITUDES: Record<StatutAptitude, string> = {
  APTE: 'Apte',
  ECHEANCE_PROCHE: 'Échéance proche',
  EXPIREE: 'Aptitude échue',
};

export const TYPES_SALLE: Record<TypeSalle, string> = {
  COURS: 'Salle de cours',
  TECHNIQUE: 'Salle technique',
  MAGASIN: 'Magasin',
};

export const TYPES_REMONTEE: Record<TypeRemontee, string> = {
  PANNE_MATERIEL: 'Panne matériel',
  PROBLEME_LOGICIEL: 'Problème logiciel',
  RESEAU: 'Réseau',
  DEMANDE_LOGICIEL: 'Demande de logiciel',
  AUTRE: 'Autre',
};

export const PRIORITES: Record<Priorite, string> = { BASSE: 'Basse', NORMALE: 'Normale', HAUTE: 'Haute' };

export const STATUTS_REMONTEE: Record<StatutRemontee, string> = {
  OUVERTE: 'Ouverte',
  EN_COURS: 'En cours',
  RESOLUE: 'Résolue',
};

export const STATUTS_REINSTALLATION: Record<StatutReinstallation, string> = {
  DEMANDEE: 'Demandée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ECHEC: 'Échec',
  ANNULEE: 'Annulée',
};

export const TYPES_ALERTE: Record<TypeAlerte, string> = {
  PROCESSUS_INTERDIT: 'Processus interdit',
  POSTE_HORS_LIGNE: 'Poste hors ligne',
  CPU_ELEVE: 'CPU élevé',
  APTITUDE_EXPIREE: 'Aptitude échue',
};

export const NIVEAUX: Record<NiveauAlerte, string> = {
  INFO: 'Info',
  AVERTISSEMENT: 'Avertissement',
  CRITIQUE: 'Critique',
};

/** Tonalité visuelle associée à une valeur (badge). */
export type Ton = 'ok' | 'info' | 'attention' | 'danger' | 'neutre';

export const TON_ETAT: Record<EtatMateriel, Ton> = {
  EN_SERVICE: 'ok',
  EN_STOCK: 'info',
  EN_PANNE: 'danger',
  EN_REPARATION: 'attention',
  REFORME: 'neutre',
};
export const TON_APTITUDE: Record<StatutAptitude, Ton> = { APTE: 'ok', ECHEANCE_PROCHE: 'attention', EXPIREE: 'danger' };
export const TON_REMONTEE: Record<StatutRemontee, Ton> = { OUVERTE: 'danger', EN_COURS: 'attention', RESOLUE: 'ok' };
export const TON_PRIORITE: Record<Priorite, Ton> = { BASSE: 'neutre', NORMALE: 'info', HAUTE: 'danger' };
export const TON_REINSTALLATION: Record<StatutReinstallation, Ton> = {
  DEMANDEE: 'info',
  EN_COURS: 'attention',
  TERMINEE: 'ok',
  ECHEC: 'danger',
  ANNULEE: 'neutre',
};
export const TON_NIVEAU: Record<NiveauAlerte, Ton> = { INFO: 'info', AVERTISSEMENT: 'attention', CRITIQUE: 'danger' };

export function date(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleDateString('fr-FR');
}

export function dateHeure(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/** « il y a 3 min », « il y a 2 h »… */
export function depuis(valeur: string | null | undefined, maintenant = Date.now()): string {
  if (!valeur) return 'jamais';
  const s = Math.max(0, Math.round((maintenant - new Date(valeur).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

export function pourcent(valeur: number | null | undefined): string {
  return valeur === null || valeur === undefined ? '—' : `${Math.round(valeur)} %`;
}

/** Valeur ISO AAAA-MM-JJ pour un <input type="date">. */
export function versInputDate(valeur: string | Date | null | undefined): string {
  if (!valeur) return '';
  return new Date(valeur).toISOString().slice(0, 10);
}
