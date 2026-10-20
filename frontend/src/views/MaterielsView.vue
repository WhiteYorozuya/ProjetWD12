<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, telecharger } from '@/api/client';
import type { EtatMateriel, Materiel, Page } from '@/api/types';
import AffectationFormulaire from '@/components/AffectationFormulaire.vue';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import ImportCsv from '@/components/ImportCsv.vue';
import MaterielFormulaire from '@/components/MaterielFormulaire.vue';
import PaginationBarre from '@/components/PaginationBarre.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { APTITUDES, ETATS, TON_APTITUDE, TON_ETAT, date } from '@/utils/format';

const auth = useAuthStore();
const referentiel = useReferentielStore();
const notifications = useNotificationsStore();
const route = useRoute();
const router = useRouter();

const q = (cle: string) => (typeof route.query[cle] === 'string' ? (route.query[cle] as string) : '');
const filtres = reactive({
  recherche: q('recherche'),
  typeId: q('typeId'),
  etat: q('etat') as EtatMateriel | '',
  salleId: q('salleId'),
  aptitude: q('aptitude'),
});
const page = ref(1);
const resultat = ref<Page<Materiel> | null>(null);
const chargement = ref(false);
const selection = ref<Set<number>>(new Set());
const modale = ref<'ajout' | 'import' | 'affectation' | null>(null);

async function charger() {
  chargement.value = true;
  try {
    resultat.value = await api<Page<Materiel>>('/materiels', {
      params: { ...filtres, page: page.value, taille: 25 },
    });
  } catch (e) {
    notifications.erreur(e);
  } finally {
    chargement.value = false;
  }
}

let delai: ReturnType<typeof setTimeout> | undefined;
watch(
  filtres,
  () => {
    clearTimeout(delai);
    delai = setTimeout(() => {
      page.value = 1;
      selection.value = new Set();
      void charger();
    }, 250);
  },
  { deep: true },
);
watch(page, charger);

onMounted(async () => {
  await referentiel.charger();
  await charger();
});

