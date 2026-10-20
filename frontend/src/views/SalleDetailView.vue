<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, telecharger } from '@/api/client';
import type { EtatMateriel, Poste, Salle } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { ETATS, TON_ETAT, TYPES_SALLE, depuis } from '@/utils/format';

interface SalleDetail extends Salle {
  postes: Poste[];
  materiels: {
    id: number;
    numeroSerie: string;
    marque: string;
    modele: string;
    etat: EtatMateriel;
    type: { libelle: string };
    poste: { hostname: string } | null;
  }[];
}

const props = defineProps<{ id: number }>();
const auth = useAuthStore();
const notifications = useNotificationsStore();
const router = useRouter();

const salle = ref<SalleDetail | null>(null);
const replaquage = ref(false);
const image = ref('Master standard');

async function charger() {
  try {
    salle.value = await api<SalleDetail>(`/salles/${props.id}`);
  } catch (e) {
    notifications.erreur(e);
  }
}
onMounted(charger);

async function etatDesLieux() {
  try {
    await telecharger(`/documents/etat-des-lieux/salles/${props.id}`, 'etat-des-lieux.pdf');
  } catch (e) {
    notifications.erreur(e);
  }
}

async function replaquer() {
  try {
    const r = await api<{ lot: string; creees: number; ignorees: number }>(`/reinstallations/salle/${props.id}`, {
      methode: 'POST',
      corps: { image: image.value },
    });
    replaquage.value = false;
    notifications.succes(
      `Replaquage lancé sur ${r.creees} poste(s)${r.ignorees ? ` — ${r.ignorees} déjà en cours de réinstallation` : ''}`,
    );
    void router.push({ name: 'reinstallations', query: { lot: r.lot } });
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div v-if="salle">
    <p><RouterLink :to="{ name: 'salles' }">Salles</RouterLink></p>
    <header class="entete-page">
      <div>
        <h1>Salle {{ salle.code }} — {{ salle.nom }}</h1>
        <p>{{ TYPES_SALLE[salle.type] }}<template v-if="salle.batiment">, {{ salle.batiment }}</template>, {{ salle.capacite }} places</p>
      </div>
      <div class="boutons">
        <RouterLink v-if="auth.peut('superviser') && salle.postes.length" :to="{ name: 'supervision', query: { salle: salle.id } }" class="btn">
          Superviser la salle
        </RouterLink>
        <button v-if="auth.peut('documents')" class="btn" @click="etatDesLieux">État des lieux (PDF)</button>
        <button v-if="auth.peut('gererPostes') && salle.postes.length" class="btn btn-principal" @click="replaquage = true">
          Replaquer la salle
        </button>
      </div>
    </header>

    <section class="section">
      <h2>Postes ({{ salle.postes.length }})</h2>
      <div v-if="salle.postes.length" class="postes">
        <RouterLink v-for="p in salle.postes" :key="p.id" :to="{ name: 'poste', params: { id: p.id } }" class="poste" :class="{ eteint: !p.enLigne }">
          <span class="etiquette poste">{{ p.hostname }}</span>
          <span class="petit">{{ p.enLigne ? 'En ligne' : 'Hors ligne' }}</span>
          <span class="petit discret">{{ p.enLigne ? (p.utilisateurConnecte ?? 'Aucune session') : depuis(p.derniereConnexion) }}</span>
        </RouterLink>
      </div>
      <p v-else class="vide bloc">Aucun poste déclaré dans cette salle.</p>
    </section>

    <section class="section">
      <h2>Matériel ({{ salle.materiels.length }})</h2>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>N° de série</th>
              <th>Type</th>
              <th>Marque / modèle</th>
              <th>Poste</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in salle.materiels" :key="m.id" class="cliquable" @click="router.push({ name: 'materiel', params: { id: m.id } })">
              <td><span class="etiquette">{{ m.numeroSerie }}</span></td>
              <td>{{ m.type.libelle }}</td>
              <td>{{ m.marque }} <span class="discret">{{ m.modele }}</span></td>
              <td>{{ m.poste?.hostname ?? '—' }}</td>
              <td><BadgeStatut :ton="TON_ETAT[m.etat]" :texte="ETATS[m.etat]" /></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!salle.materiels.length" class="vide">Aucun matériel dans cette salle.</p>
      </div>
    </section>

    <FenetreModale v-if="replaquage" :titre="`Replaquer la salle ${salle.code}`" @fermer="replaquage = false">
      <form @submit.prevent="replaquer">
        <p>
          Les {{ salle.postes.length }} postes de la salle seront réinstallés à partir de l'image choisie. Toutes les
          données locales des postes seront effacées.
        </p>
        <label class="champ">
          <span>Image (master)</span>
          <input v-model.trim="image" required maxlength="120" />
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="replaquage = false">Annuler</button>
          <button type="submit" class="btn btn-principal">Lancer le replaquage</button>
        </div>
      </form>
    </FenetreModale>
  </div>
</template>

<style scoped>
.boutons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.postes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.6rem;
}
.poste {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--trait);
  border-left: 4px solid var(--ok);
  border-radius: var(--rayon);
  background: var(--surface);
  color: var(--encre);
  text-decoration: none;
}
.poste:hover {
  background: #fff;
}
.poste.eteint {
  border-left-color: var(--trait-fort);
  color: var(--encre-douce);
}
.poste .etiquette {
  align-self: flex-start;
}
</style>
