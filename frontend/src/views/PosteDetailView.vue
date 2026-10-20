<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { Application, PosteDetail } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import JaugeUsage from '@/components/JaugeUsage.vue';
import JetonAgent from '@/components/JetonAgent.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import {
  ETATS,
  STATUTS_REINSTALLATION,
  STATUTS_REMONTEE,
  TON_ETAT,
  TON_REINSTALLATION,
  TON_REMONTEE,
  dateHeure,
  depuis,
} from '@/utils/format';

const props = defineProps<{ id: number }>();
const auth = useAuthStore();
const notifications = useNotificationsStore();
const router = useRouter();

const poste = ref<PosteDetail | null>(null);
const catalogue = ref<Application[]>([]);
const modale = ref<'reinstaller' | 'application' | 'jeton' | null>(null);
const image = ref('Master standard');
const applicationId = ref<number | null>(null);
const version = ref('');
const nouveauJeton = ref('');

async function charger() {
  try {
    poste.value = await api<PosteDetail>(`/postes/${props.id}`);
  } catch (e) {
    notifications.erreur(e);
  }
}

let minuterie: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void charger();
  minuterie = setInterval(charger, 10_000);
});
onUnmounted(() => clearInterval(minuterie));

const reinstallationActive = computed(() =>
  poste.value?.reinstallations.some((r) => r.statut === 'DEMANDEE' || r.statut === 'EN_COURS'),
);