const toutSelectionne = computed(
  () => !!resultat.value?.elements.length && resultat.value.elements.every((m) => selection.value.has(m.id)),
);
function basculerTout() {
  const ids = resultat.value?.elements.map((m) => m.id) ?? [];
  selection.value = toutSelectionne.value ? new Set() : new Set(ids);
}
function basculer(id: number) {
  const s = new Set(selection.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  selection.value = s;
}

function reinitialiser() {
  Object.assign(filtres, { recherche: '', typeId: '', etat: '', salleId: '', aptitude: '' });
}

async function exporter() {
  try {
    await telecharger('/materiels/export', 'inventaire-materiels.csv');
  } catch (e) {
    notifications.erreur(e);
  }
}

function apresAjout(m: Materiel) {
  modale.value = null;
  void router.push({ name: 'materiel', params: { id: m.id } });
}
function apresModification() {
  modale.value = null;
  selection.value = new Set();
  void charger();
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Matériels</h1>
        <p>Inventaire complet : où se trouve chaque matériel, dans quel état, et jusqu'à quand il est apte.</p>
      </div>
      <div v-if="auth.peut('gererMateriel')" class="boutons">
        <button class="btn" @click="exporter">Exporter en CSV</button>
        <button class="btn" @click="modale = 'import'">Importer un lot</button>
        <button class="btn btn-principal" @click="modale = 'ajout'">Ajouter un matériel</button>
      </div>
    </header>

    <form class="filtres" role="search" @submit.prevent>
      <label class="champ large">
        <span>Rechercher</span>
        <input v-model.trim="filtres.recherche" type="search" placeholder="N° de série, marque ou modèle" />
      </label>
      <label class="champ">
        <span>Type</span>
        <select v-model="filtres.typeId">
          <option value="">Tous</option>
          <option v-for="t in referentiel.types" :key="t.id" :value="String(t.id)">{{ t.libelle }}</option>
        </select>
      </label>
      <label class="champ">
        <span>État</span>
        <select v-model="filtres.etat">
          <option value="">Tous</option>
          <option v-for="(l, cle) in ETATS" :key="cle" :value="cle">{{ l }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Salle</span>
        <select v-model="filtres.salleId">
          <option value="">Toutes</option>
          <option v-for="s in referentiel.salles" :key="s.id" :value="String(s.id)">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Aptitude</span>
        <select v-model="filtres.aptitude">
          <option value="">Toutes</option>
          <option value="EXPIREE">Échue</option>
          <option value="ECHEANCE_PROCHE">Échéance &lt; 90 jours</option>
        </select>
      </label>
      <button type="button" class="btn btn-discret" @click="reinitialiser">Effacer les filtres</button>
    </form>

    <div v-if="auth.peut('gererMateriel') && selection.size" class="barre-selection">
      <span>{{ selection.size }} sélectionné(s)</span>
      <button class="btn btn-petit btn-principal" @click="modale = 'affectation'">Déplacer la sélection</button>
      <button class="btn btn-petit btn-discret" @click="selection = new Set()">Désélectionner</button>
    </div>

    <div class="table-conteneur" :aria-busy="chargement">
      <table>
        <thead>
          <tr>
            <th v-if="auth.peut('gererMateriel')">
              <input type="checkbox" :checked="toutSelectionne" aria-label="Tout sélectionner" @change="basculerTout" />
            </th>
            <th>N° de série</th>
            <th>Type</th>
            <th>Marque / modèle</th>
            <th>Emplacement</th>
            <th>État</th>
            <th>Aptitude</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in resultat?.elements"
            :key="m.id"
            class="cliquable"
            @click="router.push({ name: 'materiel', params: { id: m.id } })"
          >
            <td v-if="auth.peut('gererMateriel')" @click.stop>
              <input
                type="checkbox"
                :checked="selection.has(m.id)"
                :aria-label="`Sélectionner ${m.numeroSerie}`"
                @change="basculer(m.id)"
              />
            </td>
            <td>
              <RouterLink :to="{ name: 'materiel', params: { id: m.id } }" class="etiquette" @click.stop>
                {{ m.numeroSerie }}
              </RouterLink>
            </td>
            <td>{{ m.type.libelle }}</td>
            <td>{{ m.marque }} <span class="discret">{{ m.modele }}</span></td>
            <td>
              <template v-if="m.salle">{{ m.salle.code }} <span class="discret">{{ m.salle.nom }}</span></template>
              <span v-else class="discret">Non affecté</span>
              <span v-if="m.poste" class="etiquette poste">{{ m.poste.hostname }}</span>
            </td>
            <td><BadgeStatut :ton="TON_ETAT[m.etat]" :texte="ETATS[m.etat]" /></td>
            <td>
              <BadgeStatut :ton="TON_APTITUDE[m.statutAptitude]" :texte="APTITUDES[m.statutAptitude]" />
              <span class="discret petit"> {{ date(m.finAptitude) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="resultat && !resultat.elements.length" class="vide">
        Aucun matériel ne correspond à ces critères.
        <button class="btn btn-petit" @click="reinitialiser">Effacer les filtres</button>
      </p>
    </div>
    <PaginationBarre v-if="resultat" :page="page" :taille="resultat.taille" :total="resultat.total" @changer="page = $event" />

    <FenetreModale v-if="modale === 'ajout'" titre="Ajouter un matériel" large @fermer="modale = null">
      <MaterielFormulaire @enregistre="apresAjout" @annuler="modale = null" />
    </FenetreModale>
    <FenetreModale v-if="modale === 'import'" titre="Importer un lot de matériels" large @fermer="modale = null">
      <ImportCsv @termine="apresModification" @annuler="modale = null" />
    </FenetreModale>
    <FenetreModale v-if="modale === 'affectation'" titre="Déplacer la sélection" @fermer="modale = null">
      <AffectationFormulaire :ids="[...selection]" @termine="apresModification" @annuler="modale = null" />
    </FenetreModale>
  </div>
</template>

<style scoped>
.boutons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.barre-selection {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.6rem;
  border-radius: var(--rayon);
  background: var(--olive-clair);
}
td .etiquette.poste {
  margin-left: 0.4rem;
}
</style>
