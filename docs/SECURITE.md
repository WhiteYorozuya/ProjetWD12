# Sécurité

Mesures mises en œuvre, rapprochées du référentiel OWASP Top 10 (2021).

| Risque OWASP | Mesures dans ASTER | Où |
|---|---|---|
| **A01 Contrôle d'accès** | Gardes globaux : toute route exige un JWT sauf `@Public()` explicite ; contrôle des rôles par route (`@Roles`) ; compte relu en base à chaque requête (désactivation immédiate) ; un agent ne peut acquitter que ses propres ordres | `common/guards`, `agent/agent.service.ts` |
| **A02 Défaillances cryptographiques** | Mots de passe hachés bcrypt (coût 12) ; jetons d'agent aléatoires 256 bits, seule l'empreinte SHA‑256 est stockée ; JWT HS256 avec secret ≥ 32 caractères vérifié au démarrage ; algorithme imposé à la vérification | `auth/`, `common/utils/jeton.ts`, `config/configuration.ts` |
| **A03 Injection** | Requêtes Prisma paramétrées ; requêtes SQL brutes uniquement en *tagged templates* (paramètres liés) ; validation stricte des DTO (`whitelist` + `forbidNonWhitelisted`) ; neutralisation des formules dans les exports CSV (`=`, `+`, `-`, `@`) ; échappement automatique par Vue (aucun `v-html`) | `app.setup.ts`, `common/utils/csv.ts` |
| **A04 Conception non sécurisée** | Import CSV « tout ou rien » avec simulation préalable ; modèle *pull* pour les agents (aucun port entrant sur les postes) ; actions destructrices confirmées ; préférence pour la réforme plutôt que la suppression | `materiels/`, `agent/` |
| **A05 Mauvaise configuration** | En-têtes de sécurité (Helmet côté API, CSP stricte côté Nginx, `X-Frame-Options: DENY`, `nosniff`) ; `server_tokens off` ; base sans port publié ; conteneurs exécutés sans root ; secrets uniquement par variables d'environnement (`.env` ignoré par Git) | `app.setup.ts`, `frontend/nginx.conf`, `Dockerfile`s |
| **A07 Identification et authentification** | Limitation de débit sur la connexion (Nginx 10/min + API 10/min) ; message d'erreur unique et temps de réponse constant que le compte existe ou non ; politique de mot de passe (12 caractères, 4 classes) ; expiration de session (8 h) ; jeton en `sessionStorage` effacé à la fermeture de l'onglet | `auth/`, `frontend/src/api/client.ts` |
| **A08 Intégrité** | Images Docker construites depuis les sources ; `npm ci` sur fichier de verrouillage en CI | `.github/workflows/ci.yml` |
| **A09 Journalisation** | Historique des mouvements de matériel (qui, quand, d'où, vers où, pourquoi) ; traçabilité des ordres aux agents (auteur, horodatages, résultat) ; acquittement des alertes nominatif ; erreurs SQL journalisées côté serveur, jamais renvoyées au client | `Mouvement`, `CommandeAgent`, `Alerte`, `prisma-exception.filter.ts` |
| **A10 SSRF** | L'API n'effectue aucun appel sortant à partir de données utilisateur | — |

## Points vérifiés par les tests e2e

- connexion refusée avec un message générique ; route protégée sans jeton → 401 ; jeton falsifié → 401 ;
- champ non prévu dans un DTO (ex. `id`) → 400 ;
- formateur qui tente d'ajouter du matériel ou de traiter une remontée → 403 ;
- aucune empreinte de mot de passe dans les réponses ;
- agent au jeton inconnu → 401.

## Pistes pour une mise en production

- HTTPS (certificat de l'école) terminé sur Nginx, avec HSTS ;
- authentification par l'annuaire (LDAP / Kerberos) à la place des comptes locaux ;
- jetons d'agent remplacés par des certificats clients (mTLS) ;
- sauvegarde quotidienne de la base (`pg_dump`) et supervision des journaux.
