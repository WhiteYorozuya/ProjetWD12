# ASTER

**A**dministration, **S**upervision, **T**raçabilité des **É**quipements et **R**essources.

Application web de **gestion du parc informatique et des salles de formation** pour les écoles de la DHRAT/PFORM.
Elle remplace le fichier Excel utilisé aujourd'hui : on sait à tout moment où se trouve chaque matériel, on enregistre
simplement le matériel arrivant du CND, on administre et supervise les postes des salles, et les formateurs disposent d'un
petit outil de supervision de leur salle.

| Module | Fonctions |
|---|---|
| **Gestion des matériels** | ajout (formulaire ou import CSV), recherche, affectation / déplacement entre salles et postes avec historique, durées d'aptitude, formations induites, export |
| **Administration des postes** | applications métier installées, réinstallation d'un poste, replaquage d'une salle, remontées des utilisateurs |
| **Supervision des postes** | vue temps réel de la salle, processus démarrés, autorisation / interdiction de processus, arrêt d'un processus, alertes, statistiques d'utilisation |
| **Pilotage** | tableau de bord (indicateurs et graphiques), états des lieux PDF, inventaire général |

## Stack technique

| Couche | Technologies |
|---|---|
| Langage | TypeScript partout |
| Front | Vue 3, Vite, Pinia, Vue Router, Chart.js |
| Back | NestJS 11 sur Fastify, validation `class-validator`, JWT, planificateur `@nestjs/schedule` |
| Base de données | PostgreSQL 16, ORM Prisma |
| API | REST documentée en OpenAPI / Swagger (`/api/docs`) |
| Tests | Jest (unitaires + e2e sur vraie base) côté Nest, Vitest + Vue Test Utils côté Vue |
| Infra | Docker (images multi-étapes, utilisateur non root), Nginx (reverse proxy + en-têtes de sécurité), GitHub Actions |

```mermaid
flowchart LR
  N[Navigateur] -->|HTTP :8080| X[Nginx<br/>frontend Vue + reverse proxy]
  X -->|/api| B[API NestJS / Fastify]
  B --> P[(PostgreSQL)]
  A[Agents des postes<br/>simulés en démo] -->|heartbeat 10 s<br/>X-Agent-Token| B
```

## Démarrage rapide — seul Docker est nécessaire

Prérequis : **Docker Desktop** (rien d'autre : ni Node, ni PostgreSQL).

```bash
docker compose up -d --build
```

- Application : <http://localhost:8080>
- Documentation de l'API : <http://localhost:8080/api/docs>
- Arrêter : `docker compose down` (ajouter `-v` pour repartir d'une base vide)

Au premier démarrage, la base est remplie avec des données de démonstration (3 salles + magasin, 24 postes,
~90 matériels, 7 jours d'historique) et l'**agent simulé** fait vivre les postes. Aucun fichier `.env` n'est
nécessaire : le secret JWT est généré automatiquement et conservé dans un volume Docker.

| Compte | Rôle | Mot de passe |
|---|---|---|
| `admin@aster.local` | Administrateur | `AsterDemo#2026` |
| `gestionnaire@aster.local` | Gestionnaire de matériel | `AsterDemo#2026` |
| `adminsalle@aster.local` | Administrateur de salle | `AsterDemo#2026` |
| `formateur@aster.local` | Formateur | `AsterDemo#2026` |

> Pour un vrai déploiement : copier `.env.example` en `.env`, changer `POSTGRES_PASSWORD`, mettre `SEED_DEMO=false`
> et retirer le service `agent` de `docker-compose.yml`.

### Depuis IntelliJ

Le dépôt contient deux configurations de lancement (dossier `.run/`), visibles dans la liste en haut à droite :

- **ASTER - démo (Docker)** : l'application complète, comme ci-dessus ;
- **ASTER - développement (Docker)** : l'environnement de développement ci-dessous.

Les conteneurs et leurs journaux apparaissent dans la fenêtre *Services* (Alt+8). Si les configurations
n'apparaissent pas : clic droit sur `docker-compose.yml` → *Run*.

## Développer sans installer Node

```bash
docker compose -f docker-compose.dev.yml up
```

Les dossiers `backend/`, `frontend/` et `agent/` sont montés dans des conteneurs Node : chaque modification du code est
prise en compte à chaud (l'API redémarre, la page se recharge). Le premier démarrage installe les dépendances (quelques
minutes).

- Interface : <http://localhost:5173>
- API et Swagger : <http://localhost:3000/api/docs>
- Base PostgreSQL : `localhost:5432`, utilisateur et mot de passe `aster` (onglet *Database* d'IntelliJ)

## Tests (dans Docker)

Avec l'environnement de développement démarré :

```bash
docker compose -f docker-compose.dev.yml exec backend npm test              # tests unitaires de l'API (Jest)
docker compose -f docker-compose.dev.yml exec backend sh ./docker-test-e2e.sh  # bout en bout, base aster_test dédiée
docker compose -f docker-compose.dev.yml exec frontend npm test             # tests de l'interface (Vitest)
```

Les mêmes tests, plus le lancement Docker complet, tournent dans GitHub Actions à chaque push.

Les tests e2e couvrent les parcours clés : authentification et droits, ajout / affectation / import de matériel,
heartbeat d'agent avec détection d'un processus interdit et arrêt automatique, replaquage d'une salle suivi jusqu'à la
fin, remontée traitée par l'administrateur de salle, tableau de bord et génération du PDF d'état des lieux.

## Scénario de démonstration (soutenance)

1. **Gestionnaire** — *Matériels* → *Importer un lot* avec `docs/exemple-import.csv` : vérification, puis import.
2. Sélectionner deux UC du magasin → *Déplacer la sélection* vers la salle 201, poste S201-P07. Ouvrir la fiche : l'historique trace le mouvement.
3. Filtre *Aptitude : échue* → les UC de 2020 de la salle 119 ressortent ; *Paramétrage* montre la durée par type.
4. **Formateur** — *Supervision*, salle 119 : les postes vivent en direct. Lorsqu'un stagiaire lance `steam.exe`, le poste passe en rouge, l'alerte remonte et le processus est arrêté automatiquement. Tuer manuellement un `firefox.exe`.
5. *Signaler un problème* sur un poste → **Admin de salle** le traite dans *Remontées*.
6. **Admin de salle** — Salle 105 → *Replaquer la salle* : suivre l'avancement du lot dans *Réinstallations* (≈45 s).
7. *Supervision* → ajouter une règle « interdire `notepad.exe` dans cette salle ».
8. *Documents* → état des lieux PDF de la salle 201 et inventaire général.
9. *Tableau de bord* et *Statistiques* : indicateurs, logiciels les plus utilisés, utilisation des salles.
10. `http://localhost:8080/api/docs` : contrat d'API pour les techniciens.

Avant la soutenance : `docker compose up -d --build` sur le poste de démonstration, puis ouvrir un onglet par compte.

## Organisation du dépôt

```
backend/     API NestJS (src/<module>/ : controller, service, dto), schéma et seed Prisma, tests
frontend/    Application Vue 3 (views/, components/, stores/, api/), configuration Nginx
agent/       Agent simulé (protocole heartbeat identique à un vrai agent)
docs/        Hypothèses fonctionnelles, backlog Scrum, architecture, sécurité
```

## Documentation projet

- [Hypothèses fonctionnelles et matrice des droits](docs/HYPOTHESES.md) — réponses retenues aux questions posées à la MOA
- [Backlog et organisation Scrum](docs/BACKLOG.md)
- [Architecture et modèle de données](docs/ARCHITECTURE.md)
- [Sécurité](docs/SECURITE.md)
