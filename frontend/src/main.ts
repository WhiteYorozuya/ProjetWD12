import '@fontsource-variable/archivo/wdth.css';
import './assets/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { quandSessionExpiree } from './api/client';
import { router } from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Session expirée : retour à l'écran de connexion
quandSessionExpiree(() => {
  useAuthStore().deconnecter();
  void router.push({ name: 'connexion', query: { expiree: '1' } });
});

app.mount('#app');
