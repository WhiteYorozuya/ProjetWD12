<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ hostname: string; jeton: string }>();
const copie = ref(false);

async function copier(jeton: string) {
  try {
    await navigator.clipboard.writeText(jeton);
    copie.value = true;
  } catch {
    /* presse-papiers indisponible (contexte non sécurisé) : l'utilisateur sélectionne le texte */
  }
}
</script>

<template>
  <div>
    <p>
      Voici le jeton de l'agent du poste <strong>{{ hostname }}</strong>. Copiez-le dans la configuration de l'agent :
      <strong>il ne sera plus jamais affiché</strong>. En cas de perte, régénérez-en un nouveau.
    </p>
    <code class="jeton">{{ jeton }}</code>
    <div class="actions">
      <button class="btn btn-principal" @click="copier(jeton)">{{ copie ? 'Copié' : 'Copier le jeton' }}</button>
    </div>
  </div>
</template>

<style scoped>
.jeton {
  display: block;
  padding: 0.7rem 0.9rem;
  border-radius: var(--rayon);
  background: var(--encre);
  color: var(--signal);
  word-break: break-all;
  font-size: 0.95rem;
}
</style>
