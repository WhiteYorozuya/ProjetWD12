<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Bar, Line } from 'vue-chartjs';
import { api } from '@/api/client';
import type { ActiviteJour, OccupationSalle, StatProcessus } from '@/api/types';
import { PALETTE } from '@/components/graphiques';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';

const notifications = useNotificationsStore();
const referentiel = useReferentielStore();

const jours = ref(7);
const salleId = ref('');
const processus = ref<StatProcessus[]>([]);
const salles = ref<OccupationSalle[]>([]);
const activite = ref<ActiviteJour[]>([]);

async function charger() {
  try {
    const params = { jours: jours.value, salleId: salleId.value };
    [processus.value, salles.value, activite.value] = await Promise.all([
      api<StatProcessus[]>('/statistiques/processus', { params }),
      api<OccupationSalle[]>('/statistiques/salles', { params }),
      api<ActiviteJour[]>('/statistiques/activite', { params }),
    ]);
  } catch (e) {
    notifications.erreur(e);
  }
}
watch([jours, salleId], charger);
onMounted(async () => {
  await referentiel.charger();
  await charger();
});

const graphiqueActivite = computed(() => ({
  labels: activite.value.map((a) => new Date(a.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
  datasets: [
    {
      label: "Heures d'utilisation",
      data: activite.value.map((a) => a.heuresUtilisation),
      borderColor: PALETTE[0],
      backgroundColor: 'rgba(79, 97, 66, 0.12)',
      fill: true,
      tension: 0.25,
      yAxisID: 'y',
    },
    {
      label: 'Postes actifs',
      data: activite.value.map((a) => a.postesActifs),
      borderColor: PALETTE[1],
      backgroundColor: PALETTE[1],
      tension: 0.25,
      yAxisID: 'y1',
    },
  ],
}));
const optionsActivite = {
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'heures' } },
    y1: { beginAtZero: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'postes' } },
  },
};

const graphiqueProcessus = computed(() => ({
  labels: processus.value.map((p) => p.nom),
  datasets: [{ label: 'Heures cumulées', data: processus.value.map((p) => p.heures), backgroundColor: PALETTE[0], borderRadius: 3 }],
}));
const optionsBarres = { indexAxis: 'y' as const, plugins: { legend: { display: false } } };

const tauxSalle = (s: OccupationSalle) => (s.nbPostes ? Math.round((s.postesActifs / s.nbPostes) * 100) : 0);
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Statistiques d'utilisation</h1>
        <p>Calculées à partir des remontées des agents : temps de session ouverte et temps d'exécution des logiciels.</p>
      </div>
      <div class="filtres periode">
        <label class="champ">
          <span>Période</span>
          <select v-model.number="jours">
            <option :value="7">7 derniers jours</option>
            <option :value="30">30 derniers jours</option>
            <option :value="90">90 derniers jours</option>
          </select>
        </label>
        <label class="champ">
          <span>Salle (logiciels)</span>
          <select v-model="salleId">
            <option value="">Toutes</option>
            <option v-for="s in referentiel.salles.filter((x) => x.type !== 'MAGASIN')" :key="s.id" :value="String(s.id)">
              {{ s.code }} – {{ s.nom }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section class="bloc">
      <h2>Activité du parc</h2>
      <div class="graphique"><Line :data="graphiqueActivite" :options="optionsActivite" /></div>
    </section>

    <div class="deux-colonnes section">
      <section class="bloc">
        <h2>Logiciels les plus utilisés</h2>
        <div class="graphique haut"><Bar :data="graphiqueProcessus" :options="optionsBarres" /></div>
      </section>
      <section>
        <h2>Utilisation des salles</h2>
        <div class="table-conteneur">
          <table>
            <thead>
              <tr>
                <th>Salle</th>
                <th class="num">Postes utilisés</th>
                <th class="num">Heures de session</th>
                <th class="num">CPU moyen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in salles" :key="s.salleId">
                <td>{{ s.code }} <span class="discret">{{ s.nom }}</span></td>
                <td class="num">
                  {{ s.postesActifs }} / {{ s.nbPostes }}
                  <span class="taux" :style="{ '--taux': `${tauxSalle(s)}%` }" :title="`${tauxSalle(s)} %`" />
                </td>
                <td class="num">{{ s.heuresUtilisation.toLocaleString('fr-FR') }} h</td>
                <td class="num">{{ s.cpuMoyen === null ? '—' : `${s.cpuMoyen} %` }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.periode {
  margin: 0;
}
.bloc h2,
.section h2 {
  font-size: 1.1rem;
  margin-bottom: 0.6rem;
}
.graphique {
  height: 280px;
}
.graphique.haut {
  height: 360px;
}
.taux {
  display: inline-block;
  width: 48px;
  height: 6px;
  margin-left: 0.4rem;
  border-radius: 3px;
  vertical-align: middle;
  background: linear-gradient(90deg, var(--olive) var(--taux), var(--neutre-fond) var(--taux));
}
</style>
