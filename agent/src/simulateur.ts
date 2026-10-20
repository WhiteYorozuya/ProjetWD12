/**
 * Agent ParcForm SIMULÉ — pour la démonstration.
 *
 * Simule l'agent qui serait installé sur chaque poste : il envoie toutes les 10 s un heartbeat
 * (CPU, RAM, session, processus, applications) à l'API et exécute les ordres reçus
 * (arrêt de processus, réinstallation). Le protocole est exactement celui d'un vrai agent.
 *
 * Variables d'environnement :
 *  API_URL        URL de l'API (défaut http://localhost:3000/api)
 *  POSTES         noms d'hôtes simulés, séparés par des virgules (défaut : postes du jeu de démo)
 *  JETONS         JSON { "HOSTNAME": "jeton" } — sinon jeton de démo « demo-<hostname> »
 *  INTERVALLE     secondes entre deux heartbeats (défaut 10)
 *  PROBA_INTERDIT probabilité, par poste et par heartbeat, de lancer un processus interdit (défaut 0.004)
 */

export interface Processus {
  pid: number;
  nom: string;
  utilisateur?: string;
  cpu: number;
  memoireMo: number;
}

export interface Commande {
  id: number;
  type: 'TUER_PROCESSUS' | 'REINSTALLER';
  parametres: { pid?: number; nom?: string; image?: string };
}

interface ReponseHeartbeat {
  intervalleSecondes: number;
  processusInterdits: string[];
  commandes: Commande[];
}

