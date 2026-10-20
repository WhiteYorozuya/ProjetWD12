# Questions de cadrage du projet ASTER

Ce document regroupe les questions à poser au commanditaire avant de définir le périmètre, l’architecture et le backlog du projet. Les questions marquées **P0** conditionnent directement la faisabilité ou l’estimation des développements.

## 1. Vision et objectifs

- [ ] **P0** Quel problème doit être résolu en priorité par ASTER ?
- [ ] **P0** Quel résultat concret permettra de considérer le projet comme réussi ?
- [ ] **P0** Quel est le périmètre attendu pour la première version utilisable ?
- [ ] Quels défauts du fonctionnement actuel sous Excel faut-il corriger en priorité ?
- [ ] Quelles fonctionnalités peuvent être simulées, maquettées ou reportées ?
- [ ] Qui valide le besoin, les priorités et le résultat final ?

## 2. Périmètre organisationnel

- [ ] **P0** ASTER doit-il couvrir une seule école ou plusieurs établissements ?
- [ ] Une administration centrale doit-elle avoir une vue sur l’ensemble des écoles ?
- [ ] Quelles entités doivent être représentées : organisme, école, site, bâtiment, étage, salle ou autre ?
- [ ] Une salle peut-elle dépendre de plusieurs services ou formations ?
- [ ] Faut-il gérer des salles temporaires, fermées ou indisponibles ?
- [ ] Combien d’écoles, de salles, de postes et d’autres matériels sont concernés aujourd’hui ?

## 3. Utilisateurs, rôles et responsabilités

- [ ] **P0** Quelles catégories d’utilisateurs utiliseront réellement l’application ?
- [ ] Que recouvre précisément le terme « acteurs de la formation » ?
- [ ] Quelles actions un gestionnaire de matériel peut-il consulter, créer, modifier ou supprimer ?
- [ ] Quelles actions un administrateur de salle technique peut-il réaliser ?
- [ ] Quelles actions un formateur peut-il réaliser sur les postes de sa salle ?
- [ ] Les droits d’un formateur sont-ils limités à ses salles et à ses périodes de formation ?
- [ ] Existe-t-il un rôle de consultation seule ?
- [ ] Existe-t-il un rôle d’administrateur fonctionnel chargé du paramétrage ?
- [ ] Existe-t-il un rôle d’administrateur technique chargé de l’exploitation ?
- [ ] Un utilisateur peut-il cumuler plusieurs rôles ?
- [ ] Qui crée, modifie, désactive et réactive les comptes ?
- [ ] Qui autorise les opérations sensibles sur les postes ?
- [ ] Certaines opérations nécessitent-elles une validation par une seconde personne ?
- [ ] Faut-il déléguer temporairement des droits en cas d’absence ?

## 4. Modèle du parc informatique

- [ ] **P0** Qu’est-ce qu’un « matériel » dans ASTER ?
- [ ] **P0** Quelle différence faut-il faire entre matériel, machine, unité centrale et poste ?
- [ ] Un poste correspond-il à une unité centrale seule ou à un ensemble comprenant écran et périphériques ?
- [ ] Quels types de matériels doivent être gérés dans la première version ?
- [ ] Faut-il gérer les écrans, imprimantes, vidéoprojecteurs, commutateurs, bornes Wi-Fi et périphériques ?
- [ ] Les équipements réseau font-ils partie de l’inventaire ou de la topologie technique ?
- [ ] Peut-on créer de nouveaux types de matériels sans modifier l’application ?
- [ ] Quelles informations sont obligatoires pour chaque type de matériel ?
- [ ] Quel identifiant fait foi : numéro d’inventaire, numéro de série, étiquette interne ou autre ?
- [ ] Un matériel peut-il posséder plusieurs identifiants ?
- [ ] Faut-il gérer la marque, le modèle, le fournisseur, la date d’achat, la garantie et la valeur ?
- [ ] Faut-il gérer les caractéristiques techniques des machines ?
- [ ] Faut-il joindre des documents, photographies ou factures à une fiche matériel ?
- [ ] Faut-il imprimer des étiquettes, codes-barres ou QR codes ?
- [ ] Quelles règles empêchent la création de doublons ?

## 5. Localisation, affectation et cycle de vie

