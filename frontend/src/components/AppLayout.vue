<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { Alerte } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import type { Droit } from '@/utils/droits';
import { ROLES } from '@/utils/format';

interface Lien {
  nom: string;
  libelle: string;
  droit?: Droit;
}

const groupes: { titre: string; liens: Lien[] }[] = [
  {
    titre: 'Parc',
    liens: [
      { nom: 'tableau-de-bord', libelle: 'Tableau de bord' },
      { nom: 'materiels', libelle: 'Matériels' },
      { nom: 'salles', libelle: 'Salles' },
      { nom: 'postes', libelle: 'Postes' },
    ],
  },
  {
    titre: 'Exploitation',
    liens: [
      { nom: 'supervision', libelle: 'Supervision', droit: 'superviser' },
      { nom: 'remontees', libelle: 'Remontées' },
      { nom: 'reinstallations', libelle: 'Réinstallations' },
      { nom: 'alertes', libelle: 'Alertes' },
    ],
  },
  {
    titre: 'Pilotage',
    liens: [
      { nom: 'statistiques', libelle: 'Statistiques' },
      { nom: 'documents', libelle: 'Documents', droit: 'documents' },
    ],
  },
  {
    titre: 'Administration',
    liens: [
      { nom: 'parametrage', libelle: 'Paramétrage' },
      { nom: 'utilisateurs', libelle: 'Utilisateurs', droit: 'gererUtilisateurs' },
    ],
  },
];

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const menuOuvert = ref(false);
const nbAlertes = ref(0);

const groupesVisibles = computed(() =>
  groupes
    .map((g) => ({ ...g, liens: g.liens.filter((l) => !l.droit || auth.peut(l.droit)) }))
    .filter((g) => g.liens.length > 0),
);

async function compterAlertes() {
  try {
    nbAlertes.value = (await api<Alerte[]>('/alertes', { params: { acquittee: false } })).length;
  } catch {
    /* sans incidence sur la navigation */
  }
}

let minuterie: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void compterAlertes();
  minuterie = setInterval(compterAlertes, 30_000);
});
onUnmounted(() => clearInterval(minuterie));
watch(
  () => route.path,
  () => {
    menuOuvert.value = false;
    void compterAlertes();
  },
);

function deconnecter() {
  auth.deconnecter();
  void router.push({ name: 'connexion' });
}
</script>

<template>
  <div class="cadre">
    <a class="evitement" href="#contenu">Aller au contenu</a>
    <aside class="barre" :class="{ ouverte: menuOuvert }">
      <div class="marque">
        <RouterLink :to="{ name: 'tableau-de-bord' }" class="logo">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M5 9h15l6 7-6 7H5z" fill="currentColor" />
            <circle cx="20" cy="16" r="2.2" fill="var(--encre)" />
          </svg>
          ASTER
        </RouterLink>
        <button class="btn btn-discret bascule" :aria-expanded="menuOuvert" aria-controls="navigation" @click="menuOuvert = !menuOuvert">
          Menu
        </button>
      </div>

      <nav id="navigation" aria-label="Navigation principale">
        <div v-for="g in groupesVisibles" :key="g.titre" class="groupe">
          <p class="titre-groupe">{{ g.titre }}</p>
          <RouterLink v-for="l in g.liens" :key="l.nom" :to="{ name: l.nom }" class="lien">
            <span>{{ l.libelle }}</span>
            <span v-if="l.nom === 'alertes' && nbAlertes > 0" class="compteur" :aria-label="`${nbAlertes} alertes actives`">
              {{ nbAlertes }}
            </span>
          </RouterLink>
        </div>
      </nav>

      <div v-if="auth.utilisateur" class="compte">
        <RouterLink :to="{ name: 'profil' }" class="nom">
          {{ auth.utilisateur.prenom }} {{ auth.utilisateur.nom }}
        </RouterLink>
        <span class="role">{{ ROLES[auth.utilisateur.role] }}</span>
        <button class="btn btn-petit deconnexion" @click="deconnecter">Se déconnecter</button>
      </div>
    </aside>

    <main id="contenu" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.cadre {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.evitement {
  position: absolute;
  left: -999px;
}
.evitement:focus {
  left: 1rem;
  top: 1rem;
  z-index: 100;
  background: var(--signal);
  padding: 0.5rem 1rem;
}
.barre {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--encre);
  color: #dfe5df;
  padding: 1.2rem 0.9rem;
  overflow-y: auto;
}
.marque {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.6rem;
  padding-inline: 0.4rem;
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--signal);
  text-decoration: none;
  font-size: 1.35rem;
  font-weight: 800;
  font-variation-settings: 'wdth' 70;
  letter-spacing: 0.01em;
}
.logo svg {
  width: 30px;
  height: 30px;
}
.bascule {
  display: none;
  color: inherit;
}
.groupe {
  margin-bottom: 1.1rem;
}
.titre-groupe {
  margin: 0 0 0.3rem;
  padding-inline: 0.6rem;
  font-size: 0.8rem;
  color: #8f9c95;
}
.lien {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.42rem 0.6rem;
  border-radius: var(--rayon);
  color: #dfe5df;
  text-decoration: none;
  border-left: 3px solid transparent;
}
.lien:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.lien.router-link-exact-active,
.lien.router-link-active:not([href='/']) {
  background: rgba(226, 179, 61, 0.12);
  border-left-color: var(--signal);
  color: #fff;
  font-weight: 600;
}
.compteur {
  min-width: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}
.compte {
  margin-top: auto;
  padding: 0.9rem 0.6rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.nom {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}
.role {
  font-size: 0.85rem;
  color: #8f9c95;
}
.deconnexion {
  margin-top: 0.6rem;
  align-self: flex-start;
  background: transparent;
  color: #dfe5df;
  border-color: rgba(255, 255, 255, 0.25);
}
.deconnexion:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
main {
  padding: 2rem clamp(1rem, 3vw, 2.5rem) 4rem;
  min-width: 0;
  max-width: 1400px;
  outline: none;
}

@media (max-width: 900px) {
  .cadre {
    grid-template-columns: 1fr;
  }
  .barre {
    position: static;
    height: auto;
    padding: 0.8rem 1rem;
  }
  .marque {
    margin-bottom: 0;
  }
  .bascule {
    display: inline-flex;
  }
  .barre nav,
  .barre .compte {
    display: none;
  }
  .barre.ouverte nav,
  .barre.ouverte .compte {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
  }
  main {
    padding-top: 1.4rem;
  }
}
</style>