const API_URL = (process.env.API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
const INTERVALLE = Number(process.env.INTERVALLE ?? 10) * 1000;
const PROBA_INTERDIT = Number(process.env.PROBA_INTERDIT ?? 0.004);
const DUREE_REINSTALLATION_MS = 45_000;

const POSTES_DEMO = [
  ...Array.from({ length: 8 }, (_, i) => `S201-P${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `S119-P${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 6 }, (_, i) => `S105-P${String(i + 1).padStart(2, '0')}`),
];

const SYSTEME = ['System', 'svchost.exe', 'explorer.exe', 'lsass.exe', 'csrss.exe', 'MsMpEng.exe'];
const LOGICIELS: Record<string, string[]> = {
  '201': ['firefox.exe', 'gns3.exe', 'putty.exe', 'wireshark.exe', 'soffice.exe'],
  '119': ['firefox.exe', 'soffice.exe', 'thunderbird.exe', 'moodle.exe'],
  '105': ['firefox.exe', 'wireshark.exe', 'virtualbox.exe', 'code.exe', 'putty.exe', 'nmap.exe'],
};
const APPLICATIONS: Record<string, { nom: string; version: string }[]> = {
  '201': [
    { nom: 'LibreOffice', version: '24.8' },
    { nom: 'Firefox ESR', version: '128.3' },
    { nom: 'GNS3', version: '2.2.50' },
    { nom: 'PuTTY', version: '0.81' },
    { nom: 'Wireshark', version: '4.4.0' },
  ],
  '119': [
    { nom: 'LibreOffice', version: '24.8' },
    { nom: 'Firefox ESR', version: '128.3' },
    { nom: 'Thunderbird', version: '128.3' },
    { nom: 'Moodle Desktop', version: '4.4' },
  ],
  '105': [
    { nom: 'Firefox ESR', version: '128.3' },
    { nom: 'Wireshark', version: '4.4.0' },
    { nom: 'VirtualBox', version: '7.1' },
    { nom: 'Visual Studio Code', version: '1.94' },
    { nom: 'PuTTY', version: '0.81' },
  ],
};
const INTERDITS_TENTANTS = ['steam.exe', 'discord.exe', 'epicgameslauncher.exe'];

const alea = (min: number, max: number) => min + Math.random() * (max - min);
const arrondi = (n: number) => Math.round(n * 10) / 10;

export function jetonPour(hostname: string, jetons: Record<string, string> = {}): string {
  return jetons[hostname] ?? `demo-${hostname.toLowerCase()}`;
}

export class PosteSimule {
  private processus: Processus[] = [];
  private prochainPid = 1000 + Math.floor(Math.random() * 5000);
  private utilisateur: string | null = null;
  private envoyerApplications = true;
  private reinstallationJusqua = 0;
  readonly salle: string;

  constructor(
    readonly hostname: string,
    private readonly jeton: string,
    private readonly numero: number,
  ) {
    this.salle = /^S(\d+)-/.exec(hostname)?.[1] ?? '119';
    this.demarrerSession();
  }

  private lancer(nom: string, utilisateur?: string) {
    this.processus.push({ pid: this.prochainPid++, nom, utilisateur, cpu: 0, memoireMo: alea(20, 400) });
  }

  private demarrerSession() {
    this.processus = [];
    SYSTEME.forEach((nom) => this.lancer(nom, 'SYSTEM'));
    // Un poste sur six reste sans session (stagiaire absent)
    this.utilisateur = this.numero % 6 === 5 ? null : `stagiaire${String(this.numero).padStart(2, '0')}`;
    if (this.utilisateur) {
      (LOGICIELS[this.salle] ?? LOGICIELS['119'])
        .filter(() => Math.random() < 0.6)
        .forEach((nom) => this.lancer(nom, this.utilisateur!));
    }
  }

  /** Évolution naturelle entre deux heartbeats : charge, ouverture/fermeture de logiciels. */
  private evoluer() {
    for (const p of this.processus) {
      const lourd = ['gns3.exe', 'virtualbox.exe', 'firefox.exe', 'code.exe'].includes(p.nom);
      p.cpu = arrondi(p.utilisateur === 'SYSTEM' ? alea(0, 2) : alea(0, lourd ? 35 : 10));
      p.memoireMo = arrondi(Math.max(10, p.memoireMo + alea(-15, 15)));
    }
    if (this.utilisateur && Math.random() < 0.08) {
      const candidats = (LOGICIELS[this.salle] ?? []).filter((n) => !this.processus.some((p) => p.nom === n));
      if (candidats.length) this.lancer(candidats[Math.floor(Math.random() * candidats.length)], this.utilisateur);
    }
    if (this.utilisateur && Math.random() < PROBA_INTERDIT) {
      const nom = INTERDITS_TENTANTS[Math.floor(Math.random() * INTERDITS_TENTANTS.length)];
      this.lancer(nom, this.utilisateur);
      console.log(`[${this.hostname}] ${this.utilisateur} lance ${nom}`);
    }
  }

  get enReinstallation() {
    return Date.now() < this.reinstallationJusqua;
  }

  construireHeartbeat() {
    this.evoluer();
    const cpu = Math.min(100, arrondi(this.processus.reduce((s, p) => s + p.cpu, 0) / 2 + alea(2, 6)));
    const ram = Math.min(100, arrondi(25 + this.processus.reduce((s, p) => s + p.memoireMo, 0) / 160));
    const corps: Record<string, unknown> = {
      cpu,
      ram,
      utilisateur: this.utilisateur ?? undefined,
      systeme: 'Windows 11 Entreprise 23H2',
      processus: this.processus,
    };
    if (this.envoyerApplications) {
      corps.applications = APPLICATIONS[this.salle] ?? [];
      this.envoyerApplications = false;
    }
    return corps;
  }

  async appeler<T>(chemin: string, corps: unknown): Promise<T> {
    const reponse = await fetch(`${API_URL}${chemin}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Agent-Token': this.jeton },
      body: JSON.stringify(corps),
    });
    if (!reponse.ok) throw new Error(`${reponse.status} ${await reponse.text()}`);
    return (await reponse.json()) as T;
  }

  async tick() {
    if (this.enReinstallation) return; // poste en cours de réinstallation : silencieux
    const reponse = await this.appeler<ReponseHeartbeat>('/agent/heartbeat', this.construireHeartbeat());
    for (const commande of reponse.commandes) await this.executer(commande);
  }

  async executer(commande: Commande) {
    if (commande.type === 'TUER_PROCESSUS') {
      const avant = this.processus.length;
      this.processus = this.processus.filter((p) => p.pid !== commande.parametres.pid);
      const ok = this.processus.length < avant;
      console.log(`[${this.hostname}] arrêt de ${commande.parametres.nom} (${commande.parametres.pid}) : ${ok ? 'fait' : 'déjà arrêté'}`);
      await this.appeler(`/agent/commandes/${commande.id}/resultat`, {
        statut: ok ? 'EXECUTEE' : 'ECHEC',
        message: ok ? undefined : 'Processus déjà terminé',
      });
    }

    if (commande.type === 'REINSTALLER') {
      console.log(`[${this.hostname}] réinstallation avec « ${commande.parametres.image} »`);
      await this.appeler(`/agent/commandes/${commande.id}/resultat`, { statut: 'EN_COURS', message: 'Déploiement de l’image' });
      this.reinstallationJusqua = Date.now() + DUREE_REINSTALLATION_MS;
      setTimeout(() => {
        this.demarrerSession();
        this.envoyerApplications = true;
        this.appeler(`/agent/commandes/${commande.id}/resultat`, {
          statut: 'EXECUTEE',
          message: `Image ${commande.parametres.image} déployée`,
        })
          .then(() => console.log(`[${this.hostname}] réinstallation terminée`))
          .catch((e: Error) => console.error(`[${this.hostname}] ${e.message}`));
      }, DUREE_REINSTALLATION_MS);
    }
  }
}

async function principal() {
  const hostnames = (process.env.POSTES ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  const jetons = process.env.JETONS ? (JSON.parse(process.env.JETONS) as Record<string, string>) : {};
  const postes = (hostnames.length ? hostnames : POSTES_DEMO).map(
    (h, i) => new PosteSimule(h, jetonPour(h, jetons), i + 1),
  );

  console.log(`Agent simulé : ${postes.length} postes → ${API_URL} (toutes les ${INTERVALLE / 1000} s)`);

  // Deux postes par salle restent éteints pour montrer l'état « hors ligne »
  const eteints = new Set(postes.filter((p) => /-P0[78]$|-P10$/.test(p.hostname)).map((p) => p.hostname));

  const boucle = async () => {
    await Promise.all(
      postes
        .filter((p) => !eteints.has(p.hostname))
        .map((p) => p.tick().catch((e: Error) => console.error(`[${p.hostname}] ${e.message}`))),
    );
  };
  await boucle();
  setInterval(boucle, INTERVALLE);
}

if (require.main === module) {
  void principal();
}
