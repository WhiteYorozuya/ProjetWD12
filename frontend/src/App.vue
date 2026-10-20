<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import NotificationsPile from '@/components/NotificationsPile.vue';

const route = useRoute();
</script>

<template>
  <!-- Rien n'est rendu avant la résolution de la première route (évite d'appeler l'API sans session) -->
  <template v-if="!route.matched.length" />
  <RouterView v-else-if="route.meta.public" />
  <AppLayout v-else>
    <RouterView :key="route.path" />
  </AppLayout>
  <NotificationsPile />
</template>