async function tuer(pid: number, nom: string) {
  try {
    await api(`/supervision/postes/${props.id}/processus/${pid}/tuer`, { methode: 'POST' });
    notifications.succes(`Arrêt de ${nom} demandé : exécuté par le poste dans les 10 secondes`);
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function reinstaller() {
  try {
    await api(`/reinstallations/poste/${props.id}`, { methode: 'POST', corps: { image: image.value } });
    modale.value = null;
    notifications.succes('Réinstallation demandée');
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function ouvrirAjoutApplication() {
  catalogue.value = await api<Application[]>('/applications');
  applicationId.value = null;
  version.value = '';
  modale.value = 'application';
}

async function declarerApplication() {
  try {
    await api(`/postes/${props.id}/applications`, {
      methode: 'POST',
      corps: { applicationId: applicationId.value, version: version.value || undefined },
    });
    modale.value = null;
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function retirerApplication(id: number) {
  try {
    await api(`/postes/${props.id}/applications/${id}`, { methode: 'DELETE' });
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function regenererJeton() {
  if (!confirm("L'agent actuel du poste sera déconnecté jusqu'à ce que le nouveau jeton soit installé. Continuer ?")) return;
  try {
    nouveauJeton.value = (await api<{ jetonAgent: string }>(`/postes/${props.id}/jeton`, { methode: 'POST' })).jetonAgent;
    modale.value = 'jeton';
  } catch (e) {
    notifications.erreur(e);
  }
}

async function supprimer() {
  if (!confirm(`Supprimer le poste ${poste.value?.hostname} ? Son matériel restera dans la salle.`)) return;
  try {
    await api(`/postes/${props.id}`, { methode: 'DELETE' });
    notifications.succes('Poste supprimé');
    void router.push({ name: 'postes' });
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div v-if="poste">
    <p>
      <RouterLink :to="{ name: 'salle', params: { id: poste.salle.id } }">Salle {{ poste.salle.code }}</RouterLink>
    </p>
    <header class="entete-page">
      <div>
        <h1><span class="etiquette poste grande">{{ poste.hostname }}</span></h1>
        <p>
          <span :class="poste.enLigne ? 'en-ligne' : 'hors-ligne'">{{ poste.enLigne ? 'En ligne' : 'Hors ligne' }}</span>
          — dernier contact {{ depuis(poste.derniereConnexion) }}
        </p>
      </div>
      <div class="boutons">
        <RouterLink :to="{ name: 'remontees', query: { nouveau: '1', posteId: poste.id } }" class="btn">Signaler un problème</RouterLink>
        <template v-if="auth.peut('gererPostes')">
          <button class="btn" @click="regenererJeton">Nouveau jeton d'agent</button>
          <button class="btn btn-danger" @click="supprimer">Supprimer</button>
          <button class="btn btn-principal" :disabled="reinstallationActive" @click="modale = 'reinstaller'">
            {{ reinstallationActive ? 'Réinstallation en cours' : 'Réinstaller le poste' }}
          </button>
        </template>
      </div>
    </header>

    <div class="deux-colonnes">
      <section class="bloc">
        <h2>Identification</h2>
        <dl class="liste-definitions">
          <dt>Salle</dt>
          <dd>{{ poste.salle.code }} – {{ poste.salle.nom }}</dd>
          <dt>Adresse IP</dt>
          <dd>{{ poste.adresseIp ?? '—' }}</dd>
          <dt>Système</dt>
          <dd>{{ poste.systeme ?? '—' }}</dd>
          <dt>Session</dt>
          <dd>{{ poste.enLigne ? (poste.utilisateurConnecte ?? 'Aucune') : '—' }}</dd>
          <dt>Matériel</dt>
          <dd>
            <RouterLink v-for="m in poste.materiels" :key="m.id" :to="{ name: 'materiel', params: { id: m.id } }" class="ligne-materiel">
              {{ m.type.libelle }} <span class="etiquette">{{ m.numeroSerie }}</span>
              <BadgeStatut :ton="TON_ETAT[m.etat]" :texte="ETATS[m.etat]" />
            </RouterLink>
            <span v-if="!poste.materiels.length" class="discret">Aucun matériel rattaché</span>
          </dd>
        </dl>
      </section>
      <section class="bloc">
        <h2>Charge</h2>
        <template v-if="poste.enLigne">
          <JaugeUsage libelle="CPU" :valeur="poste.cpu" />
          <JaugeUsage libelle="RAM" :valeur="poste.ram" />
        </template>
        <p v-else class="discret">Le poste ne répond pas : aucune mesure récente.</p>
      </section>
    </div>

    <section class="section">
      <header>
        <h2>Processus démarrés ({{ poste.processus.length }})</h2>
        <span class="discret petit">Actualisé toutes les 10 secondes</span>
      </header>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>Processus</th>
              <th class="num">PID</th>
              <th>Utilisateur</th>
              <th class="num">CPU</th>
              <th class="num">Mémoire</th>
              <th v-if="auth.peut('tuerProcessus')"><span class="discret">Action</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in poste.processus" :key="p.id">
              <td>{{ p.nom }}</td>
              <td class="num">{{ p.pid }}</td>
              <td>{{ p.utilisateur ?? '—' }}</td>
              <td class="num">{{ p.cpu.toFixed(1) }} %</td>
              <td class="num">{{ Math.round(p.memoireMo) }} Mo</td>
              <td v-if="auth.peut('tuerProcessus')">
                <button class="btn btn-petit btn-danger" @click="tuer(p.pid, p.nom)">Tuer</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!poste.processus.length" class="vide">Aucun processus remonté.</p>
      </div>
    </section>

    <section class="section">
      <header>
        <h2>Applications installées ({{ poste.applications.length }})</h2>
        <button v-if="auth.peut('gererPostes')" class="btn btn-petit" @click="ouvrirAjoutApplication">Déclarer une application</button>
      </header>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Version</th>
              <th>Catégorie</th>
              <th>Détectée le</th>
              <th v-if="auth.peut('gererPostes')"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in poste.applications" :key="a.application.id">
              <td>{{ a.application.nom }} <span class="discret petit">{{ a.application.editeur }}</span></td>
              <td>{{ a.version ?? '—' }}</td>
              <td>
                <BadgeStatut :ton="a.application.metier ? 'ok' : 'neutre'" :texte="a.application.metier ? 'Métier' : 'Autre'" />
              </td>
              <td>{{ dateHeure(a.detecteLe) }}</td>
              <td v-if="auth.peut('gererPostes')" class="num">
                <button class="btn btn-petit btn-discret" @click="retirerApplication(a.application.id)">Retirer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="deux-colonnes section">
      <section>
        <h2>Réinstallations</h2>
        <ul class="liste">
          <li v-for="r in poste.reinstallations" :key="r.id">
            <BadgeStatut :ton="TON_REINSTALLATION[r.statut]" :texte="STATUTS_REINSTALLATION[r.statut]" />
            <span>{{ r.image }} <span class="discret petit">{{ r.message }}</span></span>
            <span class="discret petit">{{ dateHeure(r.createdAt) }}</span>
          </li>
          <li v-if="!poste.reinstallations.length" class="discret">Aucune réinstallation.</li>
        </ul>
      </section>
      <section>
        <h2>Remontées</h2>
        <ul class="liste">
          <li v-for="r in poste.remontees" :key="r.id">
            <BadgeStatut :ton="TON_REMONTEE[r.statut]" :texte="STATUTS_REMONTEE[r.statut]" />
            <span>{{ r.titre }}</span>
            <span class="discret petit">{{ dateHeure(r.createdAt) }}</span>
          </li>
          <li v-if="!poste.remontees.length" class="discret">Aucune remontée.</li>
        </ul>
      </section>
    </div>

    <FenetreModale v-if="modale === 'reinstaller'" :titre="`Réinstaller ${poste.hostname}`" @fermer="modale = null">
      <form @submit.prevent="reinstaller">
        <p>Le poste sera réinstallé à partir de l'image choisie dès son prochain contact. Les données locales seront effacées.</p>
        <label class="champ"><span>Image (master)</span><input v-model.trim="image" required maxlength="120" /></label>
        <div class="actions">
          <button type="button" class="btn" @click="modale = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Lancer la réinstallation</button>
        </div>
      </form>
    </FenetreModale>

    <FenetreModale v-if="modale === 'application'" titre="Déclarer une application" @fermer="modale = null">
      <form @submit.prevent="declarerApplication">
        <div class="grille-form">
          <label class="champ">
            <span>Application</span>
            <select v-model="applicationId" required>
              <option :value="null" disabled>Choisir…</option>
              <option v-for="a in catalogue" :key="a.id" :value="a.id">{{ a.nom }}</option>
            </select>
          </label>
          <label class="champ"><span>Version</span><input v-model.trim="version" maxlength="40" /></label>
        </div>
        <div class="actions">
          <button type="button" class="btn" @click="modale = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Déclarer</button>
        </div>
      </form>
    </FenetreModale>

    <FenetreModale v-if="modale === 'jeton'" titre="Nouveau jeton d'agent" @fermer="modale = null">
      <JetonAgent :hostname="poste.hostname" :jeton="nouveauJeton" />
    </FenetreModale>
  </div>
</template>

<style scoped>
.boutons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.etiquette.grande {
  font-size: 1.6rem;
  padding: 0.1rem 0.9rem 0.1rem 0.7rem;
}
.en-ligne {
  color: var(--ok);
  font-weight: 600;
}
.hors-ligne {
  color: var(--danger);
  font-weight: 600;
}
.bloc h2,
.section h2 {
  font-size: 1.1rem;
}
.bloc h2 {
  margin-bottom: 0.8rem;
}
.bloc .jauge + .jauge {
  margin-top: 0.6rem;
}
.ligne-materiel {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.3rem;
  color: inherit;
  text-decoration: none;
}
.liste {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--trait);
  border-radius: var(--rayon-grand);
  background: var(--surface);
}
.liste li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--trait);
  align-items: baseline;
}
.liste li:last-child {
  border-bottom: 0;
}
</style>