- [ ] **P0** Quel niveau de précision est attendu pour localiser un matériel ?
- [ ] Faut-il représenter le site, le bâtiment, l’étage, la salle, le bureau, la baie ou le port réseau ?
- [ ] Un matériel peut-il être affecté à une personne plutôt qu’à une salle ?
- [ ] Un matériel peut-il appartenir à un stock sans localisation précise ?
- [ ] Une affectation peut-elle être temporaire et comporter des dates de début et de fin ?
- [ ] Qui peut déplacer un matériel ?
- [ ] Un déplacement doit-il être validé avant de devenir effectif ?
- [ ] Faut-il gérer les mouvements groupés de plusieurs matériels ?
- [ ] Faut-il conserver l’historique complet des localisations et des affectations ?
- [ ] Quels sont les états possibles d’un matériel : en stock, affecté, prêté, en panne, en réparation, réformé ou autre ?
- [ ] Quelles transitions entre ces états sont autorisées ?
- [ ] Faut-il gérer les prêts, retours, pertes, vols, réparations et mises au rebut ?
- [ ] Faut-il réaliser des campagnes d’inventaire physique ?
- [ ] Comment un écart entre l’inventaire théorique et l’inventaire réel doit-il être traité ?

## 6. Matériels provenant du CND

- [ ] Que signifie précisément « matériel arrivant depuis le CND » ?
- [ ] Le CND fournit-il un fichier, une API, un bordereau ou un autre document ?
- [ ] Quelles informations accompagnent les matériels reçus ?
- [ ] Faut-il enregistrer une réception complète ou chaque équipement séparément ?
- [ ] Qui contrôle et valide la réception ?
- [ ] Comment traiter un matériel manquant, endommagé ou non conforme ?
- [ ] Faut-il conserver le lien entre un matériel et son bordereau de réception ?
- [ ] Une intégration automatique avec un système du CND est-elle possible ou attendue ?

## 7. Aptitudes et formations induites

- [ ] **P0** Que désigne exactement une « aptitude » dans le contexte du matériel ?
- [ ] L’aptitude concerne-t-elle un matériel, un utilisateur, une salle ou une formation ?
- [ ] Comment la date de début et la durée d’une aptitude sont-elles déterminées ?
- [ ] Que doit-il se passer lorsqu’une aptitude arrive à expiration ?
- [ ] Faut-il produire une alerte avant l’expiration ?
- [ ] Qui peut créer, modifier ou renouveler une aptitude ?
- [ ] **P0** Qu’est-ce qu’une « formation induite » ?
- [ ] La formation induite concerne-t-elle l’utilisation, la maintenance ou l’administration d’un matériel ?
- [ ] Faut-il seulement associer des formations à un matériel ou suivre les personnes formées ?
- [ ] Existe-t-il déjà un référentiel officiel des aptitudes et des formations ?
- [ ] ASTER doit-il échanger des données avec un système de gestion de la formation ?

## 8. Applications installées

- [ ] **P0** La liste des applications doit-elle être déclarée manuellement ou détectée automatiquement sur les postes ?
- [ ] Si elle est détectée, quel mécanisme ou outil existant fournit ces informations ?
- [ ] Qu’est-ce qui distingue une application métier d’une autre application ?
- [ ] Existe-t-il un référentiel officiel des applications métier ?
- [ ] Faut-il relever le nom, la version, l’éditeur, la date d’installation et la licence ?
- [ ] Faut-il distinguer les applications obligatoires, autorisées, tolérées et interdites ?
- [ ] Les règles dépendent-elles de l’école, de la salle, du poste ou de la formation en cours ?
- [ ] Faut-il détecter les versions absentes, obsolètes ou non conformes ?
- [ ] Faut-il conserver l’historique des logiciels installés ?
- [ ] Qui peut modifier le référentiel des applications ?
- [ ] ASTER doit-il installer ou désinstaller une application, ou seulement signaler sa présence ?

## 9. Réinstallation des postes et des salles

- [ ] **P0** Que signifie précisément « réinstaller » ou « replaquer » un poste ?
- [ ] **P0** ASTER doit-il exécuter la réinstallation, la déclencher dans un outil tiers ou seulement créer une demande ?
- [ ] Existe-t-il déjà un outil de déploiement d’images système ?
- [ ] Une API ou une interface d’automatisation de cet outil est-elle disponible ?
- [ ] Quels systèmes d’exploitation doivent être pris en charge ?
- [ ] Quelles images ou configurations de référence existent ?
- [ ] Qui crée, valide et publie une image de référence ?
- [ ] Comment choisir l’image à appliquer à un poste ou à une salle ?
- [ ] Une réinstallation doit-elle préserver certaines données locales ?
- [ ] Comment les données à préserver sont-elles sauvegardées et restaurées ?
- [ ] Une opération doit-elle être immédiate ou planifiée ?
- [ ] Faut-il vérifier que la salle est libre avant de démarrer ?
- [ ] Qui peut autoriser, annuler ou interrompre une réinstallation ?
- [ ] Faut-il demander une confirmation renforcée pour une salle complète ?
- [ ] Peut-on réinstaller seulement une partie des postes d’une salle ?
- [ ] Comment suivre la progression de l’opération ?
- [ ] Comment signaler un échec partiel ou total ?
- [ ] Une reprise automatique est-elle attendue après un échec ?
- [ ] Quel compte rendu doit être conservé après l’opération ?
- [ ] Combien de réinstallations simultanées l’infrastructure peut-elle supporter ?

