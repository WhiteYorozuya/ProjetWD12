-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTIONNAIRE', 'ADMIN_SALLE', 'FORMATEUR');

-- CreateEnum
CREATE TYPE "TypeSalle" AS ENUM ('COURS', 'TECHNIQUE', 'MAGASIN');

-- CreateEnum
CREATE TYPE "EtatMateriel" AS ENUM ('EN_STOCK', 'EN_SERVICE', 'EN_PANNE', 'EN_REPARATION', 'REFORME');

-- CreateEnum
CREATE TYPE "StatutReinstallation" AS ENUM ('DEMANDEE', 'EN_COURS', 'TERMINEE', 'ECHEC', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeRemontee" AS ENUM ('PANNE_MATERIEL', 'PROBLEME_LOGICIEL', 'RESEAU', 'DEMANDE_LOGICIEL', 'AUTRE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'NORMALE', 'HAUTE');

-- CreateEnum
CREATE TYPE "StatutRemontee" AS ENUM ('OUVERTE', 'EN_COURS', 'RESOLUE');

-- CreateEnum
CREATE TYPE "TypeRegle" AS ENUM ('AUTORISE', 'INTERDIT');

-- CreateEnum
CREATE TYPE "TypeCommande" AS ENUM ('TUER_PROCESSUS', 'REINSTALLER');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'ENVOYEE', 'EXECUTEE', 'ECHEC');

-- CreateEnum
CREATE TYPE "TypeAlerte" AS ENUM ('PROCESSUS_INTERDIT', 'POSTE_HORS_LIGNE', 'CPU_ELEVE', 'APTITUDE_EXPIREE');

