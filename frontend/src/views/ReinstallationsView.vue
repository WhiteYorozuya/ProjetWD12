<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import type { Reinstallation, StatutReinstallation } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { STATUTS_REINSTALLATION, TON_REINSTALLATION, dateHeure } from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const route = useRoute();

const liste = ref<Reinstallation[]>([]);
const statut = ref<StatutReinstallation | ''>('');
const lot = ref(typeof route.query.lot === 'string' ? route.query.lot : '');

async function charger() {
  try {
    liste.value = await api<Reinstallation[]>('/reinstallations', { params: { statut: statut.value, lot: lot.value } });
  } catch (e) {
    notifications.erreur(e);
  }
}
watch([statut, lot], charger);

let minuterie: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void charger();
  minuterie = setInterval(charger, 10_000);
});
onUnmounted(() => clearInterval(minuterie));

const avancement = computed(() => {
  if (!lot.value || !liste.value.length) return null;
  const finies = liste.value.filter((r) => ['TERMINEE', 'ECHEC', 'ANNULEE'].includes(r.statut)).length;
  return { finies, total: liste.value.length, pourcent: Math.round((finies / liste.value.length) * 100) };
});

async function annuler(r: Reinstallation) {
  try {
    await api(`/reinstallations/${r.id}/annuler`, { methode: 'POST' });
    notifications.succes(`Réinstallation de ${r.poste?.hostname} annulée`);
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
        <h1>Réinstallations</h1>
        <p>Suivi des réinstallations de postes et des replaquages de salles. Lancez-les depuis la fiche d'un poste ou d'une salle.</p>
      </div>
    </header>

    <div class="filtres">
      <label class="champ">
        <span>Statut</span>
        <select v-model="statut">
          <option value="">Tous</option>
          <option v-for="(l, cle) in STATUTS_REINSTALLATION" :key="cle" :value="cle">{{ l }}</option>
        </select>
      </label>
      <label class="champ large">
        <span>Lot de replaquage</span>
        <input v-model.trim="lot" placeholder="LOT-201-…" />
      </label>
    </div>

    <div v-if="avancement" class="bloc avancement">
      <p>Lot <strong>{{ lot }}</strong> : {{ avancement.finies }} poste(s) traité(s) sur {{ avancement.total }}</p>
      <div class="piste" role="progressbar" :aria-valuenow="avancement.pourcent" aria-valuemin="0" aria-valuemax="100">
        <span :style="{ width: `${avancement.pourcent}%` }" />
      </div>
    </div>

    <div class="table-conteneur">
      <table>
        <thead>
          <tr>
            <th>Poste</th>
            <th>Salle</th>
            <th>Image</th>
            <th>Statut</th>
            <th>Demandée</th>
            <th>Terminée</th>
            <th>Par</th>
            <th v-if="auth.peut('gererPostes')"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in liste" :key="r.id">
            <td>
              <RouterLink v-if="r.poste" :to="{ name: 'poste', params: { id: r.poste.id } }" class="etiquette poste">{{ r.poste.hostname }}</RouterLink>
            </td>
            <td>{{ r.poste?.salle.code }}</td>
            <td>{{ r.image }}<div v-if="r.lot" class="discret petit">{{ r.lot }}</div></td>
            <td>
              <BadgeStatut :ton="TON_REINSTALLATION[r.statut]" :texte="STATUTS_REINSTALLATION[r.statut]" />
              <div v-if="r.message" class="discret petit">{{ r.message }}</div>
            </td>
            <td>{{ dateHeure(r.createdAt) }}</td>
            <td>{{ dateHeure(r.fin) }}</td>
            <td>{{ r.demandeur?.prenom }} {{ r.demandeur?.nom }}</td>
            <td v-if="auth.peut('gererPostes')" class="num">
              <button v-if="r.statut === 'DEMANDEE'" class="btn btn-petit btn-discret" @click="annuler(r)">Annuler</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!liste.length" class="vide">Aucune réinstallation.</p>
    </div>
  </div>
</template>

<style scoped>
.avancement {
  margin-bottom: 1rem;
}
.piste {
  height: 8px;
  border-radius: 4px;
  background: var(--neutre-fond);
  overflow: hidden;
}
.piste span {
  display: block;
  height: 100%;
  background: var(--olive);
  transition: width 0.4s ease;
}
</style>
