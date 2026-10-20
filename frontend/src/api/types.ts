// Types partagés avec l'API (voir /api/docs pour le contrat complet)

export type Role = 'ADMIN' | 'GESTIONNAIRE' | 'ADMIN_SALLE' | 'FORMATEUR';
export type EtatMateriel = 'EN_STOCK' | 'EN_SERVICE' | 'EN_PANNE' | 'EN_REPARATION' | 'REFORME';
export type StatutAptitude = 'APTE' | 'ECHEANCE_PROCHE' | 'EXPIREE';
export type TypeSalle = 'COURS' | 'TECHNIQUE' | 'MAGASIN';
export type TypeRemontee = 'PANNE_MATERIEL' | 'PROBLEME_LOGICIEL' | 'RESEAU' | 'DEMANDE_LOGICIEL' | 'AUTRE';
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE';
export type StatutRemontee = 'OUVERTE' | 'EN_COURS' | 'RESOLUE';
export type StatutReinstallation = 'DEMANDEE' | 'EN_COURS' | 'TERMINEE' | 'ECHEC' | 'ANNULEE';
export type TypeAlerte = 'PROCESSUS_INTERDIT' | 'POSTE_HORS_LIGNE' | 'CPU_ELEVE' | 'APTITUDE_EXPIREE';
export type NiveauAlerte = 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE';
export type TypeRegle = 'AUTORISE' | 'INTERDIT';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  actif?: boolean;
  createdAt?: string;
}

export interface SalleRef {
  id: number;
  code: string;
  nom: string;
}

export interface Salle extends SalleRef {
  batiment: string | null;
  capacite: number;
  type: TypeSalle;
  nbPostes?: number;
  nbMateriels?: number;
  nbPostesEnLigne?: number;
  nbRemonteesOuvertes?: number;
}

export interface Formation {
  id: number;
  intitule: string;
  description: string | null;
  dureeHeures: number;
  typesMateriel?: { id: number; libelle: string }[];
}

export interface TypeMateriel {
  id: number;
  libelle: string;
  dureeAptitudeMois: number;
  formations?: Formation[];
  _count?: { materiels: number };
}

export interface Mouvement {
  id: number;
  deSalle: string | null;
  versSalle: string | null;
  dePoste: string | null;
  versPoste: string | null;
  motif: string | null;
  date: string;
  auteur: { nom: string; prenom: string };
}

export interface Materiel {
  id: number;
  numeroSerie: string;
  marque: string;
  modele: string;
  typeId: number;
  etat: EtatMateriel;
  dateReception: string;
  origine: string;
  salleId: number | null;
  posteId: number | null;
  commentaire: string | null;
  updatedAt: string;
  type: TypeMateriel;
  salle: SalleRef | null;
  poste: { id: number; hostname: string } | null;
  finAptitude: string;
  statutAptitude: StatutAptitude;
  mouvements?: Mouvement[];
}

export interface Page<T> {
  elements: T[];
  total: number;
  page: number;
  taille: number;
}

export interface Application {
  id: number;
  nom: string;
  editeur: string | null;
  metier: boolean;
  _count?: { postes: number };
}

export interface ProcessusActif {
  id: number;
  pid: number;
  nom: string;
  utilisateur: string | null;
  cpu: number;
  memoireMo: number;
  interdit?: boolean;
  arretDemande?: boolean;
}

export interface Poste {
  id: number;
  hostname: string;
  adresseIp: string | null;
  systeme: string | null;
  salleId: number;
  derniereConnexion: string | null;
  cpu: number | null;
  ram: number | null;
  utilisateurConnecte: string | null;
  enLigne: boolean;
  salle?: SalleRef;
  nbProcessus?: number;
  nbApplications?: number;
  nbRemonteesOuvertes?: number;
}

export interface Reinstallation {
  id: number;
  posteId: number;
  image: string;
  lot: string | null;
  statut: StatutReinstallation;
  message: string | null;
  createdAt: string;
  debut: string | null;
  fin: string | null;
  poste?: { id: number; hostname: string; salle: SalleRef };
  demandeur?: { nom: string; prenom: string };
}

export interface Remontee {
  id: number;
  type: TypeRemontee;
  priorite: Priorite;
  titre: string;
  description: string;
  statut: StatutRemontee;
  reponse: string | null;
  createdAt: string;
  resolueLe: string | null;
  salleId: number;
  posteId: number | null;
  salle?: SalleRef;
  poste?: { id: number; hostname: string } | null;
  auteur?: { id: number; nom: string; prenom: string };
  traitant?: { id: number; nom: string; prenom: string } | null;
}

export interface Commande {
  id: number;
  type: 'TUER_PROCESSUS' | 'REINSTALLER';
  statut: 'EN_ATTENTE' | 'ENVOYEE' | 'EXECUTEE' | 'ECHEC';
  parametres: Record<string, unknown>;
  resultat: string | null;
  createdAt: string;
}

export interface PosteDetail extends Poste {
  salle: Salle;
  applications: { application: Application; version: string | null; detecteLe: string }[];
  materiels: (Omit<Materiel, 'salle' | 'poste' | 'finAptitude' | 'statutAptitude'>)[];
  processus: ProcessusActif[];
  reinstallations: Reinstallation[];
  remontees: Remontee[];
  commandes: Commande[];
}

export interface Alerte {
  id: number;
  type: TypeAlerte;
  niveau: NiveauAlerte;
  message: string;
  acquittee: boolean;
  createdAt: string;
  acquitteeLe: string | null;
  salle?: SalleRef | null;
  poste?: { id: number; hostname: string } | null;
  materiel?: { id: number; numeroSerie: string } | null;
  acquitteePar?: { nom: string; prenom: string } | null;
}

export interface RegleProcessus {
  id: number;
  nom: string;
  type: TypeRegle;
  salleId: number | null;
  motif: string | null;
  salle: SalleRef | null;
}

export interface PosteSupervise {
  id: number;
  hostname: string;
  adresseIp: string | null;
  derniereConnexion: string | null;
  cpu: number | null;
  ram: number | null;
  utilisateurConnecte: string | null;
  enLigne: boolean;
  processus: ProcessusActif[];
  alertes: { id: number; type: TypeAlerte; message: string }[];
}

export interface VueSalle extends SalleRef {
  processusInterdits: string[];
  postes: PosteSupervise[];
}

export interface TableauDeBord {
  materiels: {
    total: number;
    parEtat: Partial<Record<EtatMateriel, number>>;
    parType: { type: string; nombre: number }[];
    aptitudesExpirees: number;
    aptitudesProches: number;
  };
  postes: { total: number; enLigne: number };
  remontees: { ouvertes: number; enCours: number };
  alertesActives: number;
  reinstallationsActives: number;
  dernieresAlertes: Alerte[];
  dernieresRemontees: Remontee[];
  topProcessus: StatProcessus[];
}

export interface StatProcessus {
  nom: string;
  heures: number;
  postes: number;
}

export interface OccupationSalle {
  salleId: number;
  code: string;
  nom: string;
  nbPostes: number;
  postesActifs: number;
  heuresUtilisation: number;
  cpuMoyen: number | null;
}

export interface ActiviteJour {
  jour: string;
  postesActifs: number;
  heuresUtilisation: number;
}

export interface BilanImport {
  total: number;
  valides: number;
  importes: number;
  erreurs: { ligne: number; message: string }[];
}
