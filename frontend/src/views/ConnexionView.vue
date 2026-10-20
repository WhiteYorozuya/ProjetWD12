<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref('');
const motDePasse = ref('');
const erreur = ref(route.query.expiree ? 'Votre session a expiré. Reconnectez-vous.' : '');
const enCours = ref(false);

const comptesDemo = import.meta.env.VITE_COMPTES_DEMO === 'true';
const demo = [
  { email: 'admin@parcform.local', role: 'Administrateur' },
  { email: 'gestionnaire@parcform.local', role: 'Gestionnaire de matériel' },
  { email: 'adminsalle@parcform.local', role: 'Administrateur de salle' },
  { email: 'formateur@parcform.local', role: 'Formateur' },
];

async function connecter() {
  erreur.value = '';
  enCours.value = true;
  try {
    await auth.connecter(email.value, motDePasse.value);
    const suite = typeof route.query.suite === 'string' && route.query.suite.startsWith('/') ? route.query.suite : '/';
    await router.replace(suite);
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Connexion impossible';
  } finally {
    enCours.value = false;
  }
}
</script>

<template>
  <div class="page">
    <section class="presentation">
      <div class="logo">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 9h15l6 7-6 7H5z" fill="currentColor" />
          <circle cx="20" cy="16" r="2.2" fill="var(--encre)" />
        </svg>
        ParcForm
      </div>
      <h1>Le parc informatique de l'école, salle par salle, poste par poste.</h1>
      <p>Inventaire du matériel reçu du CND, administration et supervision des postes de formation.</p>
      <div class="etiquettes" aria-hidden="true">
        <span class="etiquette">CZC4K7212</span>
        <span class="etiquette poste">S201-P04</span>
        <span class="etiquette">6CM2YQ481</span>
      </div>
    </section>

    <section class="formulaire">
      <form @submit.prevent="connecter">
        <h2>Connexion</h2>
        <label class="champ">
          <span>Adresse e-mail</span>
          <input v-model.trim="email" type="email" autocomplete="username" required autofocus />
        </label>
        <label class="champ">
          <span>Mot de passe</span>
          <input v-model="motDePasse" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
        <button class="btn btn-principal" type="submit" :disabled="enCours">
          {{ enCours ? 'Connexion…' : 'Se connecter' }}
        </button>

        <details v-if="comptesDemo" class="demo">
          <summary>Comptes de démonstration</summary>
          <p class="petit discret">Mot de passe commun : <strong>ParcForm#2026</strong></p>
          <ul>
            <li v-for="c in demo" :key="c.email">
              <button type="button" class="btn btn-discret btn-petit" @click="email = c.email">{{ c.email }}</button>
              <span class="discret petit">{{ c.role }}</span>
            </li>
          </ul>
        </details>
      </form>
    </section>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
}
.presentation {
  background: var(--encre);
  color: #dfe5df;
  padding: clamp(2rem, 6vw, 5rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.4rem;
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--signal);
  font-size: 1.6rem;
  font-weight: 800;
  font-variation-settings: 'wdth' 70;
}
.logo svg {
  width: 38px;
  height: 38px;
}
h1 {
  color: #fff;
  font-size: clamp(2rem, 4vw, 3.3rem);
  font-variation-settings: 'wdth' 64;
  max-width: 16ch;
}
.presentation p {
  max-width: 46ch;
  color: #b8c3bc;
  font-size: 1.07rem;
}
.etiquettes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.6rem;
}
.formulaire {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.2rem;
}
form {
  width: min(380px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
form .btn-principal {
  justify-content: center;
  min-height: 2.6rem;
}
.erreur {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-radius: var(--rayon);
  color: var(--danger);
  background: var(--danger-fond);
}
.demo {
  margin-top: 0.5rem;
  border-top: 1px solid var(--trait);
  padding-top: 0.8rem;
}
.demo summary {
  cursor: pointer;
  font-weight: 600;
}
.demo ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.demo li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

@media (max-width: 860px) {
  .page {
    grid-template-columns: 1fr;
  }
  .presentation {
    padding-block: 2.2rem;
  }
}
</style>