## 10. Supervision des postes

- [ ] **P0** Que signifie « superviser un poste » pour le commanditaire ?
- [ ] **P0** La supervision doit-elle être en temps réel ou périodique ?
- [ ] Quelles données doivent remonter depuis chaque poste ?
- [ ] Faut-il connaître l’état en ligne ou hors ligne des machines ?
- [ ] Faut-il remonter les performances telles que CPU, mémoire, disque et réseau ?
- [ ] Faut-il remonter l’état des services, applications ou périphériques ?
- [ ] Quelle fréquence de collecte est nécessaire ?
- [ ] Quelle ancienneté maximale d’une donnée est acceptable à l’écran ?
- [ ] Faut-il conserver un historique des mesures ?
- [ ] Pendant combien de temps cet historique doit-il être conservé ?
- [ ] Un agent doit-il être installé sur les postes ?
- [ ] Si oui, qui déploie, configure et met à jour cet agent ?
- [ ] Les postes peuvent-ils joindre le serveur ou le serveur doit-il contacter les postes ?
- [ ] Comment gérer un poste temporairement déconnecté ?
- [ ] La supervision doit-elle fonctionner sur plusieurs segments réseau isolés ?

## 11. Processus autorisés, interdits et arrêtés

- [ ] **P0** Quels processus doivent être surveillés et pour quelle raison métier ?
- [ ] Comment un processus métier est-il identifié de manière fiable ?
- [ ] Les règles sont-elles globales ou propres à une école, une salle, un poste ou une formation ?
- [ ] « Autoriser » signifie-t-il simplement ne pas alerter ou permettre explicitement l’exécution ?
- [ ] « Interdire » signifie-t-il signaler, bloquer le lancement ou arrêter automatiquement ?
- [ ] Qui crée et valide les listes de processus autorisés ou interdits ?
- [ ] Comment gérer les changements de nom ou de version d’un programme ?
- [ ] Quels rôles peuvent arrêter un processus à distance ?
- [ ] Dans quelles situations l’arrêt d’un processus est-il autorisé ?
- [ ] L’utilisateur du poste doit-il être averti avant l’arrêt ?
- [ ] Une justification doit-elle être saisie avant une action distante ?
- [ ] Quelles protections empêchent l’arrêt d’un processus système critique ?
- [ ] Faut-il journaliser l’auteur, la date, le motif et le résultat de chaque action ?
- [ ] Existe-t-il des contraintes juridiques ou internes concernant la surveillance de l’activité des utilisateurs ?

## 12. Alertes

- [ ] **P0** Quels événements doivent générer une alerte ?
- [ ] Quels niveaux de gravité doivent être utilisés ?
- [ ] Qui reçoit chaque type d’alerte ?
- [ ] Les destinataires dépendent-ils de l’école, de la salle ou du matériel concerné ?
- [ ] Par quels canaux les alertes doivent-elles être transmises ?
- [ ] Quels seuils déclenchent une alerte ?
- [ ] Qui peut modifier ces seuils ?
- [ ] Faut-il déclencher une alerte dès le premier événement ou après plusieurs occurrences ?
- [ ] Comment regrouper les alertes identiques ou répétitives ?
- [ ] Quels statuts une alerte peut-elle prendre ?
- [ ] Faut-il affecter une alerte à un responsable ?
- [ ] Une alerte doit-elle posséder un délai de traitement ou une date d’échéance ?
- [ ] Faut-il prévoir une escalade automatique lorsqu’une alerte reste sans réponse ?
- [ ] Qui peut acquitter, clôturer ou rouvrir une alerte ?
- [ ] Faut-il conserver l’historique des alertes et de leur traitement ?

## 13. Remontées utilisateur

