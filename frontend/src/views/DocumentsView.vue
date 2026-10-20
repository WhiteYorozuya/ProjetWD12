<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { telecharger } from '@/api/client';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';

const notifications = useNotificationsStore();
const referentiel = useReferentielStore();
const salleId = ref<number | null>(null);
const enCours = ref('');

onMounted(() => referentiel.charger());

async function generer(cle: string, chemin: string, nom: string) {
  enCours.value = cle;
  try {
    await telecharger(chemin, nom);
  } catch (e) {
    notifications.erreur(e);
  } finally {
    enCours.value = '';
  }
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Documents</h1>
        <p>Documents à imprimer et à signer, générés à partir de l'inventaire à jour.</p>
      </div>
    </header>

    <div class="documents">
      <section class="document">
        <h2>État des lieux de salle</h2>
        <p>
          Inventaire du matériel et des postes d'une salle avec une colonne de constat, les remontées en cours et deux cadres
          de signature. À utiliser en entrée et en sortie de stage.
        </p>
        <form class="ligne" @submit.prevent="generer('edl', `/documents/etat-des-lieux/salles/${salleId}`, 'etat-des-lieux.pdf')">
          <label class="champ">
            <span>Salle</span>
            <select v-model="salleId" required>
              <option :value="null" disabled>Choisir…</option>
              <option v-for="s in referentiel.salles" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
            </select>
          </label>
          <button class="btn btn-principal" type="submit" :disabled="!salleId || enCours === 'edl'">Générer le PDF</button>
        </form>
      </section>

      <section class="document">
        <h2>Inventaire général</h2>
        <p>Tout le parc, salle par salle, avec l'état et la date de fin d'aptitude de chaque matériel.</p>
        <div class="ligne">
          <button class="btn btn-principal" :disabled="enCours === 'inv'" @click="generer('inv', '/documents/inventaire', 'inventaire.pdf')">
            Générer le PDF
          </button>
          <button class="btn" :disabled="enCours === 'csv'" @click="generer('csv', '/materiels/export', 'inventaire.csv')">
            Exporter en CSV
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.documents {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.2rem;
}
.document {
  padding: 1.2rem 1.3rem;
  border: 1px solid var(--trait);
  border-top: 4px solid var(--olive);
  border-radius: var(--rayon);
  background: var(--surface);
}
.document h2 {
  margin-bottom: 0.5rem;
}
.ligne {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.ligne .champ {
  flex: 1 1 200px;
}
</style>
