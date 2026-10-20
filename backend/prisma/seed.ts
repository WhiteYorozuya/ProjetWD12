/**
 * Jeu de données de démonstration.
 * Lancement : npm run seed  (la base doit être vide ou réinitialisée : npx prisma migrate reset)
 *
 * Variables :
 *  - SEED_MOT_DE_PASSE : mot de passe des comptes de démo (défaut : ParcForm#2026)
 *  - SEED_AGENT_DEMO=false : ne pas créer les jetons d'agent de démonstration
 */
import {
  EtatMateriel,
  Priorite,
  PrismaClient,
  Role,
  StatutRemontee,
  TypeRegle,
  TypeRemontee,
  TypeSalle,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();
const hacher = (jeton: string) => createHash('sha256').update(jeton, 'utf8').digest('hex');

/** Jeton déterministe utilisé par l'agent simulé (UNIQUEMENT pour la démo). */
export const jetonDemo = (hostname: string) => `demo-${hostname.toLowerCase()}`;

// Générateur pseudo-aléatoire déterministe : la démo est identique à chaque seed
let graine = 42;
const alea = () => {
  graine = (graine * 16807) % 2147483647;
  return (graine - 1) / 2147483646;
};
const entre = (min: number, max: number) => Math.floor(min + alea() * (max - min + 1));

async function main() {
  if ((await prisma.utilisateur.count()) > 0) {
    console.log('La base contient déjà des données : seed ignoré (npx prisma migrate reset pour repartir de zéro).');
    return;
  }

  // ─── Utilisateurs ───
  const motDePasse = process.env.SEED_MOT_DE_PASSE ?? 'ParcForm#2026';
  const hash = await bcrypt.hash(motDePasse, 12);
  const [, gestionnaire, adminSalle, formateur] = await Promise.all(
    [
      { email: 'admin@parcform.local', nom: 'MARTIN', prenom: 'Claire', role: Role.ADMIN },
      { email: 'gestionnaire@parcform.local', nom: 'DUBOIS', prenom: 'Julien', role: Role.GESTIONNAIRE },
      { email: 'adminsalle@parcform.local', nom: 'BERNARD', prenom: 'Sophie', role: Role.ADMIN_SALLE },
      { email: 'formateur@parcform.local', nom: 'PETIT', prenom: 'Antoine', role: Role.FORMATEUR },
    ].map((u) => prisma.utilisateur.create({ data: { ...u, passwordHash: hash } })),
  );

  // ─── Formations induites & types de matériel ───
  const formations = {
    reseau: await prisma.formation.create({
      data: { intitule: 'Administration réseau niveau 1', description: 'Configuration de base des commutateurs', dureeHeures: 14 },
    }),
    ssi: await prisma.formation.create({
      data: { intitule: 'Sensibilisation SSI', description: "Règles d'hygiène informatique du poste de travail", dureeHeures: 3 },
    }),
    tbi: await prisma.formation.create({
      data: { intitule: 'Prise en main du vidéoprojecteur interactif', dureeHeures: 2 },
    }),
    impression: await prisma.formation.create({
      data: { intitule: 'Gestion des imprimantes réseau', dureeHeures: 4 },
    }),
  };

  const defType = async (libelle: string, dureeAptitudeMois: number, f: { id: number }[] = []) =>
    prisma.typeMateriel.create({ data: { libelle, dureeAptitudeMois, formations: { connect: f.map(({ id }) => ({ id })) } } });
  const types = {
    uc: await defType('UC', 60, [formations.ssi]),
    portable: await defType('Portable', 48, [formations.ssi]),
    ecran: await defType('Écran', 84),
    clavier: await defType('Clavier', 36),
    souris: await defType('Souris', 36),
    switch: await defType('Switch', 96, [formations.reseau]),
    imprimante: await defType('Imprimante', 72, [formations.impression]),
    videoprojecteur: await defType('Vidéoprojecteur', 60, [formations.tbi]),
  };

  // ─── Salles ───
  const magasin = await prisma.salle.create({
    data: { code: 'MAG', nom: 'Magasin informatique', batiment: 'Bâtiment A', type: TypeSalle.MAGASIN },
  });
  const salles = [
    await prisma.salle.create({ data: { code: '201', nom: 'Salle réseaux', batiment: 'Bâtiment B', capacite: 8, type: TypeSalle.TECHNIQUE } }),
    await prisma.salle.create({ data: { code: '119', nom: 'Salle bureautique', batiment: 'Bâtiment B', capacite: 10, type: TypeSalle.COURS } }),
    await prisma.salle.create({ data: { code: '105', nom: 'Salle cyber', batiment: 'Bâtiment C', capacite: 6, type: TypeSalle.TECHNIQUE } }),
  ];
  const [s201, s119, s105] = salles;

  // ─── Catalogue d'applications ───
  const apps = await Promise.all(
    [
      { nom: 'LibreOffice', editeur: 'The Document Foundation' },
      { nom: 'Firefox ESR', editeur: 'Mozilla' },
      { nom: 'Thunderbird', editeur: 'Mozilla' },
      { nom: 'GNS3', editeur: 'GNS3 Technologies' },
      { nom: 'Wireshark', editeur: 'Wireshark Foundation' },
      { nom: 'VirtualBox', editeur: 'Oracle' },
      { nom: 'Visual Studio Code', editeur: 'Microsoft' },
      { nom: 'PuTTY', editeur: 'Simon Tatham' },
      { nom: 'Moodle Desktop', editeur: 'Moodle' },
    ].map((a) => prisma.application.create({ data: a })),
  );
  const app = (nom: string) => apps.find((a) => a.nom === nom)!;
  const appsParSalle: Record<number, string[]> = {
    [s201.id]: ['LibreOffice', 'Firefox ESR', 'GNS3', 'PuTTY', 'Wireshark'],
    [s119.id]: ['LibreOffice', 'Firefox ESR', 'Thunderbird', 'Moodle Desktop'],
    [s105.id]: ['Firefox ESR', 'Wireshark', 'VirtualBox', 'Visual Studio Code', 'PuTTY'],
  };

  // ─── Postes ───
  const agentDemo = process.env.SEED_AGENT_DEMO !== 'false';
  const postes = [];
  const plan: [typeof s201, number, string][] = [
    [s201, 8, '10.20.1.'],
    [s119, 10, '10.20.2.'],
    [s105, 6, '10.20.3.'],
  ];
  for (const [salle, nb, reseau] of plan) {
    for (let i = 1; i <= nb; i++) {
      const hostname = `S${salle.code}-P${String(i).padStart(2, '0')}`;
      const jeton = agentDemo ? jetonDemo(hostname) : `${hostname}-${Math.random()}-${Date.now()}`;
      const poste = await prisma.poste.create({
        data: {
          hostname,
          salleId: salle.id,
          adresseIp: `${reseau}${10 + i}`,
          systeme: 'Windows 11 Entreprise 23H2',
          agentTokenHash: hacher(jeton),
          applications: {
            create: appsParSalle[salle.id].map((nom) => ({ applicationId: app(nom).id, version: `${entre(1, 9)}.${entre(0, 20)}` })),
          },
        },
      });
      postes.push(poste);
    }
  }

  // ─── Matériels ───
  let compteur = 1000;
  const serie = (prefixe: string) => `${prefixe}${(compteur++).toString(36).toUpperCase()}${entre(100, 999)}`;
  const date = (annee: number, mois: number, jour = 15) => new Date(Date.UTC(annee, mois - 1, jour));

  const materiels: Parameters<typeof prisma.materiel.create>[0]['data'][] = [];
  for (const p of postes) {
    const ancien = p.hostname.startsWith('S119') && Number(p.hostname.slice(-2)) <= 4; // UC achetées en 2020/2021 : aptitude échue ou proche
    materiels.push(
      {
        numeroSerie: serie('CZC'),
        typeId: types.uc.id,
        marque: 'HP',
        modele: ancien ? 'EliteDesk 800 G5' : 'EliteDesk 800 G9',
        etat: EtatMateriel.EN_SERVICE,
        dateReception: ancien ? date(2020 + (Number(p.hostname.slice(-2)) % 2), 11 + (Number(p.hostname.slice(-2)) % 2)) : date(2024, 3),
        salleId: p.salleId,
        posteId: p.id,
      },
      {
        numeroSerie: serie('6CM'),
        typeId: types.ecran.id,
        marque: 'Dell',
        modele: 'P2423D',
        etat: EtatMateriel.EN_SERVICE,
        dateReception: date(2023, 9),
        salleId: p.salleId,
        posteId: p.id,
      },
      {
        numeroSerie: serie('KB'),
        typeId: types.clavier.id,
        marque: 'Logitech',
        modele: 'K120',
        etat: EtatMateriel.EN_SERVICE,
        dateReception: date(2024, 3),
        salleId: p.salleId,
        posteId: p.id,
      },
    );
  }
  for (const s of salles) {
    materiels.push(
      { numeroSerie: serie('SW'), typeId: types.switch.id, marque: 'Cisco', modele: 'Catalyst 2960-X', etat: EtatMateriel.EN_SERVICE, dateReception: date(2019, 6), salleId: s.id },
      { numeroSerie: serie('VP'), typeId: types.videoprojecteur.id, marque: 'Epson', modele: 'EB-735Fi', etat: EtatMateriel.EN_SERVICE, dateReception: date(2022, 1), salleId: s.id },
    );
  }
  materiels.push(
    { numeroSerie: serie('PRN'), typeId: types.imprimante.id, marque: 'Brother', modele: 'HL-L6400DW', etat: EtatMateriel.EN_PANNE, dateReception: date(2021, 5), salleId: s119.id, commentaire: 'Bourrage papier récurrent' },
    { numeroSerie: serie('SW'), typeId: types.switch.id, marque: 'Cisco', modele: 'Catalyst 9200', etat: EtatMateriel.EN_SERVICE, dateReception: date(2025, 2), salleId: s201.id, commentaire: 'Switch de TP' },
  );
  // Stock au magasin : arrivage récent du CND
  for (let i = 0; i < 6; i++) {
    materiels.push({ numeroSerie: serie('CZC'), typeId: types.uc.id, marque: 'HP', modele: 'EliteDesk 800 G9', etat: EtatMateriel.EN_STOCK, dateReception: date(2026, 9, 28), salleId: magasin.id });
  }
  for (let i = 0; i < 4; i++) {
    materiels.push({ numeroSerie: serie('5CD'), typeId: types.portable.id, marque: 'Dell', modele: 'Latitude 5440', etat: EtatMateriel.EN_STOCK, dateReception: date(2026, 9, 28), salleId: magasin.id });
  }
  materiels.push(
    { numeroSerie: serie('6CM'), typeId: types.ecran.id, marque: 'Dell', modele: 'P2419H', etat: EtatMateriel.EN_REPARATION, dateReception: date(2019, 4), salleId: magasin.id, commentaire: 'Dalle rayée — retour SAV' },
    { numeroSerie: serie('CZC'), typeId: types.uc.id, marque: 'HP', modele: 'EliteDesk 800 G3', etat: EtatMateriel.REFORME, dateReception: date(2017, 9), salleId: magasin.id },
  );

  const salleParId = new Map([magasin, ...salles].map((s) => [s.id, s]));
  const posteParId = new Map(postes.map((p) => [p.id, p]));
  for (const m of materiels) {
    const cree = await prisma.materiel.create({ data: m as never });
    const salle = cree.salleId ? salleParId.get(cree.salleId) : undefined;
    await prisma.mouvement.create({
      data: {
        materielId: cree.id,
        versSalle: salle ? `${salle.code} – ${salle.nom}` : null,
        versPoste: cree.posteId ? posteParId.get(cree.posteId)?.hostname : null,
        motif: 'Réception (CND) — reprise du fichier Excel',
        auteurId: gestionnaire.id,
        date: cree.dateReception,
      },
    });
  }

  // ─── Règles de processus ───
  await prisma.regleProcessus.createMany({
    data: [
      { nom: 'steam.exe', type: TypeRegle.INTERDIT, motif: 'Jeux interdits pendant les cours' },
      { nom: 'epicgameslauncher.exe', type: TypeRegle.INTERDIT, motif: 'Jeux interdits pendant les cours' },
      { nom: 'discord.exe', type: TypeRegle.INTERDIT, motif: 'Messagerie non autorisée' },
      { nom: 'utorrent.exe', type: TypeRegle.INTERDIT, motif: 'Téléchargement pair-à-pair interdit' },
      { nom: 'wireshark.exe', type: TypeRegle.INTERDIT, motif: 'Analyse réseau réservée aux salles techniques' },
      { nom: 'wireshark.exe', type: TypeRegle.AUTORISE, salleId: s201.id, motif: 'Nécessaire aux TP réseaux' },
      { nom: 'wireshark.exe', type: TypeRegle.AUTORISE, salleId: s105.id, motif: 'Nécessaire aux TP cyber' },
      { nom: 'nmap.exe', type: TypeRegle.INTERDIT, motif: 'Outil offensif' },
      { nom: 'nmap.exe', type: TypeRegle.AUTORISE, salleId: s105.id, motif: 'TP cyber encadrés' },
    ],
  });

  // ─── Remontées ───
  const poste = (h: string) => postes.find((p) => p.hostname === h)!;
  await prisma.remontee.createMany({
    data: [
      { type: TypeRemontee.PANNE_MATERIEL, priorite: Priorite.HAUTE, titre: "L'imprimante de la salle 119 bourre à chaque impression", description: 'Impossible d’imprimer les supports de cours depuis lundi.', salleId: s119.id, auteurId: formateur.id },
      { type: TypeRemontee.PROBLEME_LOGICIEL, priorite: Priorite.NORMALE, titre: 'GNS3 ne démarre pas', description: 'Message « VM GNS3 introuvable » au lancement.', salleId: s201.id, posteId: poste('S201-P03').id, auteurId: formateur.id, statut: StatutRemontee.EN_COURS, traitantId: adminSalle.id, reponse: 'Réimport de la VM prévu ce soir.' },
      { type: TypeRemontee.DEMANDE_LOGICIEL, priorite: Priorite.BASSE, titre: 'Installer Packet Tracer sur la salle 201', description: 'Pour le stage CCNA de novembre.', salleId: s201.id, auteurId: formateur.id },
      { type: TypeRemontee.RESEAU, priorite: Priorite.NORMALE, titre: 'Pas de réseau sur le poste 7', description: 'Câble probablement débranché.', salleId: s119.id, posteId: poste('S119-P07').id, auteurId: formateur.id, statut: StatutRemontee.RESOLUE, traitantId: adminSalle.id, reponse: 'Câble remplacé.', resolueLe: new Date() },
    ],
  });

  // ─── Historique d'utilisation (7 derniers jours) pour les statistiques ───
  const processusParSalle: Record<number, string[]> = {
    [s201.id]: ['firefox.exe', 'gns3.exe', 'putty.exe', 'wireshark.exe', 'soffice.exe', 'explorer.exe'],
    [s119.id]: ['firefox.exe', 'soffice.exe', 'thunderbird.exe', 'moodle.exe', 'explorer.exe'],
    [s105.id]: ['firefox.exe', 'wireshark.exe', 'virtualbox.exe', 'code.exe', 'putty.exe', 'explorer.exe'],
  };
  const PAS = 15 * 60; // un échantillon de synthèse toutes les 15 min
  const echantillons: { posteId: number; horodatage: Date; cpu: number; ram: number; sessionOuverte: boolean; dureeSecondes: number }[] = [];
  const stats = new Map<string, { posteId: number; jour: Date; nom: string; secondes: number }>();

  for (let j = 7; j >= 1; j--) {
    const jour = new Date();
    jour.setUTCHours(0, 0, 0, 0);
    jour.setUTCDate(jour.getUTCDate() - j);
    const jourSemaine = jour.getUTCDay();
    if (jourSemaine === 0 || jourSemaine === 6) continue; // pas de cours le week-end

    for (const p of postes) {
      if (alea() < 0.15) continue; // poste non utilisé ce jour-là
      const debut = entre(7, 9) * 3600;
      const fin = entre(15, 17) * 3600;
      for (let t = debut; t < fin; t += PAS) {
        const pause = t >= 12 * 3600 && t < 13 * 3600;
        echantillons.push({
          posteId: p.id,
          horodatage: new Date(jour.getTime() + t * 1000),
          cpu: pause ? entre(2, 8) : entre(8, 65),
          ram: entre(35, 75),
          sessionOuverte: !pause,
          dureeSecondes: PAS,
        });
        if (pause) continue;
        for (const nom of processusParSalle[p.salleId]) {
          if (alea() < 0.3) continue;
          const cle = `${p.id}|${jour.toISOString()}|${nom}`;
          const s = stats.get(cle) ?? { posteId: p.id, jour, nom, secondes: 0 };
          s.secondes += PAS;
          stats.set(cle, s);
        }
      }
    }
  }
  // Un incident simulé : Steam lancé un jour sur un poste de la 119
  const p119 = poste('S119-P05');
  const veille = new Date();
  veille.setUTCHours(0, 0, 0, 0);
  veille.setUTCDate(veille.getUTCDate() - 1);
  stats.set('steam', { posteId: p119.id, jour: veille, nom: 'steam.exe', secondes: 1800 });

  for (let i = 0; i < echantillons.length; i += 5000) {
    await prisma.echantillonUsage.createMany({ data: echantillons.slice(i, i + 5000) });
  }
  await prisma.statProcessus.createMany({ data: [...stats.values()] });

  console.log(`✔ Seed terminé : ${postes.length} postes, ${materiels.length} matériels, ${echantillons.length} échantillons.`);
  console.log(
    `  Comptes : admin@ / gestionnaire@ / adminsalle@ / formateur@parcform.local — mot de passe : ${
      process.env.SEED_MOT_DE_PASSE ? 'valeur de SEED_MOT_DE_PASSE' : motDePasse
    }`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
