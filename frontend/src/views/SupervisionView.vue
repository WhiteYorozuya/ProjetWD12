<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { RegleProcessus, TypeRegle, VueSalle } from '@/api/types';
import JaugeUsage from '@/components/JaugeUsage.vue';
import { useAuthStore } from '@/stores/auth';
import { estSysteme } from '@/utils/processus';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { depuis } from '@/utils/format';

const auth = useAuthStore();
const referentiel = useReferentielStore();
const notifications = useNotificationsStore();
const route = useRoute();
const router = useRouter();

const salleId = ref<number | null>(route.query.salle ? Number(route.query.salle) : null);
const vue = ref<VueSalle | null>(null);
const posteOuvertId = ref<number | null>(null);
const regles = ref<RegleProcessus[]>([]);
const nouvelleRegle = reactive({ nom: '', type: 'INTERDIT' as TypeRegle, portee: 'salle' as 'salle' | 'globale', motif: '' });
const mise = ref<Date | null>(null);

const sallesSupervisables = computed(() => referentiel.salles.filter((s) => s.type !== 'MAGASIN'));
const posteOuvert = computed(() => vue.value?.postes.find((p) => p.id === posteOuvertId.value) ?? null);
const resume = computed(() => {
  const postes = vue.value?.postes ?? [];
  return {
    enLigne: postes.filter((p) => p.enLigne).length,
    sessions: postes.filter((p) => p.enLigne && p.utilisateurConnecte).length,
    alertes: postes.reduce((n, p) => n + p.alertes.length, 0),
  };
});

