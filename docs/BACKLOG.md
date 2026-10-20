# Backlog produit — ASTER

Estimation en points (suite de Fibonacci). Priorité MoSCoW : **M**ust, **S**hould, **C**ould.
Définition de « terminé » (DoD) : code relu par un pair, tests unitaires verts, endpoint documenté dans Swagger, droits vérifiés, démo possible sur l'environnement Docker.

## Itération 1 — 23/10/2026 · Socle et gestion des matériels

| ID | En tant que… | je veux… | afin de… | Prio | Pts |
|---|---|---|---|:-:|:-:|
| US‑01 | utilisateur | me connecter avec mon e‑mail et mon mot de passe | accéder aux fonctions de mon rôle | M | 3 |
| US‑02 | administrateur | gérer les comptes et les rôles | contrôler les accès | M | 3 |
| US‑03 | gestionnaire | gérer les salles (code, nom, bâtiment, capacité, type) | positionner le matériel | M | 2 |
| US‑04 | gestionnaire | ajouter un matériel (n° de série, type, marque, modèle) | l'inventorier dès son arrivée du CND | M | 3 |
| US‑05 | gestionnaire | rechercher un matériel (texte, type, état, salle) | le retrouver rapidement | M | 3 |
| US‑06 | gestionnaire | affecter / déplacer un matériel vers une salle ou un poste | savoir où il se trouve à tout moment | M | 5 |
| US‑07 | gestionnaire | consulter l'historique des mouvements d'un matériel | assurer la traçabilité | S | 2 |
| US‑08 | gestionnaire | importer un lot de matériels en CSV et exporter l'inventaire | remplacer le fichier Excel | S | 5 |
| T‑01 | équipe | socle technique : monorepo, Docker, CI des tests, Swagger | travailler sur une base commune | M | 5 |

## Itération 2 — 06/11/2026 · Administration des postes et paramétrage

| ID | En tant que… | je veux… | afin de… | Prio | Pts |
|---|---|---|---|:-:|:-:|
| US‑09 | gestionnaire | paramétrer la durée d'aptitude par type de matériel | anticiper les réformes | M | 3 |
| US‑10 | gestionnaire | paramétrer les formations induites par type de matériel | connaître les formations nécessaires | S | 3 |
| US‑11 | admin de salle | déclarer un poste et obtenir le jeton de son agent | le superviser | M | 3 |
| US‑12 | admin de salle | voir les applications métier installées sur un poste | contrôler la conformité | M | 3 |
| US‑13 | admin de salle | lancer la réinstallation d'un poste | le remettre en état | M | 5 |
| US‑14 | admin de salle | replaquer une salle entière | préparer un nouveau stage | M | 3 |
| US‑15 | formateur | faire une remontée sur un poste ou une salle | signaler un problème | M | 3 |
| US‑16 | admin de salle | traiter les remontées (prise en charge, réponse, résolution) | assurer le suivi | M | 3 |

## Itération 3 — 13/11/2026 · Supervision, tableau de bord, documents

| ID | En tant que… | je veux… | afin de… | Prio | Pts |
|---|---|---|---|:-:|:-:|
| US‑17 | formateur | voir en temps réel l'état des postes de ma salle | superviser mon cours | M | 5 |
| US‑18 | formateur | voir les processus démarrés sur un poste et en tuer un | garder le contrôle du cours | M | 5 |
| US‑19 | admin de salle | autoriser / interdire une liste de processus (globale ou par salle) | appliquer la politique d'usage | M | 5 |
| US‑20 | admin de salle | recevoir des alertes (processus interdit, hors ligne, CPU, aptitude) | réagir rapidement | S | 5 |
| US‑21 | gestionnaire | consulter un tableau de bord (KPI + graphiques) | piloter le parc | M | 5 |
| US‑22 | admin de salle | consulter des statistiques d'utilisation (processus, occupation) | adapter les équipements | S | 3 |
| US‑23 | gestionnaire | générer l'état des lieux PDF d'une salle | faire les états des lieux d'entrée/sortie | M | 3 |
| US‑24 | gestionnaire | générer l'inventaire général (PDF/CSV) | rendre compte | S | 2 |

## Préparation soutenance — 19/11/2026

- Scénario de démo (voir README → *Scénario de démonstration*)
- Revue de sécurité (voir `docs/SECURITE.md`)
- Rétrospective finale et indicateurs de vélocité

## Cérémonies Scrum‑XP proposées

| Cérémonie | Fréquence | Durée |
|---|---|---|
| Sprint planning | début d'itération | 1 h |
| Daily meeting | chaque jour | 15 min |
| Revue de sprint (démo MOA) | fin d'itération | 30 min |
| Rétrospective | fin d'itération | 30 min |
| Pair programming / revue de code | sur chaque merge request | — |
