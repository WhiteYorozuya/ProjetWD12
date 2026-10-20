# Hypothèses fonctionnelles (à valider avec la MOA)

Les questions de la capture initiale du besoin n'ayant pas encore reçu de réponse, l'équipe a retenu les hypothèses ci‑dessous.
Chacune est implémentée de façon **paramétrable** pour pouvoir être ajustée sans refonte.

| # | Question (fichier *Analyse*) | Hypothèse retenue | Où dans l'appli |
|---|---|---|---|
| 1 | Comment positionne‑t‑on une machine ? Un poste, une salle, un switch ? | Hiérarchie **Salle → Poste → Matériel**. Un matériel (UC, écran, clavier…) est affecté à une salle et, s'il y a lieu, à un poste. Un matériel d'infrastructure (switch, imprimante, vidéoprojecteur) est affecté à la salle sans poste. Le matériel non affecté est rangé dans une salle de type **MAGASIN**. | Matériels → *Affecter / déplacer* |
| 2 | Quel genre d'alerte sur l'utilisation des machines ? | 4 types : **processus interdit** détecté, **poste hors ligne** (plus de heartbeat depuis 2 min), **CPU élevé** (> 90 % sur 3 échantillons consécutifs), **aptitude expirée** d'un matériel. Les alertes s'acquittent. | Alertes, Tableau de bord |
| 3 | Que signifie replaquer une salle ? | **Réinstaller toutes les machines d'une salle à partir d'une image (master)**. L'application crée une demande de réinstallation par poste (regroupées dans un *lot*) ; l'ordre est transmis à l'agent du poste, qui remonte l'avancement. | Salles → *Replaquer la salle*, Réinstallations |
| 4 | Supervision des machines ? Quelles données ? | L'agent remonte toutes les 10 s : état en ligne, CPU %, RAM %, utilisateur connecté, liste des processus (PID, nom, utilisateur, CPU, mémoire) et applications installées. | Supervision |
| 5 | Enregistrer de façon simple ? | Formulaire court (n° de série, type, marque, modèle) **+ import CSV** d'un lot reçu du CND (aperçu avant validation, erreurs ligne par ligne) **+ export CSV**. | Matériels → *Importer / Exporter* |
| 6 | Quels sont les rôles ? | **ADMIN**, **GESTIONNAIRE** (matériel), **ADMIN_SALLE** (salle technique), **FORMATEUR**. Voir la matrice ci‑dessous. | Utilisateurs |
| 7 | Exemple de l'Excel utilisé ? | Non fourni. Le format CSV d'import reprend les colonnes classiques d'un inventaire : `numeroSerie;type;marque;modele;salle;etat;dateReception`. | `docs/exemple-import.csv` |
| 8 | Besoin d'un bouton import/export ? | Oui (cf. 5). | |
| 9 | Paramétrage des durées d'aptitude ? | Chaque **type de matériel** a une durée d'aptitude en mois (ex. UC : 60 mois). La **date de fin d'aptitude** = date de réception + durée. Le matériel arrivant à échéance sous 90 jours est signalé ; échu → alerte et proposition de réforme. | Paramétrage → Types de matériel |
| 10 | Paramétrage des formations induites ? | Formations qu'un utilisateur doit suivre pour utiliser/administrer un type de matériel (ex. *Switch* → « Administration réseau niveau 1 »). Liaison N‑N type ↔ formation, affichée sur la fiche matériel. | Paramétrage → Formations |
| 11 | Lancer la réinstallation : événement / todolist ? | **Événement suivi** : statut DEMANDÉE → EN COURS → TERMINÉE / ÉCHEC, horodaté, annulable tant que non démarré. | Réinstallations |
| 12 | Remontées de l'utilisateur : compte utilisateur ? | Oui, chaque remontée est rattachée à un compte (traçabilité). Les formateurs ont un compte. | Remontées |
| 13 | Applications métier installées : liste gérée par le gestionnaire ? | **Les deux** : un catalogue d'applications métier géré dans le paramétrage, et la liste réellement installée remontée par l'agent. Une application inconnue détectée est ajoutée au catalogue comme « non métier ». | Postes → fiche |
| 14 | Tuer un processus, ce n'est pas de la configuration ? | Action ponctuelle : un ordre **TUER_PROCESSUS** est déposé pour l'agent, exécuté au heartbeat suivant (≤ 10 s). Les processus **interdits** sont tués automatiquement et génèrent une alerte. | Supervision |
| 15 | Types de remontées utilisateur ? | Panne matériel, problème logiciel, réseau, demande de logiciel, autre — avec priorité (basse/normale/haute). | Remontées |
| 16 | Types de documents ? | **État des lieux de salle** (PDF : inventaire, état, cases de signature entrée/sortie) et **inventaire général** (PDF et CSV). | Documents |
| 17 | Tableau de bord : indicateurs ? | KPI : nb de matériels, en panne, postes en ligne / total, remontées ouvertes, alertes actives, aptitudes à échéance. Graphiques : matériels par état, par type, top processus (7 j), taux d'occupation des salles. | Tableau de bord, Statistiques |

## Matrice des droits

| Action | ADMIN | GESTIONNAIRE | ADMIN_SALLE | FORMATEUR |
|---|:-:|:-:|:-:|:-:|
| Consulter tableau de bord, salles, matériels, postes | ✔ | ✔ | ✔ | ✔ |
| Créer / modifier / affecter / importer du matériel | ✔ | ✔ | | |
| Gérer les salles | ✔ | ✔ | | |
| Paramétrage (types, durées, formations) | ✔ | ✔ | | |
| Gérer postes, applications, réinstallations | ✔ | | ✔ | |
| Règles de processus | ✔ | | ✔ | |
| Superviser les postes | ✔ | | ✔ | ✔ |
| Tuer un processus | ✔ | | ✔ | ✔ |
| Créer une remontée | ✔ | ✔ | ✔ | ✔ |
| Traiter une remontée | ✔ | | ✔ | |
| Acquitter une alerte | ✔ | ✔ | ✔ | |
| Générer les documents | ✔ | ✔ | ✔ | |
| Gérer les utilisateurs | ✔ | | | |

## Hypothèses techniques

- **Une instance par école** (pas de multi‑établissement dans cette version).
- **Agent simulé** pour la démonstration : un script remplace l'agent qui serait installé sur les postes. Le protocole (heartbeat HTTP + jeton par poste) est celui qu'utiliserait un vrai agent.
- La réinstallation réelle (WDS/MDT/FOG…) est hors périmètre : l'application **pilote et trace** la demande, l'agent fait l'appel à l'outil de déploiement.
