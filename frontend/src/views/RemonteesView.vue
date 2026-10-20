<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import type { Poste, Priorite, Remontee, StatutRemontee, TypeRemontee } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import {
  PRIORITES,
  STATUTS_REMONTEE,
  TON_PRIORITE,
  TON_REMONTEE,
  TYPES_REMONTEE,
  dateHeure,
} from '@/utils/format';

const auth = useAuthStore();
const referentiel = useReferentielStore();
const notifications = useNotificationsStore();
const route = useRoute();

const liste = ref<Remontee[]>([]);
const filtres = reactive({ statut: '' as StatutRemontee | '', salleId: '', miennes: false });
const creation = ref(false);
const postesSalle = ref<Poste[]>([]);
const nouvelle = reactive({
  type: 'PANNE_MATERIEL' as TypeRemontee,
  priorite: 'NORMALE' as Priorite,
  titre: '',
  description: '',
  salleId: null as number | null,
  posteId: null as number | null,
});
const traitement = ref<Remontee | null>(null);
const reponse = reactive({ statut: 'EN_COURS' as StatutRemontee, texte: '' });

async function charger() {
  try {
    liste.value = await api<Remontee[]>('/remontees', { params: { ...filtres, miennes: filtres.miennes || undefined } });
  } catch (e) {
    notifications.erreur(e);
  }
}
watch(filtres, charger, { deep: true });

watch(
  () => nouvelle.salleId,
  async (id) => {
    postesSalle.value = id ? await api<Poste[]>('/postes', { params: { salleId: id } }) : [];
    // Le poste choisi doit appartenir à la salle choisie
    if (!postesSalle.value.some((p) => p.id === nouvelle.posteId)) nouvelle.posteId = null;
  },
);

onMounted(async () => {
  await referentiel.charger();
  await charger();
  // Arrivée depuis la fiche d'un poste : formulaire pré-rempli
  if (route.query.nouveau && route.query.posteId) {
    const poste = await api<Poste>(`/postes/${Number(route.query.posteId)}`);
    nouvelle.salleId = poste.salleId;
    nouvelle.posteId = poste.id;
    creation.value = true;
  }
});

