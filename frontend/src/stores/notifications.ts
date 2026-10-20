import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ErreurApi } from '@/api/client';

export interface Notification {
  id: number;
  type: 'succes' | 'erreur';
  message: string;
}

let prochainId = 1;

export const useNotificationsStore = defineStore('notifications', () => {
  const liste = ref<Notification[]>([]);

  function ajouter(type: Notification['type'], message: string) {
    const id = prochainId++;
    liste.value.push({ id, type, message });
    setTimeout(() => retirer(id), type === 'erreur' ? 7000 : 3500);
  }

  function retirer(id: number) {
    liste.value = liste.value.filter((n) => n.id !== id);
  }

  const succes = (message: string) => ajouter('succes', message);
  const erreur = (e: unknown) =>
    ajouter('erreur', e instanceof ErreurApi || e instanceof Error ? e.message : String(e));

  return { liste, succes, erreur, retirer };
});
