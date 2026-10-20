<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/api/client';
import type { BilanImport } from '@/api/types';
import { useNotificationsStore } from '@/stores/notifications';

const emit = defineEmits<{ termine: []; annuler: [] }>();
const notifications = useNotificationsStore();

const contenu = ref('');
const nomFichier = ref('');
const bilan = ref<BilanImport | null>(null);
const enCours = ref(false);

const MODELE = 'numeroSerie;type;marque;modele;salle;etat;dateReception\nCZC5A1B2C3;UC;HP;EliteDesk 800 G9;MAG;EN_STOCK;28/09/2026\n';

async function lireFichier(evenement: Event) {
  const fichier = (evenement.target as HTMLInputElement).files?.[0];
  bilan.value = null;
  if (!fichier) return;
  if (fichier.size > 1_000_000) {
    notifications.erreur(new Error('Fichier trop volumineux (1 Mo maximum)'));
    return;
  }
  nomFichier.value = fichier.name;
  contenu.value = await fichier.text();
  await envoyer(true);
}

async function envoyer(simulation: boolean) {
  enCours.value = true;
  try {
    bilan.value = await api<BilanImport>('/materiels/import', { methode: 'POST', corps: { csv: contenu.value, simulation } });
    if (!simulation) {
      notifications.succes(`${bilan.value.importes} matériels importés`);
      emit('termine');
    }
  } catch (e) {
    notifications.erreur(e);
  } finally {
    enCours.value = false;
  }
}

function telechargerModele() {
  const url = URL.createObjectURL(new Blob(['﻿' + MODELE], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele-import-materiels.csv';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div>
    <p>
      Fichier CSV (séparateur « ; » ou « , ») avec les colonnes
      <strong>numeroSerie, type, marque, modele</strong> et, si besoin, <strong>salle</strong> (code), <strong>etat</strong>,
      <strong>dateReception</strong>. Le fichier est d'abord vérifié : rien n'est enregistré tant qu'une ligne est en erreur.
    </p>
    <p><button type="button" class="btn btn-petit" @click="telechargerModele">Télécharger le modèle</button></p>

    <label class="champ">
      <span>Fichier à importer</span>
      <input type="file" accept=".csv,text/csv" @change="lireFichier" />
    </label>

    <div v-if="bilan" class="bilan" :class="{ ko: bilan.erreurs.length }">
      <p v-if="!bilan.erreurs.length">
        <strong>{{ nomFichier }}</strong> : {{ bilan.valides }} ligne(s) valide(s), prêtes à être importées.
      </p>
      <template v-else>
        <p>
          <strong>{{ bilan.erreurs.length }} ligne(s) à corriger</strong> sur {{ bilan.total }}. Corrigez le fichier puis
          sélectionnez-le à nouveau.
        </p>
        <ul>
          <li v-for="e in bilan.erreurs.slice(0, 50)" :key="e.ligne">Ligne {{ e.ligne }} : {{ e.message }}</li>
        </ul>
        <p v-if="bilan.erreurs.length > 50" class="discret">… et {{ bilan.erreurs.length - 50 }} autres.</p>
      </template>
    </div>

    <div class="actions">
      <button type="button" class="btn" @click="emit('annuler')">Annuler</button>
      <button
        type="button"
        class="btn btn-principal"
        :disabled="enCours || !bilan || bilan.erreurs.length > 0 || bilan.valides === 0"
        @click="envoyer(false)"
      >
        Importer {{ bilan?.valides ?? '' }} matériel(s)
      </button>
    </div>
  </div>
</template>

<style scoped>
.bilan {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: var(--rayon);
  background: var(--ok-fond);
}
.bilan.ko {
  background: var(--danger-fond);
}
.bilan ul {
  margin: 0;
  padding-left: 1.2rem;
  max-height: 220px;
  overflow-y: auto;
}
</style>