async function charger() {
  if (!salleId.value) return;
  try {
    vue.value = await api<VueSalle>(`/supervision/salles/${salleId.value}`);
    mise.value = new Date();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function chargerRegles() {
  if (!salleId.value) return;
  regles.value = await api<RegleProcessus[]>('/supervision/regles', { params: { salleId: salleId.value } });
}

watch(salleId, (id) => {
  posteOuvertId.value = null;
  vue.value = null;
  void router.replace({ query: id ? { salle: id } : {} });
  void charger();
  void chargerRegles();
});

let minuterie: ReturnType<typeof setInterval> | undefined;
onMounted(async () => {
  await referentiel.charger();
  if (!salleId.value && sallesSupervisables.value.length) salleId.value = sallesSupervisables.value[0].id;
  else {
    void charger();
    void chargerRegles();
  }
  minuterie = setInterval(charger, 5000);
});
onUnmounted(() => clearInterval(minuterie));

async function tuer(posteId: number, pid: number, nom: string) {
  try {
    await api(`/supervision/postes/${posteId}/processus/${pid}/tuer`, { methode: 'POST' });
    notifications.succes(`Arrêt de ${nom} demandé`);
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function ajouterRegle() {
  try {
    await api('/supervision/regles', {
      methode: 'POST',
      corps: {
        nom: nouvelleRegle.nom,
        type: nouvelleRegle.type,
        salleId: nouvelleRegle.portee === 'salle' ? salleId.value : undefined,
        motif: nouvelleRegle.motif || undefined,
      },
    });
    nouvelleRegle.nom = '';
    nouvelleRegle.motif = '';
    await Promise.all([chargerRegles(), charger()]);
  } catch (e) {
    notifications.erreur(e);
  }
}

async function supprimerRegle(id: number) {
  try {
    await api(`/supervision/regles/${id}`, { methode: 'DELETE' });
    await Promise.all([chargerRegles(), charger()]);
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Supervision</h1>
        <p>Les postes de la salle, tels qu'ils sont en ce moment. Actualisé toutes les 5 secondes.</p>
      </div>
      <label class="champ choix-salle">
        <span>Salle</span>
        <select v-model="salleId">
          <option v-for="s in sallesSupervisables" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
    </header>

    <template v-if="vue">
      <p class="resume">
        <strong>{{ resume.enLigne }}</strong> poste(s) en ligne sur {{ vue.postes.length }},
        <strong>{{ resume.sessions }}</strong> session(s) ouverte(s)<template v-if="resume.alertes">,
          <strong class="rouge">{{ resume.alertes }} alerte(s)</strong></template>
        <span class="discret petit"> — mis à jour {{ mise?.toLocaleTimeString('fr-FR') }}</span>
      </p>

      <div class="disposition">
        <!-- Plan de salle : un emplacement par poste -->
        <div class="plan" role="list" aria-label="Postes de la salle">
          <button
            v-for="p in vue.postes"
            :key="p.id"
            role="listitem"
            class="place"
            :class="{
              eteint: !p.enLigne,
              alerte: p.processus.some((pr) => pr.interdit),
              ouvert: p.id === posteOuvertId,
            }"
            :aria-pressed="p.id === posteOuvertId"
            @click="posteOuvertId = p.id === posteOuvertId ? null : p.id"
          >
            <span class="haut">
              <span class="etiquette poste">{{ p.hostname }}</span>
              <span class="etat">{{ p.enLigne ? '' : 'Hors ligne' }}</span>
            </span>
            <template v-if="p.enLigne">
              <span class="session">{{ p.utilisateurConnecte ?? 'Aucune session' }}</span>
              <JaugeUsage libelle="CPU" :valeur="p.cpu" />
              <JaugeUsage libelle="RAM" :valeur="p.ram" />
              <span v-for="pr in p.processus.filter((x) => x.interdit)" :key="pr.pid" class="interdit">
                {{ pr.nom }} interdit{{ pr.arretDemande ? ' — arrêt en cours' : '' }}
              </span>
            </template>
            <span v-else class="session discret">Dernier contact {{ depuis(p.derniereConnexion) }}</span>
          </button>
          <p v-if="!vue.postes.length" class="vide">Aucun poste dans cette salle.</p>
        </div>

        <!-- Détail du poste sélectionné -->
        <aside v-if="posteOuvert" class="detail bloc" aria-live="polite">
          <header>
            <h2>{{ posteOuvert.hostname }}</h2>
            <RouterLink :to="{ name: 'poste', params: { id: posteOuvert.id } }">Fiche du poste</RouterLink>
          </header>
          <p v-if="!posteOuvert.processus.length" class="discret">Aucun processus remonté.</p>
          <table v-else>
            <thead>
              <tr>
                <th>Processus</th>
                <th class="num">CPU</th>
                <th class="num">Mo</th>
                <th v-if="auth.peut('tuerProcessus')"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pr in posteOuvert.processus" :key="pr.pid" :class="{ 'ligne-interdite': pr.interdit }">
                <td>
                  {{ pr.nom }}
                  <span class="discret petit">{{ pr.pid }}</span>
                </td>
                <td class="num">{{ pr.cpu.toFixed(1) }}</td>
                <td class="num">{{ Math.round(pr.memoireMo) }}</td>
                <td v-if="auth.peut('tuerProcessus')" class="num">
                  <span v-if="pr.arretDemande" class="discret petit">Arrêt demandé</span>
                  <span v-else-if="estSysteme(pr)" class="discret petit" title="Processus du système d'exploitation">Système</span>
                  <button v-else class="btn btn-petit btn-danger" @click="tuer(posteOuvert.id, pr.pid, pr.nom)">Tuer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </aside>
      </div>

      <section class="section">
        <header>
          <h2>Processus autorisés et interdits</h2>
          <span class="discret petit">
            Interdits dans cette salle : {{ vue.processusInterdits.length ? vue.processusInterdits.join(', ') : 'aucun' }}
          </span>
        </header>
        <p class="discret">
          Un processus interdit est arrêté automatiquement et génère une alerte. Une autorisation propre à la salle lève une
          interdiction globale.
        </p>
        <div class="table-conteneur">
          <table>
            <thead>
              <tr>
                <th>Processus</th>
                <th>Règle</th>
                <th>Portée</th>
                <th>Motif</th>
                <th v-if="auth.peut('gererRegles')"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in regles" :key="r.id">
                <td>{{ r.nom }}</td>
                <td :class="r.type === 'INTERDIT' ? 'rouge' : 'vert'">{{ r.type === 'INTERDIT' ? 'Interdit' : 'Autorisé' }}</td>
                <td>{{ r.salle ? `Salle ${r.salle.code}` : 'Toutes les salles' }}</td>
                <td class="discret">{{ r.motif ?? '—' }}</td>
                <td v-if="auth.peut('gererRegles')" class="num">
                  <button class="btn btn-petit btn-discret" @click="supprimerRegle(r.id)">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <form v-if="auth.peut('gererRegles')" class="filtres ajout-regle" @submit.prevent="ajouterRegle">
          <label class="champ"><span>Processus</span><input v-model.trim="nouvelleRegle.nom" required placeholder="steam.exe" /></label>
          <label class="champ">
            <span>Règle</span>
            <select v-model="nouvelleRegle.type">
              <option value="INTERDIT">Interdire</option>
              <option value="AUTORISE">Autoriser</option>
            </select>
          </label>
          <label class="champ">
            <span>Portée</span>
            <select v-model="nouvelleRegle.portee">
              <option value="salle">Cette salle</option>
              <option value="globale">Toutes les salles</option>
            </select>
          </label>
          <label class="champ large"><span>Motif</span><input v-model.trim="nouvelleRegle.motif" maxlength="200" /></label>
          <button type="submit" class="btn btn-principal">Ajouter la règle</button>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.choix-salle {
  min-width: 240px;
}
.resume {
  margin-bottom: 1rem;
}
.rouge {
  color: var(--danger);
}
.vert {
  color: var(--ok);
}
.disposition {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2rem;
}
.disposition:has(.detail) {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
}
.plan {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.7rem;
  align-content: start;
  padding: 1rem;
  border: 1px dashed var(--trait-fort);
  border-radius: var(--rayon-grand);
  background: repeating-linear-gradient(0deg, transparent 0 23px, rgba(79, 97, 66, 0.05) 23px 24px), var(--papier);
}
.place {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--trait);
  border-top: 4px solid var(--ok);
  border-radius: var(--rayon);
  background: var(--surface);
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.place:hover {
  background: #fff;
}
.place.eteint {
  border-top-color: var(--trait-fort);
  background: transparent;
  color: var(--encre-douce);
}
.place.alerte {
  border-top-color: var(--danger);
  background: var(--danger-fond);
}
.place.ouvert {
  outline: 2px solid var(--signal-fonce);
  outline-offset: 1px;
}
.haut {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.etat {
  font-size: 0.82rem;
}
.session {
  font-size: 0.88rem;
}
.interdit {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--danger);
}
.detail header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.6rem;
}
.detail h2 {
  font-size: 1.15rem;
}
.detail table th,
.detail table td {
  padding: 0.35rem 0.4rem;
}
.ligne-interdite {
  background: var(--danger-fond);
}
.ajout-regle {
  margin-top: 1rem;
}
@media (max-width: 900px) {
  .disposition:has(.detail) {
    grid-template-columns: 1fr;
  }
}
</style>
