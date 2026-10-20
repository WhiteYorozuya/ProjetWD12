import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import type { Salle, TypeMateriel } from '@/api/types';

/** Données de référence partagées par plusieurs écrans (salles, types de matériel). */
export const useReferentielStore = defineStore('referentiel', () => {
  const salles = ref<Salle[]>([]);
  const types = ref<TypeMateriel[]>([]);
  let charge = false;

  async function charger(forcer = false) {
    if (charge && !forcer) return;
    const [s, t] = await Promise.all([api<Salle[]>('/salles'), api<TypeMateriel[]>('/types-materiel')]);
    salles.value = s;
    types.value = t;
    charge = true;
  }

  const salle = (id: number | null | undefined) => salles.value.find((s) => s.id === id);

  return { salles, types, charger, salle };
});