-- CreateEnum
CREATE TYPE "NiveauAlerte" AS ENUM ('INFO', 'AVERTISSEMENT', 'CRITIQUE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "batiment" TEXT,
    "capacite" INTEGER NOT NULL DEFAULT 0,
    "type" "TypeSalle" NOT NULL DEFAULT 'COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postes" (
    "id" SERIAL NOT NULL,
    "hostname" TEXT NOT NULL,
    "adresseIp" TEXT,
    "systeme" TEXT,
    "salleId" INTEGER NOT NULL,
    "agentTokenHash" TEXT NOT NULL,
    "derniereConnexion" TIMESTAMP(3),
    "cpu" DOUBLE PRECISION,
    "ram" DOUBLE PRECISION,
    "utilisateurConnecte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_materiel" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "dureeAptitudeMois" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "types_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formations" (
    "id" SERIAL NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "dureeHeures" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiels" (
    "id" SERIAL NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "typeId" INTEGER NOT NULL,
    "etat" "EtatMateriel" NOT NULL DEFAULT 'EN_STOCK',
    "dateReception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origine" TEXT NOT NULL DEFAULT 'CND',
    "salleId" INTEGER,
    "posteId" INTEGER,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements" (
    "id" SERIAL NOT NULL,
    "materielId" INTEGER NOT NULL,
    "deSalle" TEXT,
    "versSalle" TEXT,
    "dePoste" TEXT,
    "versPoste" TEXT,
    "motif" TEXT,
    "auteurId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "editeur" TEXT,
    "metier" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postes_applications" (
    "posteId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "version" TEXT,
    "detecteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postes_applications_pkey" PRIMARY KEY ("posteId","applicationId")
);

-- CreateTable
CREATE TABLE "reinstallations" (
    "id" SERIAL NOT NULL,
    "posteId" INTEGER NOT NULL,
    "image" TEXT NOT NULL DEFAULT 'Master standard',
    "lot" TEXT,
    "statut" "StatutReinstallation" NOT NULL DEFAULT 'DEMANDEE',
    "message" TEXT,
    "demandeurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debut" TIMESTAMP(3),
    "fin" TIMESTAMP(3),

    CONSTRAINT "reinstallations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remontees" (
    "id" SERIAL NOT NULL,
    "type" "TypeRemontee" NOT NULL,
    "priorite" "Priorite" NOT NULL DEFAULT 'NORMALE',
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statut" "StatutRemontee" NOT NULL DEFAULT 'OUVERTE',
    "salleId" INTEGER NOT NULL,
    "posteId" INTEGER,
    "auteurId" INTEGER NOT NULL,
    "traitantId" INTEGER,
    "reponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolueLe" TIMESTAMP(3),

    CONSTRAINT "remontees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regles_processus" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeRegle" NOT NULL,
    "salleId" INTEGER,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regles_processus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processus_actifs" (
    "id" SERIAL NOT NULL,
    "posteId" INTEGER NOT NULL,
    "pid" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "utilisateur" TEXT,
    "cpu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoireMo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processus_actifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echantillons_usage" (
    "id" SERIAL NOT NULL,
    "posteId" INTEGER NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpu" DOUBLE PRECISION NOT NULL,
    "ram" DOUBLE PRECISION NOT NULL,
    "sessionOuverte" BOOLEAN NOT NULL DEFAULT false,
    "dureeSecondes" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "echantillons_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_processus" (
    "posteId" INTEGER NOT NULL,
    "jour" DATE NOT NULL,
    "nom" TEXT NOT NULL,
    "secondes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stats_processus_pkey" PRIMARY KEY ("posteId","jour","nom")
);

-- CreateTable
CREATE TABLE "commandes_agent" (
    "id" SERIAL NOT NULL,
    "posteId" INTEGER NOT NULL,
    "type" "TypeCommande" NOT NULL,
    "parametres" JSONB NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "resultat" TEXT,
    "auteurId" INTEGER,
    "reinstallationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoyeeLe" TIMESTAMP(3),
    "termineeLe" TIMESTAMP(3),

    CONSTRAINT "commandes_agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertes" (
    "id" SERIAL NOT NULL,
    "type" "TypeAlerte" NOT NULL,
    "niveau" "NiveauAlerte" NOT NULL DEFAULT 'AVERTISSEMENT',
    "message" TEXT NOT NULL,
    "salleId" INTEGER,
    "posteId" INTEGER,
    "materielId" INTEGER,
    "acquittee" BOOLEAN NOT NULL DEFAULT false,
    "acquitteeParId" INTEGER,
    "acquitteeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FormationsInduites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FormationsInduites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "salles_code_key" ON "salles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "postes_hostname_key" ON "postes"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "postes_agentTokenHash_key" ON "postes"("agentTokenHash");

-- CreateIndex
CREATE INDEX "postes_salleId_idx" ON "postes"("salleId");

-- CreateIndex
CREATE UNIQUE INDEX "types_materiel_libelle_key" ON "types_materiel"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "formations_intitule_key" ON "formations"("intitule");

-- CreateIndex
CREATE UNIQUE INDEX "materiels_numeroSerie_key" ON "materiels"("numeroSerie");

-- CreateIndex
CREATE INDEX "materiels_salleId_idx" ON "materiels"("salleId");

-- CreateIndex
CREATE INDEX "materiels_typeId_idx" ON "materiels"("typeId");

-- CreateIndex
CREATE INDEX "materiels_etat_idx" ON "materiels"("etat");

-- CreateIndex
CREATE INDEX "mouvements_materielId_idx" ON "mouvements"("materielId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_nom_key" ON "applications"("nom");

-- CreateIndex
CREATE INDEX "reinstallations_posteId_idx" ON "reinstallations"("posteId");

-- CreateIndex
CREATE INDEX "reinstallations_lot_idx" ON "reinstallations"("lot");

-- CreateIndex
CREATE INDEX "remontees_statut_idx" ON "remontees"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "regles_processus_nom_salleId_key" ON "regles_processus"("nom", "salleId");

-- CreateIndex
CREATE INDEX "processus_actifs_posteId_idx" ON "processus_actifs"("posteId");

-- CreateIndex
CREATE INDEX "echantillons_usage_posteId_horodatage_idx" ON "echantillons_usage"("posteId", "horodatage");

-- CreateIndex
CREATE INDEX "stats_processus_jour_idx" ON "stats_processus"("jour");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_agent_reinstallationId_key" ON "commandes_agent"("reinstallationId");

-- CreateIndex
CREATE INDEX "commandes_agent_posteId_statut_idx" ON "commandes_agent"("posteId", "statut");

-- CreateIndex
CREATE INDEX "alertes_acquittee_createdAt_idx" ON "alertes"("acquittee", "createdAt");

-- CreateIndex
CREATE INDEX "_FormationsInduites_B_index" ON "_FormationsInduites"("B");

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "types_materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements" ADD CONSTRAINT "mouvements_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements" ADD CONSTRAINT "mouvements_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes_applications" ADD CONSTRAINT "postes_applications_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes_applications" ADD CONSTRAINT "postes_applications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reinstallations" ADD CONSTRAINT "reinstallations_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reinstallations" ADD CONSTRAINT "reinstallations_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remontees" ADD CONSTRAINT "remontees_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remontees" ADD CONSTRAINT "remontees_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remontees" ADD CONSTRAINT "remontees_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remontees" ADD CONSTRAINT "remontees_traitantId_fkey" FOREIGN KEY ("traitantId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles_processus" ADD CONSTRAINT "regles_processus_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processus_actifs" ADD CONSTRAINT "processus_actifs_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "echantillons_usage" ADD CONSTRAINT "echantillons_usage_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stats_processus" ADD CONSTRAINT "stats_processus_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_agent" ADD CONSTRAINT "commandes_agent_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_agent" ADD CONSTRAINT "commandes_agent_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_agent" ADD CONSTRAINT "commandes_agent_reinstallationId_fkey" FOREIGN KEY ("reinstallationId") REFERENCES "reinstallations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_acquitteeParId_fkey" FOREIGN KEY ("acquitteeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormationsInduites" ADD CONSTRAINT "_FormationsInduites_A_fkey" FOREIGN KEY ("A") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormationsInduites" ADD CONSTRAINT "_FormationsInduites_B_fkey" FOREIGN KEY ("B") REFERENCES "types_materiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
