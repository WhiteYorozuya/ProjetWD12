<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ libelle: string; valeur: number | null }>();

const ton = computed(() => {
  const v = props.valeur ?? 0;
  if (v >= 90) return 'danger';
  if (v >= 70) return 'attention';
  return 'ok';
});
</script>

<template>
  <div class="jauge" :class="ton">
    <span class="libelle">{{ libelle }}</span>
    <span
      class="piste"
      role="meter"
      :aria-label="libelle"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="valeur ?? undefined"
    >
      <span class="niveau" :style="{ width: `${Math.min(100, valeur ?? 0)}%` }" />
    </span>
    <span class="valeur">{{ valeur === null ? '—' : `${Math.round(valeur)} %` }}</span>
  </div>
</template>

<style scoped>
.jauge {
  display: grid;
  grid-template-columns: 2.4rem 1fr 3rem;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
}
.libelle {
  color: var(--encre-douce);
}
.piste {
  height: 6px;
  border-radius: 3px;
  background: var(--neutre-fond);
  overflow: hidden;
}
.niveau {
  display: block;
  height: 100%;
  background: var(--ok);
  transition: width 0.4s ease;
}
.attention .niveau {
  background: var(--attention);
}
.danger .niveau {
  background: var(--danger);
}
.valeur {
  text-align: right;
}
</style>
