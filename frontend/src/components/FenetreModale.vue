<script setup lang="ts">
import { onMounted, ref } from 'vue';

defineProps<{ titre: string; large?: boolean }>();
const emit = defineEmits<{ fermer: [] }>();

const dialogue = ref<HTMLDialogElement | null>(null);

// <dialog> natif : piège le focus, gère Échap et rend le reste de la page inerte
onMounted(() => dialogue.value?.showModal());
</script>

<template>
  <dialog ref="dialogue" class="modale" :class="{ large }" @cancel.prevent="emit('fermer')" @close="emit('fermer')">
    <header>
      <h2>{{ titre }}</h2>
      <button class="btn btn-discret" aria-label="Fermer" @click="emit('fermer')">Fermer</button>
    </header>
    <div class="corps">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.modale {
  width: min(560px, calc(100vw - 2rem));
  max-height: calc(100vh - 3rem);
  padding: 0;
  border: 1px solid var(--trait-fort);
  border-radius: var(--rayon-grand);
  background: var(--surface);
  color: var(--encre);
  box-shadow: 0 20px 50px rgba(30, 42, 38, 0.3);
}
.modale.large {
  width: min(860px, calc(100vw - 2rem));
}
.modale::backdrop {
  background: rgba(30, 42, 38, 0.45);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem 0.8rem;
  border-bottom: 1px solid var(--trait);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}
.corps {
  padding: 1.1rem 1.2rem 1.3rem;
}
</style>
