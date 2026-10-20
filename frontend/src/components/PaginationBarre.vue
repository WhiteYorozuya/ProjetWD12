<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ page: number; taille: number; total: number }>();
const emit = defineEmits<{ changer: [page: number] }>();

const nbPages = computed(() => Math.max(1, Math.ceil(props.total / props.taille)));
const debut = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.taille + 1));
const fin = computed(() => Math.min(props.total, props.page * props.taille));
</script>

<template>
  <nav class="pagination" aria-label="Pagination">
    <span class="discret">{{ debut }}–{{ fin }} sur {{ total }}</span>
    <div>
      <button class="btn btn-petit" :disabled="page <= 1" @click="emit('changer', page - 1)">Précédent</button>
      <span class="numero">Page {{ page }} / {{ nbPages }}</span>
      <button class="btn btn-petit" :disabled="page >= nbPages" @click="emit('changer', page + 1)">Suivant</button>
    </div>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.8rem;
}
.pagination div {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.numero {
  font-size: 0.9rem;
}
</style>
