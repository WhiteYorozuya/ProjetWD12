/**
 * Tests de bout en bout sur une vraie base PostgreSQL.
 * ⚠ La base pointée par DATABASE_URL est VIDÉE : utiliser une base dédiée aux tests, ex.
 *   DATABASE_URL=postgresql://parcform:parcform@localhost:5432/parcform_test npm run test:e2e
 * (appliquer d'abord le schéma : npx prisma migrate deploy)
 */
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Role, TypeRegle, TypeSalle } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { hacherMotDePasse } from '../src/auth/mot-de-passe';
import { hacherJeton } from '../src/common/utils/jeton';
import { PrismaService } from '../src/prisma/prisma.service';

const MDP = 'ParcForm#2026';

describe('ParcForm API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const jetons: Partial<Record<Role, string>> = {};
  let ids: { magasin: number; s201: number; typeUc: number; poste: number };

  const http = () => request(app.getHttpServer());
  const auth = (role: Role) => ({ Authorization: `Bearer ${jetons[role]}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await configureApp(app, { swagger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // Base propre
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename::text AS tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);

    const hash = await hacherMotDePasse(MDP);
    for (const role of Object.values(Role)) {
      await prisma.utilisateur.create({
        data: { email: `${role.toLowerCase()}@test.local`, nom: role, prenom: 'Test', role, passwordHash: hash },
      });
    }
    const magasin = await prisma.salle.create({ data: { code: 'MAG', nom: 'Magasin', type: TypeSalle.MAGASIN } });
    const s201 = await prisma.salle.create({ data: { code: '201', nom: 'Réseaux', type: TypeSalle.TECHNIQUE } });
    const typeUc = await prisma.typeMateriel.create({ data: { libelle: 'UC', dureeAptitudeMois: 60 } });
    const poste = await prisma.poste.create({
      data: { hostname: 'S201-P01', salleId: s201.id, agentTokenHash: hacherJeton('jeton-agent-de-test') },
    });
    await prisma.regleProcessus.create({ data: { nom: 'steam.exe', type: TypeRegle.INTERDIT } });
    ids = { magasin: magasin.id, s201: s201.id, typeUc: typeUc.id, poste: poste.id };

    for (const role of Object.values(Role)) {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: `${role.toLowerCase()}@test.local`, motDePasse: MDP })
        .expect(200);
      jetons[role] = res.body.jeton;
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Authentification et droits', () => {
    it('refuse un mauvais mot de passe sans préciser la cause', async () => {
      const res = await http().post('/api/auth/login').send({ email: 'admin@test.local', motDePasse: 'faux' }).expect(401);
      expect(res.body.message).toBe('Identifiants incorrects');
    });

    it('refuse une route protégée sans jeton', () => http().get('/api/materiels').expect(401));

    it('refuse un jeton falsifié', () =>
      http().get('/api/materiels').set('Authorization', 'Bearer eyJhbGciOiJub25lIn0.e30.').expect(401));

    it('rejette les champs inattendus (protection mass-assignment)', () =>
      http()
        .post('/api/materiels')
        .set(auth(Role.GESTIONNAIRE))
        .send({ numeroSerie: 'X1', typeId: ids.typeUc, marque: 'HP', modele: 'G9', id: 999 })
        .expect(400));

    it("interdit l'ajout de matériel à un formateur", () =>
      http()
        .post('/api/materiels')
        .set(auth(Role.FORMATEUR))
        .send({ numeroSerie: 'X2', typeId: ids.typeUc, marque: 'HP', modele: 'G9' })
        .expect(403));

    it('ne renvoie jamais les empreintes de mots de passe', async () => {
      const res = await http().get('/api/utilisateurs').set(auth(Role.ADMIN)).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });

  describe('Gestion des matériels', () => {
    let materielId: number;

    it('ajoute un matériel au magasin par défaut, en stock', async () => {
      const res = await http()
        .post('/api/materiels')
        .set(auth(Role.GESTIONNAIRE))
        .send({ numeroSerie: 'czc123', typeId: ids.typeUc, marque: 'HP', modele: 'EliteDesk' })
        .expect(201);
      materielId = res.body.id;
      expect(res.body.numeroSerie).toBe('CZC123');
      expect(res.body.salleId).toBe(ids.magasin);
      expect(res.body.etat).toBe('EN_STOCK');
      expect(res.body.statutAptitude).toBe('APTE');
    });

    it('refuse un numéro de série en double (409)', () =>
      http()
        .post('/api/materiels')
        .set(auth(Role.GESTIONNAIRE))
        .send({ numeroSerie: 'CZC123', typeId: ids.typeUc, marque: 'HP', modele: 'EliteDesk' })
        .expect(409));

    it("l'affecte à un poste : la salle suit, l'état passe en service, le mouvement est tracé", async () => {
      const res = await http()
        .post(`/api/materiels/${materielId}/affectation`)
        .set(auth(Role.GESTIONNAIRE))
        .send({ posteId: ids.poste, motif: 'Stage réseaux' })
        .expect(200);
      expect(res.body.salleId).toBe(ids.s201);
      expect(res.body.etat).toBe('EN_SERVICE');

      const fiche = await http().get(`/api/materiels/${materielId}`).set(auth(Role.FORMATEUR)).expect(200);
      expect(fiche.body.mouvements[0]).toMatchObject({ versPoste: 'S201-P01', motif: 'Stage réseaux' });
    });

    it('le retrouve par recherche', async () => {
      const res = await http().get('/api/materiels?recherche=czc').set(auth(Role.FORMATEUR)).expect(200);
      expect(res.body.total).toBe(1);
    });

    it('importe un lot CSV (tout ou rien)', async () => {
      const csv = 'numeroSerie;type;marque;modele;salle\nIMP1;UC;Dell;7010;201\nIMP2;UC;Dell;7010;\n';
      const res = await http().post('/api/materiels/import').set(auth(Role.GESTIONNAIRE)).send({ csv }).expect(200);
      expect(res.body).toMatchObject({ total: 2, importes: 2, erreurs: [] });
    });

    it("exporte l'inventaire en CSV", async () => {
      const res = await http().get('/api/materiels/export').set(auth(Role.GESTIONNAIRE)).expect(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('IMP1');
    });
  });

  describe('Supervision et agent', () => {
    const agent = { 'X-Agent-Token': 'jeton-agent-de-test' };

    it("refuse un agent au jeton inconnu", () =>
      http().post('/api/agent/heartbeat').set('X-Agent-Token', 'jeton-pirate-123').send({ cpu: 1, ram: 1, processus: [] }).expect(401));

    it('enregistre le heartbeat, détecte le processus interdit et ordonne son arrêt', async () => {
      const res = await http()
        .post('/api/agent/heartbeat')
        .set(agent)
        .send({
          cpu: 25,
          ram: 50,
          utilisateur: 'stagiaire01',
          processus: [
            { pid: 100, nom: 'firefox.exe', cpu: 10, memoireMo: 300 },
            { pid: 200, nom: 'Steam.exe', cpu: 5, memoireMo: 200 },
          ],
          applications: [{ nom: 'Firefox ESR', version: '128' }],
        })
        .expect(200);
      expect(res.body.processusInterdits).toContain('steam.exe');
      expect(res.body.commandes).toEqual([
        expect.objectContaining({ type: 'TUER_PROCESSUS', parametres: expect.objectContaining({ pid: 200 }) }),
      ]);

      const alertes = await http().get('/api/alertes?acquittee=false').set(auth(Role.ADMIN_SALLE)).expect(200);
      expect(alertes.body[0]).toMatchObject({ type: 'PROCESSUS_INTERDIT', posteId: ids.poste });
    });

    it('le formateur voit sa salle en temps réel et peut tuer un processus', async () => {
      const vue = await http().get(`/api/supervision/salles/${ids.s201}`).set(auth(Role.FORMATEUR)).expect(200);
      const poste = vue.body.postes[0];
      expect(poste.enLigne).toBe(true);
      expect(poste.processus.find((p: { pid: number }) => p.pid === 200).interdit).toBe(true);

      const cmd = await http()
        .post(`/api/supervision/postes/${ids.poste}/processus/100/tuer`)
        .set(auth(Role.FORMATEUR))
        .expect(202);
      const fin = await http()
        .post(`/api/agent/commandes/${cmd.body.id}/resultat`)
        .set(agent)
        .send({ statut: 'EXECUTEE' })
        .expect(200);
      expect(fin.body.ok).toBe(true);
    });

    it('replaque la salle et suit la réinstallation remontée par l’agent', async () => {
      const lot = await http().post(`/api/reinstallations/salle/${ids.s201}`).set(auth(Role.ADMIN_SALLE)).send({}).expect(201);
      expect(lot.body.creees).toBe(1);

      const hb = await http().post('/api/agent/heartbeat').set(agent).send({ cpu: 5, ram: 30, processus: [] }).expect(200);
      const ordre = hb.body.commandes.find((c: { type: string }) => c.type === 'REINSTALLER');
      expect(ordre).toBeDefined();

      await http().post(`/api/agent/commandes/${ordre.id}/resultat`).set(agent).send({ statut: 'EN_COURS' }).expect(200);
      await http().post(`/api/agent/commandes/${ordre.id}/resultat`).set(agent).send({ statut: 'EXECUTEE' }).expect(200);

      const liste = await http().get(`/api/reinstallations?lot=${lot.body.lot}`).set(auth(Role.ADMIN_SALLE)).expect(200);
      expect(liste.body[0].statut).toBe('TERMINEE');
    });
  });

  describe('Remontées, tableau de bord, documents', () => {
    it('un formateur signale un problème, l’admin de salle le résout', async () => {
      const r = await http()
        .post('/api/remontees')
        .set(auth(Role.FORMATEUR))
        .send({ type: 'PANNE_MATERIEL', titre: 'Écran noir', description: "L'écran ne s'allume plus", posteId: ids.poste })
        .expect(201);
      expect(r.body.salleId).toBe(ids.s201);

      await http().patch(`/api/remontees/${r.body.id}/traitement`).set(auth(Role.FORMATEUR)).send({ statut: 'RESOLUE' }).expect(403);
      const res = await http()
        .patch(`/api/remontees/${r.body.id}/traitement`)
        .set(auth(Role.ADMIN_SALLE))
        .send({ statut: 'RESOLUE', reponse: 'Câble changé' })
        .expect(200);
      expect(res.body.resolueLe).not.toBeNull();
    });

    it('renvoie les indicateurs du tableau de bord', async () => {
      const res = await http().get('/api/tableau-de-bord').set(auth(Role.FORMATEUR)).expect(200);
      expect(res.body.materiels.total).toBe(3);
      expect(res.body.postes).toEqual({ total: 1, enLigne: 1 });
      expect(res.body.topProcessus.length).toBeGreaterThan(0);
    });

    it("génère l'état des lieux PDF d'une salle", async () => {
      const res = await http()
        .get(`/api/documents/etat-des-lieux/salles/${ids.s201}`)
        .set(auth(Role.GESTIONNAIRE))
        .buffer(true)
        .parse((r, cb) => {
          const morceaux: Buffer[] = [];
          r.on('data', (m: Buffer) => morceaux.push(m));
          r.on('end', () => cb(null, Buffer.concat(morceaux)));
        })
        .expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
});
