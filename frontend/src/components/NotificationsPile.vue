<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';

const notifications = useNotificationsStore();
</script>

<template>
  <div class="pile" role="status" aria-live="polite">
    <div v-for="n in notifications.liste" :key="n.id" class="notif" :class="n.type">
      <span>{{ n.message }}</span>
      <button class="fermer" aria-label="Fermer" @click="notifications.retirer(n.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.pile {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 200;
  max-width: min(420px, calc(100vw - 2rem));
}
.notif {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.7rem 0.9rem;
  border-radius: var(--rayon);
  background: var(--encre);
  color: #fff;
  border-left: 4px solid var(--ok);
  box-shadow: 0 6px 20px rgba(30, 42, 38, 0.25);
  animation: entree 0.18s ease-out;
}
.notif.erreur {
  border-left-color: var(--danger);
}
.fermer {
  background: none;
  border: 0;
  color: inherit;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}
@keyframes entree {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
}
</style>
