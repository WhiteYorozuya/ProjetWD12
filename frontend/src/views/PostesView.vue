<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { Poste } from '@/api/types';
import FenetreModale from '@/components/FenetreModale.vue';
import JetonAgent from '@/components/JetonAgent.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { depuis, pourcent } from '@/utils/format';

const auth = useAuthStore();
const referentiel = useReferentielStore();
const notifications = useNotificationsStore();
const router = useRouter();

const postes = ref<Poste[]>([]);
const salleId = ref('');
const statut = ref<'' | 'enLigne' | 'horsLigne'>('');
const creation = ref(false);
const jetonCree = ref<{ hostname: string; jeton: string } | null>(null);
const formulaire = reactive({ hostname: '', salleId: null as number | null, adresseIp: '', systeme: '' });

async function charger() {
  try {
    postes.value = await api<Poste[]>('/postes', { params: { salleId: salleId.value } });
  } catch (e) {
    notifications.erreur(e);
  }
}
watch(salleId, charger);
onMounted(async () => {
  await referentiel.charger();
  await charger();
});

const affiches = computed(() =>
  postes.value.filter((p) => !statut.value || (statut.value === 'enLigne') === p.enLigne),
);

async function creer() {
  try {
    const r = await api<{ poste: Poste; jetonAgent: string }>('/postes', {
      methode: 'POST',
      corps: {
        hostname: formulaire.hostname,
        salleId: formulaire.salleId,
        adresseIp: formulaire.adresseIp || undefined,
        systeme: formulaire.systeme || undefined,
      },
    });
    creation.value = false;
    jetonCree.value = { hostname: r.poste.hostname, jeton: r.jetonAgent };
    Object.assign(formulaire, { hostname: '', adresseIp: '', systeme: '' });
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Postes</h1>
        <p>Postes de travail des salles, supervisés par leur agent.</p>
      </div>
      <button v-if="auth.peut('gererPostes')" class="btn btn-principal" @click="creation = true">Déclarer un poste</button>
    </header>

    <div class="filtres">
      <label class="champ">
        <span>Salle</span>
        <select v-model="salleId">
          <option value="">Toutes</option>
          <option v-for="s in referentiel.salles" :key="s.id" :value="String(s.id)">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Connexion</span>
        <select v-model="statut">
          <option value="">Tous</option>
          <option value="enLigne">En ligne</option>
          <option value="horsLigne">Hors ligne</option>
        </select>
      </label>
    </div>

    <div class="table-conteneur">
      <table>
        <thead>
          <tr>
            <th>Poste</th>
            <th>Salle</th>
            <th>Connexion</th>
            <th>Session</th>
            <th class="num">CPU</th>
            <th class="num">RAM</th>
            <th class="num">Applications</th>
            <th class="num">Remontées</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in affiches" :key="p.id" class="cliquable" @click="router.push({ name: 'poste', params: { id: p.id } })">
            <td>
              <RouterLink :to="{ name: 'poste', params: { id: p.id } }" class="etiquette poste" @click.stop>{{ p.hostname }}</RouterLink>
            </td>
            <td>{{ p.salle?.code }} <span class="discret">{{ p.salle?.nom }}</span></td>
            <td>
              <span class="point" :class="{ actif: p.enLigne }" aria-hidden="true" />
              {{ p.enLigne ? 'En ligne' : `Hors ligne, ${depuis(p.derniereConnexion)}` }}
            </td>
            <td>{{ p.enLigne ? (p.utilisateurConnecte ?? '—') : '—' }}</td>
            <td class="num">{{ p.enLigne ? pourcent(p.cpu) : '—' }}</td>
            <td class="num">{{ p.enLigne ? pourcent(p.ram) : '—' }}</td>
            <td class="num">{{ p.nbApplications }}</td>
            <td class="num">{{ p.nbRemonteesOuvertes || '' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!affiches.length" class="vide">Aucun poste.</p>
    </div>

    <FenetreModale v-if="creation" titre="Déclarer un poste" @fermer="creation = false">
      <form @submit.prevent="creer">
        <div class="grille-form">
          <label class="champ">
            <span>Nom d'hôte</span>
            <input v-model.trim="formulaire.hostname" required maxlength="63" pattern="[A-Za-z0-9][A-Za-z0-9\-]*" placeholder="S201-P09" />
          </label>
          <label class="champ">
            <span>Salle</span>
            <select v-model="formulaire.salleId" required>
              <option :value="null" disabled>Choisir…</option>
              <option v-for="s in referentiel.salles" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
            </select>
          </label>
          <label class="champ"><span>Adresse IP</span><input v-model.trim="formulaire.adresseIp" placeholder="10.20.1.19" /></label>
          <label class="champ"><span>Système</span><input v-model.trim="formulaire.systeme" maxlength="100" /></label>
        </div>
        <div class="actions">
          <button type="button" class="btn" @click="creation = false">Annuler</button>
          <button type="submit" class="btn btn-principal">Déclarer le poste</button>
        </div>
      </form>
    </FenetreModale>

    <FenetreModale v-if="jetonCree" titre="Poste déclaré" @fermer="jetonCree = null">
      <JetonAgent :hostname="jetonCree.hostname" :jeton="jetonCree.jeton" />
    </FenetreModale>
  </div>
</template>

<style scoped>
.point {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.3rem;
  background: var(--trait-fort);
}
.point.actif {
  background: var(--ok);
}
</style>
