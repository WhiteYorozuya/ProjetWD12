<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '@/api/client';
import type { EtatMateriel, Materiel } from '@/api/types';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { ETATS, versInputDate } from '@/utils/format';

const props = defineProps<{ materiel?: Materiel }>();
const emit = defineEmits<{ enregistre: [materiel: Materiel]; annuler: [] }>();

const referentiel = useReferentielStore();
const notifications = useNotificationsStore();
const enCours = ref(false);

const formulaire = reactive({
  numeroSerie: props.materiel?.numeroSerie ?? '',
  typeId: props.materiel?.typeId ?? (null as number | null),
  marque: props.materiel?.marque ?? '',
  modele: props.materiel?.modele ?? '',
  etat: props.materiel?.etat ?? ('' as EtatMateriel | ''),
  dateReception: versInputDate(props.materiel?.dateReception ?? new Date()),
  origine: props.materiel?.origine ?? 'CND',
  salleId: null as number | null,
  commentaire: props.materiel?.commentaire ?? '',
});

async function enregistrer() {
  enCours.value = true;
  const corps: Record<string, unknown> = {
    numeroSerie: formulaire.numeroSerie,
    typeId: formulaire.typeId,
    marque: formulaire.marque,
    modele: formulaire.modele,
    dateReception: formulaire.dateReception || undefined,
    origine: formulaire.origine || undefined,
    commentaire: formulaire.commentaire || undefined,
    etat: formulaire.etat || undefined,
  };
  try {
    let materiel: Materiel;
    if (props.materiel) {
      materiel = await api<Materiel>(`/materiels/${props.materiel.id}`, { methode: 'PATCH', corps });
      notifications.succes('Matériel modifié');
    } else {
      if (formulaire.salleId) corps.salleId = formulaire.salleId;
      materiel = await api<Materiel>('/materiels', { methode: 'POST', corps });
      notifications.succes(`Matériel ${materiel.numeroSerie} ajouté`);
    }
    emit('enregistre', materiel);
  } catch (e) {
    notifications.erreur(e);
  } finally {
    enCours.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="enregistrer">
    <div class="grille-form">
      <label class="champ">
        <span>Numéro de série</span>
        <input v-model.trim="formulaire.numeroSerie" required minlength="2" maxlength="60" autofocus />
      </label>
      <label class="champ">
        <span>Type</span>
        <select v-model="formulaire.typeId" required>
          <option :value="null" disabled>Choisir…</option>
          <option v-for="t in referentiel.types" :key="t.id" :value="t.id">{{ t.libelle }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Marque</span>
        <input v-model.trim="formulaire.marque" required maxlength="60" />
      </label>
      <label class="champ">
        <span>Modèle</span>
        <input v-model.trim="formulaire.modele" required maxlength="100" />
      </label>
      <label class="champ">
        <span>Date de réception</span>
        <input v-model="formulaire.dateReception" type="date" />
      </label>
      <label class="champ">
        <span>Origine</span>
        <input v-model.trim="formulaire.origine" maxlength="60" />
      </label>
      <label v-if="!materiel" class="champ">
        <span>Salle</span>
        <select v-model="formulaire.salleId">
          <option :value="null">Magasin (par défaut)</option>
          <option v-for="s in referentiel.salles" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
      <label class="champ">
        <span>État</span>
        <select v-model="formulaire.etat">
          <option v-if="!materiel" value="">Automatique (selon la salle)</option>
          <option v-for="(libelle, cle) in ETATS" :key="cle" :value="cle">{{ libelle }}</option>
        </select>
      </label>
    </div>
    <label class="champ commentaire">
      <span>Commentaire</span>
      <textarea v-model="formulaire.commentaire" maxlength="500" />
    </label>
    <div class="actions">
      <button type="button" class="btn" @click="emit('annuler')">Annuler</button>
      <button type="submit" class="btn btn-principal" :disabled="enCours">
        {{ materiel ? 'Enregistrer les modifications' : 'Ajouter le matériel' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.commentaire {
  margin-top: 0.9rem;
}
</style>
