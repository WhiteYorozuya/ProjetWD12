/**
 * Client HTTP de l'API : ajoute le jeton, traduit les erreurs en messages lisibles,
 * déconnecte l'utilisateur si la session a expiré.
 */

const BASE = '/api';
const CLE_JETON = 'parcform.jeton';

export class ErreurApi extends Error {
  constructor(
    public readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

let surSessionExpiree: (() => void) | null = null;
export function quandSessionExpiree(callback: () => void) {
  surSessionExpiree = callback;
}

// Le jeton est conservé en sessionStorage : il disparaît à la fermeture de l'onglet.
export const jeton = {
  lire: (): string | null => {
    try {
      return sessionStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  },
  ecrire: (valeur: string | null) => {
    try {
      if (valeur) sessionStorage.setItem(CLE_JETON, valeur);
      else sessionStorage.removeItem(CLE_JETON);
    } catch {
      /* stockage indisponible : la session ne survivra pas au rechargement */
    }
  },
};

type Requete = {
  methode?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  corps?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
};

export function construireUrl(chemin: string, params?: Requete['params']): string {
  const recherche = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== '') recherche.set(cle, String(valeur));
  });
  const qs = recherche.toString();
  return `${BASE}${chemin}${qs ? `?${qs}` : ''}`;
}

async function executer(chemin: string, { methode = 'GET', corps, params }: Requete = {}): Promise<Response> {
  const entetes: Record<string, string> = { Accept: 'application/json' };
  const j = jeton.lire();
  if (j) entetes.Authorization = `Bearer ${j}`;
  if (corps !== undefined) entetes['Content-Type'] = 'application/json';

  let reponse: Response;
  try {
    reponse = await fetch(construireUrl(chemin, params), {
      method: methode,
      headers: entetes,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ErreurApi(0, "Le serveur ne répond pas. Vérifiez votre connexion au réseau de l'école.");
  }

  if (!reponse.ok) {
    let message = `Erreur ${reponse.status}`;
    try {
      const donnees = await reponse.json();
      message = Array.isArray(donnees.message) ? donnees.message.join(' · ') : (donnees.message ?? message);
    } catch {
      /* corps non JSON */
    }
    if (reponse.status === 401 && j) surSessionExpiree?.();
    if (reponse.status === 403) message = "Vos droits ne permettent pas d'effectuer cette action.";
    throw new ErreurApi(reponse.status, message);
  }
  return reponse;
}

export async function api<T>(chemin: string, requete: Requete = {}): Promise<T> {
  const reponse = await executer(chemin, requete);
  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}

/** Télécharge un fichier (PDF, CSV) généré par l'API. */
export async function telecharger(chemin: string, nomParDefaut: string): Promise<void> {
  const reponse = await executer(chemin);
  const disposition = reponse.headers.get('Content-Disposition') ?? '';
  const nom = /filename="([^"]+)"/.exec(disposition)?.[1] ?? nomParDefaut;
  const url = URL.createObjectURL(await reponse.blob());
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