async function creer() {
  try {
    await api('/remontees', {
      methode: 'POST',
      corps: { ...nouvelle, posteId: nouvelle.posteId ?? undefined, salleId: nouvelle.salleId ?? undefined },
    });
    notifications.succes('Remontée envoyée aux administrateurs de salle');
    creation.value = false;
    Object.assign(nouvelle, { titre: '', description: '', posteId: null });
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

function ouvrirTraitement(r: Remontee) {
  traitement.value = r;
  reponse.statut = r.statut === 'OUVERTE' ? 'EN_COURS' : r.statut;
  reponse.texte = r.reponse ?? '';
}

async function traiter() {
  if (!traitement.value) return;
  try {
    await api(`/remontees/${traitement.value.id}/traitement`, {
      methode: 'PATCH',
      corps: { statut: reponse.statut, reponse: reponse.texte || undefined },
    });
    notifications.succes('Remontée mise à jour');
    traitement.value = null;
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
        <h1>Remontées</h1>
        <p>Problèmes signalés par les formateurs et les utilisateurs des salles.</p>
      </div>
      <button class="btn btn-principal" @click="creation = true">Signaler un problème</button>
    </header>

    <div class="filtres">
      <label class="champ">
        <span>Statut</span>
        <select v-model="filtres.statut">
          <option value="">Tous</option>
          <option v-for="(l, cle) in STATUTS_REMONTEE" :key="cle" :value="cle">{{ l }}</option>
        </select>
      </label>
      <label class="champ">
        <span>Salle</span>
        <select v-model="filtres.salleId">
          <option value="">Toutes</option>
          <option v-for="s in referentiel.salles" :key="s.id" :value="String(s.id)">{{ s.code }} – {{ s.nom }}</option>
        </select>
      </label>
      <label class="case"><input v-model="filtres.miennes" type="checkbox" /> Uniquement mes remontées</label>
    </div>

    <ul class="remontees">
      <li v-for="r in liste" :key="r.id" :class="`statut-${r.statut.toLowerCase()}`">
        <div class="tete">
          <BadgeStatut :ton="TON_REMONTEE[r.statut]" :texte="STATUTS_REMONTEE[r.statut]" />
          <BadgeStatut :ton="TON_PRIORITE[r.priorite]" :texte="`Priorité ${PRIORITES[r.priorite].toLowerCase()}`" />
          <span class="discret petit">{{ TYPES_REMONTEE[r.type] }}</span>
        </div>
        <h3>{{ r.titre }}</h3>
        <p>{{ r.description }}</p>
        <p class="discret petit">
          Salle {{ r.salle?.code }}<template v-if="r.poste">, poste {{ r.poste.hostname }}</template>, signalé par
          {{ r.auteur?.prenom }} {{ r.auteur?.nom }} le {{ dateHeure(r.createdAt) }}
        </p>
        <p v-if="r.reponse" class="reponse">
          <strong>{{ r.traitant?.prenom }} {{ r.traitant?.nom }} :</strong> {{ r.reponse }}
        </p>
        <button v-if="auth.peut('traiterRemontees')" class="btn btn-petit" @click="ouvrirTraitement(r)">
          {{ r.statut === 'RESOLUE' ? 'Rouvrir ou compléter' : 'Traiter' }}
        </button>
      </li>
    </ul>
    <p v-if="!liste.length" class="vide bloc">Aucune remontée.</p>

    <FenetreModale v-if="creation" titre="Signaler un problème" large @fermer="creation = false">
      <form @submit.prevent="creer">
        <div class="grille-form">
          <label class="champ">
            <span>Salle</span>
            <select v-model="nouvelle.salleId" required>
              <option :value="null" disabled>Choisir…</option>
              <option v-for="s in referentiel.salles" :key="s.id" :value="s.id">{{ s.code }} – {{ s.nom }}</option>
            </select>
          </label>
          <label class="champ">
            <span>Poste concerné</span>
            <select v-model="nouvelle.posteId">
              <option :value="null">Toute la salle</option>
              <option v-for="p in postesSalle" :key="p.id" :value="p.id">{{ p.hostname }}</option>
            </select>
          </label>
          <label class="champ">
            <span>Type</span>
            <select v-model="nouvelle.type">
              <option v-for="(l, cle) in TYPES_REMONTEE" :key="cle" :value="cle">{{ l }}</option>
            </select>
          </label>
          <label class="champ">
            <span>Priorité</span>
            <select v-model="nouvelle.priorite">
              <option v-for="(l, cle) in PRIORITES" :key="cle" :value="cle">{{ l }}</option>
            </select>
          </label>
        </div>
        <label class="champ espace"><span>Titre</span><input v-model.trim="nouvelle.titre" required minlength="3" maxlength="150" /></label>
        <label class="champ espace">
          <span>Description</span>
          <textarea v-model.trim="nouvelle.description" required minlength="3" maxlength="3000" placeholder="Ce qui se passe, depuis quand, ce que vous avez déjà essayé" />
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="creation = false">Annuler</button>
          <button type="submit" class="btn btn-principal">Envoyer la remontée</button>
        </div>
      </form>
    </FenetreModale>

    <FenetreModale v-if="traitement" :titre="traitement.titre" @fermer="traitement = null">
      <form @submit.prevent="traiter">
        <label class="champ">
          <span>Statut</span>
          <select v-model="reponse.statut">
            <option v-for="(l, cle) in STATUTS_REMONTEE" :key="cle" :value="cle">{{ l }}</option>
          </select>
        </label>
        <label class="champ espace">
          <span>Réponse au demandeur</span>
          <textarea v-model.trim="reponse.texte" maxlength="3000" />
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="traitement = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Enregistrer</button>
        </div>
      </form>
    </FenetreModale>
  </div>
</template>

<style scoped>
.case {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
}
.remontees {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.remontees li {
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--trait);
  border-left: 4px solid var(--danger);
  border-radius: var(--rayon);
  background: var(--surface);
}
.remontees li.statut-en_cours {
  border-left-color: var(--attention);
}
.remontees li.statut-resolue {
  border-left-color: var(--ok);
  background: transparent;
}
.tete {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
h3 {
  margin-bottom: 0.3rem;
}
.reponse {
  padding: 0.5rem 0.7rem;
  border-radius: var(--rayon);
  background: var(--olive-clair);
}
.espace {
  margin-top: 0.9rem;
}
</style>
