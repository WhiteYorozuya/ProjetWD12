<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/api/client';
import type { Poste } from '@/api/types';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';

/** Déplace un matériel (ids.length === 1) ou une sélection vers une salle / un poste. */
const props = defineProps<{ ids: number[] }>();
const emit = defineEmits<{ termine: []; annuler: [] }>();

const referentiel = useReferentielStore();
const notifications = useNotificationsStore();

const salleId = ref<number | null>(null);
const posteId = ref<number | null>(null);
const motif = ref('');
const postes = ref<Poste[]>([]);
const enCours = ref(false);

watch(salleId, async (id) => {
  posteId.value = null;
  postes.value = id ? await api<Poste[]>('/postes', { params: { salleId: id } }) : [];
});

async function valider() {
  if (!salleId.value) return;
  enCours.value = true;
  const corps = { salleId: salleId.value, posteId: posteId.value ?? undefined, motif: motif.value || undefined };
  try {
    if (props.ids.length === 1) {
      await api(`/materiels/${props.ids[0]}/affectation`, { methode: 'POST', corps });
      notifications.succes('Matériel déplacé');
    } else {
      const { deplaces } = await api<{ deplaces: number }>('/materiels/affectation-groupee', {
        methode: 'POST',
        corps: { ...corps, ids: props.ids },
      });
      notifications.succes(`${deplaces} matériels déplacés`);
    }
    emit('termine');
  } catch (e) {
    notifications.erreur(e);
  } finally {
    enCours.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="valider">
    <p v-if="ids.length > 1" class="discret">{{ ids.length }} matériels sélectionnés.</p>
    <div class="grille-form">
      <label class="champ">
        <span>Salle de destination</span>
        <select v-model="salleId" required>
          <option :value="null" disabled>Choisir…</option>
          <option v-for="s in referentiel.salles" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Poste (facultatif)</span>
        <select v-model="posteId" :disabled="!postes.length">
          <option :value="null">Aucun — affecté à la salle</option>
          <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.hostname }}</option>
        </select>
        <small>Un switch, une imprimante ou un vidéoprojecteur reste rattaché à la salle.</small>
      </label>
    </div>
    <label class="champ motif">
      <span>Motif</span>
      <input v-model.trim="motif" maxlength="300" placeholder="Ex. préparation du stage réseaux de novembre" />
    </label>
    <div class="actions">
      <button type="button" class="btn" @click="emit('annuler')">Annuler</button>
      <button type="submit" class="btn btn-principal" :disabled="enCours || !salleId">Déplacer</button>
    </div>
  </form>
</template>

<style scoped>
.motif {
  margin-top: 0.9rem;
}
</style>
