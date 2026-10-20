<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { api } from '@/api/client';
import type { EtatMateriel, TableauDeBord } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import { COULEURS_ETAT, PALETTE } from '@/components/graphiques';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import {
  ETATS,
  STATUTS_REMONTEE,
  TON_NIVEAU,
  TON_REMONTEE,
  TYPES_ALERTE,
  dateHeure,
} from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const donnees = ref<TableauDeBord | null>(null);

async function charger() {
  try {
    donnees.value = await api<TableauDeBord>('/tableau-de-bord');
  } catch (e) {
    notifications.erreur(e);
  }
}

let minuterie: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void charger();
  minuterie = setInterval(charger, 30_000);
});
onUnmounted(() => clearInterval(minuterie));

const indicateurs = computed(() => {
  const d = donnees.value;
  if (!d) return [];
  return [
    { valeur: d.materiels.total, libelle: 'matériels inventoriés', lien: { name: 'materiels' } },
    {
      valeur: (d.materiels.parEtat.EN_PANNE ?? 0) + (d.materiels.parEtat.EN_REPARATION ?? 0),
      libelle: 'en panne ou en réparation',
      lien: { name: 'materiels', query: { etat: 'EN_PANNE' } },
      alerte: (d.materiels.parEtat.EN_PANNE ?? 0) > 0,
    },
    { valeur: `${d.postes.enLigne}/${d.postes.total}`, libelle: 'postes en ligne', lien: { name: 'postes' } },
    {
      valeur: d.remontees.ouvertes + d.remontees.enCours,
      libelle: 'remontées à traiter',
      lien: { name: 'remontees' },
      alerte: d.remontees.ouvertes > 0,
    },
    { valeur: d.alertesActives, libelle: 'alertes actives', lien: { name: 'alertes' }, alerte: d.alertesActives > 0 },
    {
      valeur: d.materiels.aptitudesExpirees + d.materiels.aptitudesProches,
      libelle: `aptitudes échues ou < 90 j`,
      lien: { name: 'materiels', query: { aptitude: 'EXPIREE' } },
    },
  ];
});

const graphiqueEtats = computed(() => {
  const parEtat = donnees.value?.materiels.parEtat ?? {};
  const etats = (Object.keys(ETATS) as EtatMateriel[]).filter((e) => parEtat[e]);
  return {
    labels: etats.map((e) => ETATS[e]),
    datasets: [{ data: etats.map((e) => parEtat[e] ?? 0), backgroundColor: etats.map((e) => COULEURS_ETAT[e]), borderWidth: 2, borderColor: '#f9faf8' }],
  };
});

const graphiqueTypes = computed(() => ({
  labels: donnees.value?.materiels.parType.map((t) => t.type) ?? [],
  datasets: [{ label: 'Matériels', data: donnees.value?.materiels.parType.map((t) => t.nombre) ?? [], backgroundColor: PALETTE[0], borderRadius: 3 }],
}));

const graphiqueProcessus = computed(() => ({
  labels: donnees.value?.topProcessus.map((p) => p.nom) ?? [],
  datasets: [{ label: 'Heures cumulées (7 jours)', data: donnees.value?.topProcessus.map((p) => p.heures) ?? [], backgroundColor: PALETTE[1], borderRadius: 3 }],
}));

const optionsBarresH = { indexAxis: 'y' as const, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } };
const optionsAnneau = { cutout: '62%', plugins: { legend: { position: 'right' as const } } };
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Bonjour {{ auth.utilisateur?.prenom }}</h1>
        <p>Situation du parc, actualisée toutes les 30 secondes.</p>
      </div>
    </header>

    <p v-if="!donnees" class="discret">Chargement…</p>
    <template v-else>
      <section class="indicateurs" aria-label="Indicateurs clés">
        <RouterLink v-for="i in indicateurs" :key="i.libelle" :to="i.lien" class="indicateur" :class="{ alerte: i.alerte }">
          <strong>{{ i.valeur }}</strong>
          <span>{{ i.libelle }}</span>
        </RouterLink>
      </section>

      <div class="grille">
        <section class="bloc">
          <h2>Matériels par état</h2>
          <div class="graphique"><Doughnut :data="graphiqueEtats" :options="optionsAnneau" /></div>
        </section>
        <section class="bloc">
          <h2>Matériels par type</h2>
          <div class="graphique"><Bar :data="graphiqueTypes" :options="optionsBarresH" /></div>
        </section>
        <section class="bloc">
          <h2>Logiciels les plus utilisés</h2>
          <p class="petit discret">Heures cumulées sur l'ensemble des postes, 7 derniers jours.</p>
          <div class="graphique"><Bar :data="graphiqueProcessus" :options="optionsBarresH" /></div>
        </section>
      </div>

      <div class="deux-colonnes section">
        <section>
          <header class="titre-liste">
            <h2>Alertes actives</h2>
            <RouterLink :to="{ name: 'alertes' }">Toutes les alertes</RouterLink>
          </header>
          <ul v-if="donnees.dernieresAlertes.length" class="liste">
            <li v-for="a in donnees.dernieresAlertes" :key="a.id">
              <BadgeStatut :ton="TON_NIVEAU[a.niveau]" :texte="TYPES_ALERTE[a.type]" />
              <span>{{ a.message }}</span>
              <span class="discret petit">{{ dateHeure(a.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="vide bloc">Aucune alerte active.</p>
        </section>
        <section>
          <header class="titre-liste">
            <h2>Remontées en attente</h2>
            <RouterLink :to="{ name: 'remontees' }">Toutes les remontées</RouterLink>
          </header>
          <ul v-if="donnees.dernieresRemontees.length" class="liste">
            <li v-for="r in donnees.dernieresRemontees" :key="r.id">
              <BadgeStatut :ton="TON_REMONTEE[r.statut]" :texte="STATUTS_REMONTEE[r.statut]" />
              <span>
                {{ r.titre }}
                <span class="discret petit">— salle {{ r.salle?.code }}<template v-if="r.poste">, {{ r.poste.hostname }}</template></span>
              </span>
              <span class="discret petit">{{ dateHeure(r.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="vide bloc">Aucune remontée en attente.</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.indicateurs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  border: 1px solid var(--trait);
  border-radius: var(--rayon-grand);
  background: var(--surface);
  overflow: hidden;
}
.indicateur {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 1rem 1.1rem;
  text-decoration: none;
  color: var(--encre);
  border-right: 1px solid var(--trait);
  border-top: 3px solid transparent;
}
.indicateur:last-child {
  border-right: 0;
}
.indicateur:hover {
  background: #fff;
  border-top-color: var(--olive);
}
.indicateur strong {
  font-size: 2.1rem;
  line-height: 1.1;
  font-variation-settings: 'wdth' 70;
}
.indicateur span {
  color: var(--encre-douce);
  font-size: 0.9rem;
}
.indicateur.alerte {
  border-top-color: var(--danger);
}
.indicateur.alerte strong {
  color: var(--danger);
}
.grille {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.2rem;
  margin-top: 1.5rem;
}
.grille h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.graphique {
  height: 240px;
}
.titre-liste {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.6rem;
}
.titre-liste h2 {
  font-size: 1.15rem;
}
.liste {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--trait);
  border-radius: var(--rayon-grand);
  background: var(--surface);
}
.liste li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.7rem;
  align-items: baseline;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--trait);
}
.liste li:last-child {
  border-bottom: 0;
}
@media (max-width: 640px) {
  .liste li {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>