- [ ] **P0** Qu’est-ce qu’une remontée utilisateur : incident, demande, suggestion, questionnaire ou autre ?
- [ ] Qui peut créer une remontée ?
- [ ] L’utilisateur doit-il être authentifié ?
- [ ] Une remontée anonyme est-elle autorisée ?
- [ ] Quelles informations doivent obligatoirement être fournies ?
- [ ] La salle et le poste doivent-ils être détectés automatiquement ?
- [ ] Quelles catégories et priorités doivent être proposées ?
- [ ] L’utilisateur peut-il joindre une capture d’écran ou un document ?
- [ ] Quels formats et tailles de pièces jointes sont autorisés ?
- [ ] Quels statuts composent le cycle de traitement d’une remontée ?
- [ ] Qui reçoit et qualifie une nouvelle remontée ?
- [ ] Comment une remontée est-elle affectée à un intervenant ?
- [ ] L’utilisateur peut-il suivre son traitement et compléter sa demande ?
- [ ] Doit-il recevoir des notifications lors des changements de statut ?
- [ ] Une remontée peut-elle être transformée en alerte ou liée à une alerte existante ?
- [ ] Comment traiter les doublons concernant le même incident ?
- [ ] Faut-il mesurer les délais de prise en charge et de résolution ?

## 14. Tableau de bord et statistiques

- [ ] **P0** À quelles décisions le tableau de bord doit-il aider ?
- [ ] Quels indicateurs sont attendus par les gestionnaires de matériel ?
- [ ] Quels indicateurs sont attendus par les administrateurs techniques ?
- [ ] Quels indicateurs sont attendus par les formateurs ?
- [ ] Quels indicateurs sont attendus au niveau central ?
- [ ] Les données doivent-elles être instantanées, quotidiennes, hebdomadaires ou mensuelles ?
- [ ] Quels filtres doivent être disponibles ?
- [ ] Faut-il comparer des périodes, des écoles ou des salles ?
- [ ] Faut-il afficher des tendances et des historiques ?
- [ ] Les utilisateurs peuvent-ils personnaliser leur tableau de bord ?
- [ ] Faut-il permettre d’explorer le détail à partir d’un indicateur ?
- [ ] Les statistiques doivent-elles être exportables ?
- [ ] Sous quels formats les exports sont-ils attendus ?
- [ ] Existe-t-il des règles officielles de calcul des indicateurs ?
- [ ] Qui valide la définition et le calcul de chaque indicateur ?

## 15. Documents d’état des lieux

- [ ] **P0** Que doit contenir un document d’état des lieux ?
- [ ] À quel moment et dans quel but ce document est-il produit ?
- [ ] Le document concerne-t-il une salle, une école, une période ou un ensemble de matériels ?
- [ ] Existe-t-il un modèle officiel à respecter ?
- [ ] Quels champs, tableaux et indicateurs doivent y figurer ?
- [ ] Le document doit-il inclure des photographies ou des observations ?
- [ ] Quels formats sont nécessaires : PDF, Word, Excel ou impression papier ?
- [ ] Le document doit-il être signé ou validé ?
- [ ] Une numérotation officielle est-elle requise ?
- [ ] Faut-il archiver chaque version générée ?
- [ ] Un document déjà produit doit-il rester identique même si les données changent ensuite ?
- [ ] Qui peut générer, consulter et télécharger ces documents ?

## 16. Recherche, consultation et ergonomie

- [ ] Quelles informations les utilisateurs rechercheront-ils le plus souvent ?
- [ ] Quels critères de recherche et filtres sont nécessaires ?
- [ ] Faut-il permettre une recherche globale dans toute l’application ?
- [ ] Quels volumes de résultats doivent être affichés ou exportés ?
- [ ] Quelles actions groupées sont nécessaires ?
- [ ] Responsive ? L’interface doit-elle être utilisable sur tablette ou téléphone ?
- [ ] Quels navigateurs et versions doivent être pris en charge ?
- [ ] Existe-t-il des exigences d’accessibilité numérique ?
- [ ] L’application doit-elle être disponible dans plusieurs langues ?
- [ ] Faut-il proposer une aide intégrée ou un guide utilisateur ?

## 17. Reprise des fichiers Excel

- [ ] **P0** Peut-on obtenir des exemples (anonymisés) des fichiers Excel actuellement utilisés ?
- [ ] Toutes les écoles utilisent-elles le même modèle de fichier ?
- [ ] Quelles feuilles, colonnes, formules et règles métier sont utilisées ?
- [ ] Quel volume de données doit être repris ?
- [ ] Quelle est la qualité actuelle des données ?
- [ ] Qui corrigera les données incomplètes ou incohérentes avant l’import ?
- [ ] Comment faire correspondre les valeurs existantes avec les nouveaux référentiels ?
- [ ] Comment détecter et traiter les doublons ?
- [ ] Faut-il conserver les identifiants historiques ?
- [ ] L’import Excel est-il limité à la migration initiale ?
- [ ] Les utilisateurs doivent-ils pouvoir effectuer eux-mêmes de nouveaux imports ?
- [ ] Faut-il conserver un export Excel pour les échanges ou le mode dégradé ?
- [ ] Comment vérifier et valider le résultat d’une migration ?

