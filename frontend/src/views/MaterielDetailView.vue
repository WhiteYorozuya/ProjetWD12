<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api/client';
import type { Materiel } from '@/api/types';
import AffectationFormulaire from '@/components/AffectationFormulaire.vue';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import MaterielFormulaire from '@/components/MaterielFormulaire.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';
import { APTITUDES, ETATS, TON_APTITUDE, TON_ETAT, date, dateHeure } from '@/utils/format';

const props = defineProps<{ id: number }>();
const auth = useAuthStore();
const referentiel = useReferentielStore();
const notifications = useNotificationsStore();

const materiel = ref<Materiel | null>(null);
const modale = ref<'modifier' | 'deplacer' | null>(null);

async function charger() {
  try {
    materiel.value = await api<Materiel>(`/materiels/${props.id}`);
  } catch (e) {
    notifications.erreur(e);
  }
}

onMounted(async () => {
  await Promise.all([charger(), referentiel.charger()]);
});

function apres() {
  modale.value = null;
  void charger();
}
</script>

<template>
  <div v-if="materiel">
    <p><RouterLink :to="{ name: 'materiels' }">Matériels</RouterLink></p>
    <header class="entete-page">
      <div>
        <h1>{{ materiel.type.libelle }} {{ materiel.marque }} {{ materiel.modele }}</h1>
        <p><span class="etiquette grande">{{ materiel.numeroSerie }}</span></p>
      </div>
      <div v-if="auth.peut('gererMateriel')" class="boutons">
        <button class="btn" @click="modale = 'modifier'">Modifier</button>
        <button class="btn btn-principal" @click="modale = 'deplacer'">Affecter / déplacer</button>
      </div>
    </header>

    <div class="deux-colonnes">
      <section class="bloc">
        <h2>Situation</h2>
        <dl class="liste-definitions">
          <dt>État</dt>
          <dd><BadgeStatut :ton="TON_ETAT[materiel.etat]" :texte="ETATS[materiel.etat]" /></dd>
          <dt>Salle</dt>
          <dd>
            <RouterLink v-if="materiel.salle" :to="{ name: 'salle', params: { id: materiel.salle.id } }">
              {{ materiel.salle.code }} – {{ materiel.salle.nom }}
            </RouterLink>
            <span v-else class="discret">Non affecté</span>
          </dd>
          <dt>Poste</dt>
          <dd>
            <RouterLink v-if="materiel.poste" :to="{ name: 'poste', params: { id: materiel.poste.id } }" class="etiquette poste">
              {{ materiel.poste.hostname }}
            </RouterLink>
            <span v-else class="discret">—</span>
          </dd>
          <dt>Commentaire</dt>
          <dd>{{ materiel.commentaire || '—' }}</dd>
        </dl>
      </section>

      <section class="bloc">
        <h2>Aptitude</h2>
        <dl class="liste-definitions">
          <dt>Réception</dt>
          <dd>{{ date(materiel.dateReception) }} <span class="discret">({{ materiel.origine }})</span></dd>
          <dt>Durée d'aptitude</dt>
          <dd>{{ materiel.type.dureeAptitudeMois }} mois</dd>
          <dt>Fin d'aptitude</dt>
          <dd>
            {{ date(materiel.finAptitude) }}
            <BadgeStatut :ton="TON_APTITUDE[materiel.statutAptitude]" :texte="APTITUDES[materiel.statutAptitude]" />
          </dd>
          <dt>Formations induites</dt>
          <dd>
            <ul v-if="materiel.type.formations?.length" class="formations">
              <li v-for="f in materiel.type.formations" :key="f.id">{{ f.intitule }} <span class="discret">({{ f.dureeHeures }} h)</span></li>
            </ul>
            <span v-else class="discret">Aucune</span>
          </dd>
        </dl>
      </section>
    </div>

    <section class="section">
      <h2>Historique des mouvements</h2>
      <ol class="historique">
        <li v-for="mv in materiel.mouvements" :key="mv.id">
          <span class="quand">{{ dateHeure(mv.date) }}</span>
          <div>
            <p>
              <template v-if="mv.deSalle || mv.dePoste">
                De <strong>{{ mv.deSalle ?? '—' }}</strong><template v-if="mv.dePoste"> ({{ mv.dePoste }})</template>
                vers
              </template>
              <template v-else>Entrée dans </template>
              <strong>{{ mv.versSalle ?? 'aucune salle' }}</strong><template v-if="mv.versPoste"> ({{ mv.versPoste }})</template>
            </p>
            <p class="discret petit">{{ mv.motif || 'Sans motif' }} — {{ mv.auteur.prenom }} {{ mv.auteur.nom }}</p>
          </div>
        </li>
      </ol>
    </section>

    <FenetreModale v-if="modale === 'modifier'" titre="Modifier le matériel" large @fermer="modale = null">
      <MaterielFormulaire :materiel="materiel" @enregistre="apres" @annuler="modale = null" />
    </FenetreModale>
    <FenetreModale v-if="modale === 'deplacer'" :titre="`Affecter ${materiel.numeroSerie}`" @fermer="modale = null">
      <AffectationFormulaire :ids="[materiel.id]" @termine="apres" @annuler="modale = null" />
    </FenetreModale>
  </div>
</template>

<style scoped>
.boutons {
  display: flex;
  gap: 0.5rem;
}
.etiquette.grande {
  font-size: 1.05rem;
  padding: 0.15rem 0.8rem 0.15rem 0.6rem;
}
.bloc h2 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
}
.formations {
  margin: 0;
  padding-left: 1.1rem;
}
.historique {
  list-style: none;
  margin: 0;
  padding: 0 0 0 1rem;
  border-left: 2px solid var(--trait-fort);
}
.historique li {
  position: relative;
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  gap: 1rem;
  padding: 0.4rem 0 0.8rem;
}
.historique li::before {
  content: '';
  position: absolute;
  left: calc(-1rem - 6px);
  top: 0.75rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--olive);
  border: 2px solid var(--papier);
}
.historique p {
  margin: 0;
}
.quand {
  color: var(--encre-douce);
  font-size: 0.9rem;
}
@media (max-width: 640px) {
  .historique li {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
