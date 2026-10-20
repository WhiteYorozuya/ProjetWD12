<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '@/api/client';
import type { Role, Utilisateur } from '@/api/types';
import BadgeStatut from '@/components/BadgeStatut.vue';
import FenetreModale from '@/components/FenetreModale.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { ROLES, date } from '@/utils/format';

const auth = useAuthStore();
const notifications = useNotificationsStore();

const utilisateurs = ref<Utilisateur[]>([]);
const creation = ref(false);
const reinit = ref<Utilisateur | null>(null);
const motDePasse = ref('');
const formulaire = reactive({ email: '', nom: '', prenom: '', role: 'FORMATEUR' as Role, motDePasse: '' });

async function charger() {
  try {
    utilisateurs.value = await api<Utilisateur[]>('/utilisateurs');
  } catch (e) {
    notifications.erreur(e);
  }
}
onMounted(charger);

async function creer() {
  try {
    await api('/utilisateurs', { methode: 'POST', corps: formulaire });
    notifications.succes(`Compte ${formulaire.email} créé`);
    creation.value = false;
    Object.assign(formulaire, { email: '', nom: '', prenom: '', role: 'FORMATEUR', motDePasse: '' });
    await charger();
  } catch (e) {
    notifications.erreur(e);
  }
}

async function modifier(u: Utilisateur, corps: Partial<Pick<Utilisateur, 'role' | 'actif'>>) {
  try {
    await api(`/utilisateurs/${u.id}`, { methode: 'PATCH', corps });
    notifications.succes('Compte modifié');
  } catch (e) {
    notifications.erreur(e);
  } finally {
    await charger();
  }
}

async function reinitialiser() {
  if (!reinit.value) return;
  try {
    await api(`/utilisateurs/${reinit.value.id}/mot-de-passe`, { methode: 'PUT', corps: { motDePasse: motDePasse.value } });
    notifications.succes('Mot de passe réinitialisé');
    reinit.value = null;
    motDePasse.value = '';
  } catch (e) {
    notifications.erreur(e);
  }
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Utilisateurs</h1>
        <p>Comptes et rôles. Un compte désactivé perd l'accès immédiatement.</p>
      </div>
      <button class="btn btn-principal" @click="creation = true">Créer un compte</button>
    </header>

    <div class="table-conteneur">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>E-mail</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Créé le</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in utilisateurs" :key="u.id">
            <td><strong>{{ u.nom }}</strong> {{ u.prenom }}</td>
            <td>{{ u.email }}</td>
            <td>
              <select
                :value="u.role"
                :disabled="u.id === auth.utilisateur?.id"
                :aria-label="`Rôle de ${u.prenom} ${u.nom}`"
                @change="modifier(u, { role: ($event.target as HTMLSelectElement).value as Role })"
              >
                <option v-for="(l, cle) in ROLES" :key="cle" :value="cle">{{ l }}</option>
              </select>
            </td>
            <td><BadgeStatut :ton="u.actif ? 'ok' : 'neutre'" :texte="u.actif ? 'Actif' : 'Désactivé'" /></td>
            <td>{{ date(u.createdAt) }}</td>
            <td class="num">
              <button class="btn btn-petit btn-discret" @click="reinit = u">Réinitialiser le mot de passe</button>
              <button v-if="u.id !== auth.utilisateur?.id" class="btn btn-petit btn-discret" @click="modifier(u, { actif: !u.actif })">
                {{ u.actif ? 'Désactiver' : 'Réactiver' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FenetreModale v-if="creation" titre="Créer un compte" @fermer="creation = false">
      <form @submit.prevent="creer">
        <div class="grille-form">
          <label class="champ"><span>Nom</span><input v-model.trim="formulaire.nom" required maxlength="80" /></label>
          <label class="champ"><span>Prénom</span><input v-model.trim="formulaire.prenom" required maxlength="80" /></label>
          <label class="champ"><span>E-mail</span><input v-model.trim="formulaire.email" type="email" required /></label>
          <label class="champ">
            <span>Rôle</span>
            <select v-model="formulaire.role">
              <option v-for="(l, cle) in ROLES" :key="cle" :value="cle">{{ l }}</option>
            </select>
          </label>
        </div>
        <label class="champ espace">
          <span>Mot de passe provisoire</span>
          <input v-model="formulaire.motDePasse" type="password" required minlength="12" autocomplete="new-password" />
          <small>12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small>
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="creation = false">Annuler</button>
          <button type="submit" class="btn btn-principal">Créer le compte</button>
        </div>
      </form>
    </FenetreModale>

    <FenetreModale v-if="reinit" :titre="`Mot de passe de ${reinit.prenom} ${reinit.nom}`" @fermer="reinit = null">
      <form @submit.prevent="reinitialiser">
        <label class="champ">
          <span>Nouveau mot de passe</span>
          <input v-model="motDePasse" type="password" required minlength="12" autocomplete="new-password" />
          <small>12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small>
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="reinit = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Réinitialiser</button>
        </div>
      </form>
    </FenetreModale>
  </div>
</template>

<style scoped>
.espace {
  margin-top: 0.9rem;
}
td select {
  min-width: 190px;
}
</style>
