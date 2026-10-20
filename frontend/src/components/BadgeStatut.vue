<script setup lang="ts">
import type { Ton } from '@/utils/format';

defineProps<{ ton: Ton; texte: string }>();
</script>

<template>
  <span class="badge" :class="ton">{{ texte }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
}
.ok {
  color: var(--ok);
  background: var(--ok-fond);
}
.info {
  color: var(--info);
  background: var(--info-fond);
}
.attention {
  color: var(--attention);
  background: var(--attention-fond);
}
.danger {
  color: var(--danger);
  background: var(--danger-fond);
}
.neutre {
  color: var(--neutre);
  background: var(--neutre-fond);
}
</style>
