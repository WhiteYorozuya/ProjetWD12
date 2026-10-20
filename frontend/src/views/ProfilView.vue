<script setup lang="ts">
import { reactive } from 'vue';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { ROLES } from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const f = reactive({ ancien: '', nouveau: '', confirmation: '' });

async function changer() {
  if (f.nouveau !== f.confirmation) {
    notifications.erreur(new Error('La confirmation ne correspond pas au nouveau mot de passe'));
    return;
  }
  try {
    await api('/auth/mot-de-passe', { methode: 'POST', corps: { ancien: f.ancien, nouveau: f.nouveau } });
    notifications.succes('Mot de passe changé');
    Object.assign(f, { ancien: '', nouveau: '', confirmation: '' });
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div v-if="auth.utilisateur" class="profil">
    <header class="entete-page">
      <div>
        <h1>{{ auth.utilisateur.prenom }} {{ auth.utilisateur.nom }}</h1>
        <p>{{ ROLES[auth.utilisateur.role] }}, {{ auth.utilisateur.email }}</p>
      </div>
    </header>

    <section class="bloc">
      <h2>Changer mon mot de passe</h2>
      <form @submit.prevent="changer">
        <label class="champ">
          <span>Mot de passe actuel</span>
          <input v-model="f.ancien" type="password" required autocomplete="current-password" />
        </label>
        <label class="champ">
          <span>Nouveau mot de passe</span>
          <input v-model="f.nouveau" type="password" required minlength="12" autocomplete="new-password" />
          <small>12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small>
        </label>
        <label class="champ">
          <span>Confirmation</span>
          <input v-model="f.confirmation" type="password" required minlength="12" autocomplete="new-password" />
        </label>
        <div class="actions">
          <button type="submit" class="btn btn-principal">Changer le mot de passe</button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.profil {
  max-width: 560px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.8rem;
}
</style>
