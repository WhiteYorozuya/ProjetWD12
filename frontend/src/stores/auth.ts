import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, jeton } from '@/api/client';
import type { Utilisateur } from '@/api/types';
import { aLeDroit, type Droit } from '@/utils/droits';

export const useAuthStore = defineStore('auth', () => {
  const utilisateur = ref<Utilisateur | null>(null);
  const pret = ref(false);

  const connecte = computed(() => utilisateur.value !== null);
  const peut = (droit: Droit) => aLeDroit(utilisateur.value?.role, droit);

  async function connecter(email: string, motDePasse: string) {
    const reponse = await api<{ jeton: string; utilisateur: Utilisateur }>('/auth/login', {
      methode: 'POST',
      corps: { email, motDePasse },
    });
    jeton.ecrire(reponse.jeton);
    utilisateur.value = reponse.utilisateur;
  }

  /** Restaure la session au rechargement de la page. */
  async function restaurer() {
    if (pret.value) return;
    if (jeton.lire()) {
      try {
        utilisateur.value = await api<Utilisateur>('/auth/moi');
      } catch {
        jeton.ecrire(null);
      }
    }
    pret.value = true;
  }

  function deconnecter() {
    jeton.ecrire(null);
    utilisateur.value = null;
  }

  return { utilisateur, pret, connecte, peut, connecter, restaurer, deconnecter };
});