## 18. Authentification et sécurité

- [ ] **P0** Quel système d’authentification doit être utilisé ?
- [ ] Une intégration à Active Directory, LDAP ou un SSO est-elle disponible ?
- [ ] L’authentification multifacteur est-elle requise ?
- [ ] Quelles règles de mot de passe s’appliquent si des comptes locaux sont utilisés ?
- [ ] Comment les comptes quittant l’organisation sont-ils désactivés ?
- [ ] Comment les droits sont-ils attribués et revus ?
- [ ] Faut-il limiter l’accès selon le réseau, le site ou le type de terminal ?
- [ ] Quelles données sont considérées comme sensibles ?
- [ ] Existe-t-il une classification de sécurité à respecter ?
- [ ] Quelles données personnelles seront enregistrées ?
- [ ] Quelles durées de conservation s’appliquent aux données et aux journaux ?
- [ ] Quelles actions doivent être tracées dans un journal d’audit ?
- [ ] Qui peut consulter les journaux d’audit ?
- [ ] Les journaux doivent-ils être protégés contre la modification ?
- [ ] Comment les éventuels agents installés sur les postes s’authentifient-ils auprès du serveur ?
- [ ] Comment les secrets, certificats et clés techniques sont-ils distribués et renouvelés ?

## 19. Architecture, réseau et intégrations

- [ ] **P0** Où l’application doit-elle être hébergée ?
- [ ] L’environnement cible dispose-t-il d’un accès à Internet ?
- [ ] Quels flux réseau entrants et sortants sont autorisés ?
- [ ] Les écoles sont-elles reliées au même réseau ?
- [ ] Existe-t-il des réseaux ou zones de sécurité séparés ?
- [ ] Les postes supervisés peuvent-ils communiquer directement avec le serveur ?
- [ ] Un fonctionnement partiel hors connexion est-il nécessaire ?
- [ ] Quels systèmes existants doivent être intégrés à ASTER ?
- [ ] Quelles API, documentations et plateformes de test sont disponibles ?
- [ ] Quelles technologies sont imposées, recommandées ou interdites ?
- [ ] Les composants open source sont-ils autorisés ?
- [ ] Existe-t-il des contraintes de licences logicielles ?
- [ ] L’utilisation de conteneurs est-elle autorisée dans l’environnement cible ?
- [ ] Quels environnements doivent être prévus : développement, test, recette et production ?
- [ ] Qui fournit et administre les serveurs, bases de données, certificats et noms de domaine ?

## 20. Volumétrie, performance et disponibilité

- [ ] Combien d’utilisateurs simultanés faut-il supporter ?
- [ ] Combien de postes peuvent remonter des données en même temps ?
- [ ] Quelle quantité de données de supervision sera produite par jour ?
- [ ] Quels temps de réponse sont attendus pour les principales actions ?
- [ ] Quelle durée maximale est acceptable pour un import ou un export ?
- [ ] Quelle disponibilité du service est requise ?
- [ ] Quelles périodes d’indisponibilité sont acceptables ?
- [ ] Quel délai de rétablissement est attendu après une panne ?
- [ ] Quelle quantité de données peut être perdue en cas d’incident ?
- [ ] Faut-il mettre en place de la haute disponibilité ?
- [ ] Quelles règles d’archivage ou de purge doivent limiter la croissance des données ?

## 21. Sauvegarde, exploitation et maintenance

- [ ] Qui surveillera le bon fonctionnement du serveur et des éventuels agents ?
- [ ] À quelle fréquence les sauvegardes doivent-elles être réalisées ?
- [ ] Où les sauvegardes doivent-elles être stockées ?
- [ ] À quelle fréquence une restauration doit-elle être testée ?
- [ ] Comment les mises à jour de l’application seront-elles déployées ?
- [ ] Comment les mises à jour des agents seront-elles déployées ?
- [ ] Une procédure de retour à la version précédente est-elle nécessaire ?
- [ ] Quels journaux techniques doivent être collectés ?
- [ ] Qui reçoit les alertes concernant le fonctionnement d’ASTER lui-même ?
- [ ] Quels outils de supervision technique sont déjà disponibles ?
- [ ] Quel niveau de documentation technique et d’exploitation est attendu ?
