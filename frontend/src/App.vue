<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import NotificationsPile from '@/components/NotificationsPile.vue';

const route = useRoute();
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <AppLayout v-else>
    <RouterView :key="route.path" />
  </AppLayout>
  <NotificationsPile />
</template>
