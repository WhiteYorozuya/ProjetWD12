<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { Salle, TypeSalle } from '@/api/types';
import FenetreModale from '@/components/FenetreModale.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { TYPES_SALLE } from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const referentiel = useReferentielStore();
const router = useRouter();

const salles = ref<Salle[]>([]);
const edition = ref<Salle | 'nouvelle' | null>(null);
const formulaire = reactive({ code: '', nom: '', batiment: '', capacite: 0, type: 'COURS' as TypeSalle });

async function charger() {
  try {
    salles.value = await api<Salle[]>('/salles');
  } catch (e) {
    notifications.erreur(e);
  }
}
onMounted(charger);

function ouvrir(salle: Salle | 'nouvelle') {
  edition.value = salle;
  const s = salle === 'nouvelle' ? null : salle;
  Object.assign(formulaire, {
    code: s?.code ?? '',
    nom: s?.nom ?? '',
    batiment: s?.batiment ?? '',
    capacite: s?.capacite ?? 0,
    type: s?.type ?? 'COURS',
  });
}

async function enregistrer() {
  const corps = { ...formulaire, batiment: formulaire.batiment || undefined };
  try {
    if (edition.value === 'nouvelle') {
      await api('/salles', { methode: 'POST', corps });
      notifications.succes(`Salle ${formulaire.code} créée`);
    } else if (edition.value) {
      await api(`/salles/${edition.value.id}`, { methode: 'PATCH', corps });
      notifications.succes('Salle modifiée');
    }
    edition.value = null;
    await Promise.all([charger(), referentiel.charger(true)]);
  } catch (e) {
    notifications.erreur(e);
  }
}

async function supprimer(salle: Salle) {
  if (!confirm(`Supprimer la salle ${salle.code} ?`)) return;
  try {
    await api(`/salles/${salle.id}`, { methode: 'DELETE' });
    notifications.succes('Salle supprimée');
    await Promise.all([charger(), referentiel.charger(true)]);
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Salles</h1>
        <p>Salles de formation, salles techniques et magasin.</p>
      </div>
      <button v-if="auth.peut('gererSalles')" class="btn btn-principal" @click="ouvrir('nouvelle')">Créer une salle</button>
    </header>

    <div class="table-conteneur">
      <table>
        <thead>
          <tr>
            <th>Salle</th>
            <th>Type</th>
            <th>Bâtiment</th>
            <th class="num">Capacité</th>
            <th class="num">Postes en ligne</th>
            <th class="num">Matériels</th>
            <th class="num">Remontées</th>
            <th v-if="auth.peut('gererSalles')"><span class="sr">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in salles" :key="s.id" class="cliquable" @click="router.push({ name: 'salle', params: { id: s.id } })">
            <td>
              <RouterLink :to="{ name: 'salle', params: { id: s.id } }" @click.stop><strong>{{ s.code }}</strong></RouterLink>
              {{ s.nom }}
            </td>
            <td>{{ TYPES_SALLE[s.type] }}</td>
            <td>{{ s.batiment ?? '—' }}</td>
            <td class="num">{{ s.capacite }}</td>
            <td class="num">{{ s.nbPostesEnLigne }} / {{ s.nbPostes }}</td>
            <td class="num">{{ s.nbMateriels }}</td>
            <td class="num" :class="{ alerte: s.nbRemonteesOuvertes }">{{ s.nbRemonteesOuvertes }}</td>
            <td v-if="auth.peut('gererSalles')" class="num" @click.stop>
              <button class="btn btn-petit btn-discret" @click="ouvrir(s)">Modifier</button>
              <button class="btn btn-petit btn-discret" @click="supprimer(s)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!salles.length" class="vide">Aucune salle. Créez la première pour pouvoir y affecter du matériel.</p>
    </div>

    <FenetreModale
      v-if="edition"
      :titre="edition === 'nouvelle' ? 'Créer une salle' : `Modifier la salle ${edition.code}`"
      @fermer="edition = null"
    >
      <form @submit.prevent="enregistrer">
        <div class="grille-form">
          <label class="champ"><span>Code</span><input v-model.trim="formulaire.code" required maxlength="20" /></label>
          <label class="champ"><span>Nom</span><input v-model.trim="formulaire.nom" required maxlength="100" /></label>
          <label class="champ"><span>Bâtiment</span><input v-model.trim="formulaire.batiment" maxlength="100" /></label>
          <label class="champ"><span>Capacité</span><input v-model.number="formulaire.capacite" type="number" min="0" max="500" /></label>
          <label class="champ">
            <span>Type</span>
            <select v-model="formulaire.type">
              <option v-for="(l, cle) in TYPES_SALLE" :key="cle" :value="cle">{{ l }}</option>
            </select>
          </label>
        </div>
        <div class="actions">
          <button type="button" class="btn" @click="edition = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Enregistrer</button>
        </div>
      </form>
    </FenetreModale>
  </div>
</template>

<style scoped>
.alerte {
  color: var(--danger);
  font-weight: 700;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
