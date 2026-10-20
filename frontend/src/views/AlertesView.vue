<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { api } from '@/api/client';
import type { Alerte, TypeAlerte } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { NIVEAUX, TON_NIVEAU, TYPES_ALERTE, dateHeure } from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();

const alertes = ref<Alerte[]>([]);
const vue = ref<'actives' | 'acquittees'>('actives');
const type = ref<TypeAlerte | ''>('');

async function charger() {
  try {
    alertes.value = await api<Alerte[]>('/alertes', { params: { acquittee: vue.value === 'acquittees', type: type.value } });
  } catch (e) {
    notifications.erreur(e);
  }
}
watch([vue, type], charger);
onMounted(charger);

async function acquitter(a: Alerte) {
  try {
    await api(`/alertes/${a.id}/acquitter`, { methode: 'POST' });
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function acquitterTout() {
  if (!confirm('Acquitter toutes les alertes actives ?')) return;
  try {
    const { acquittees } = await api<{ acquittees: number }>('/alertes/acquitter-tout', { methode: 'POST' });
    notifications.succes(`${acquittees} alerte(s) acquittée(s)`);
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
        <h1>Alertes</h1>
        <p>Processus interdits, postes qui ne répondent plus, surcharge et matériel arrivé en fin d'aptitude.</p>
      </div>
      <button v-if="auth.peut('acquitterAlertes') && vue === 'actives' && alertes.length" class="btn" @click="acquitterTout">
        Tout acquitter
      </button>
    </header>

    <div class="filtres">
      <div class="onglets" role="tablist">
        <button role="tab" class="btn" :aria-selected="vue === 'actives'" :class="{ actif: vue === 'actives' }" @click="vue = 'actives'">Actives</button>
        <button role="tab" class="btn" :aria-selected="vue === 'acquittees'" :class="{ actif: vue === 'acquittees' }" @click="vue = 'acquittees'">
          Acquittées
        </button>
      </div>
      <label class="champ">
        <span>Type</span>
        <select v-model="type">
          <option value="">Tous</option>
          <option v-for="(l, cle) in TYPES_ALERTE" :key="cle" :value="cle">{{ l }}</option>
        </select>
      </label>
    </div>

    <div class="table-conteneur">
      <table>
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Alerte</th>
            <th>Concerne</th>
            <th>Date</th>
            <th v-if="vue === 'acquittees'">Acquittée par</th>
            <th v-else-if="auth.peut('acquitterAlertes')"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in alertes" :key="a.id">
            <td><BadgeStatut :ton="TON_NIVEAU[a.niveau]" :texte="NIVEAUX[a.niveau]" /></td>
            <td>
              <strong>{{ TYPES_ALERTE[a.type] }}</strong>
              <div>{{ a.message }}</div>
            </td>
            <td>
              <RouterLink v-if="a.poste" :to="{ name: 'poste', params: { id: a.poste.id } }" class="etiquette poste">{{ a.poste.hostname }}</RouterLink>
              <RouterLink v-else-if="a.materiel" :to="{ name: 'materiel', params: { id: a.materiel.id } }" class="etiquette">
                {{ a.materiel.numeroSerie }}
              </RouterLink>
              <span v-if="a.salle" class="discret petit"> salle {{ a.salle.code }}</span>
            </td>
            <td>{{ dateHeure(a.createdAt) }}</td>
            <td v-if="vue === 'acquittees'">
              {{ a.acquitteePar?.prenom }} {{ a.acquitteePar?.nom }}
              <div class="discret petit">{{ dateHeure(a.acquitteeLe) }}</div>
            </td>
            <td v-else-if="auth.peut('acquitterAlertes')" class="num">
              <button class="btn btn-petit" @click="acquitter(a)">Acquitter</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!alertes.length" class="vide">{{ vue === 'actives' ? 'Aucune alerte active.' : 'Aucune alerte acquittée.' }}</p>
    </div>
  </div>
</template>

<style scoped>
.onglets {
  display: flex;
  gap: 0;
  align-self: flex-end;
}
.onglets .btn {
  border-radius: 0;
}
.onglets .btn:first-child {
  border-radius: var(--rayon) 0 0 var(--rayon);
}
.onglets .btn:last-child {
  border-radius: 0 var(--rayon) var(--rayon) 0;
  border-left: 0;
}
.onglets .btn.actif {
  background: var(--encre);
  color: #fff;
  border-color: var(--encre);
}
</style>
