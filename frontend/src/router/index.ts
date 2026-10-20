import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { Droit } from '@/utils/droits';

declare module 'vue-router' {
  interface RouteMeta {
    titre?: string;
    public?: boolean;
    droit?: Droit;
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/connexion', name: 'connexion', component: () => import('@/views/ConnexionView.vue'), meta: { public: true, titre: 'Connexion' } },
  { path: '/', name: 'tableau-de-bord', component: () => import('@/views/TableauDeBordView.vue'), meta: { titre: 'Tableau de bord' } },
  { path: '/materiels', name: 'materiels', component: () => import('@/views/MaterielsView.vue'), meta: { titre: 'Matériels' } },
  { path: '/materiels/:id(\\d+)', name: 'materiel', component: () => import('@/views/MaterielDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { titre: 'Fiche matériel' } },
  { path: '/salles', name: 'salles', component: () => import('@/views/SallesView.vue'), meta: { titre: 'Salles' } },
  { path: '/salles/:id(\\d+)', name: 'salle', component: () => import('@/views/SalleDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { titre: 'Salle' } },
  { path: '/postes', name: 'postes', component: () => import('@/views/PostesView.vue'), meta: { titre: 'Postes' } },
  { path: '/postes/:id(\\d+)', name: 'poste', component: () => import('@/views/PosteDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { titre: 'Poste' } },
  { path: '/supervision', name: 'supervision', component: () => import('@/views/SupervisionView.vue'), meta: { titre: 'Supervision', droit: 'superviser' } },
  { path: '/reinstallations', name: 'reinstallations', component: () => import('@/views/ReinstallationsView.vue'), meta: { titre: 'Réinstallations' } },
  { path: '/remontees', name: 'remontees', component: () => import('@/views/RemonteesView.vue'), meta: { titre: 'Remontées' } },
  { path: '/alertes', name: 'alertes', component: () => import('@/views/AlertesView.vue'), meta: { titre: 'Alertes' } },
  { path: '/statistiques', name: 'statistiques', component: () => import('@/views/StatistiquesView.vue'), meta: { titre: 'Statistiques' } },
  { path: '/documents', name: 'documents', component: () => import('@/views/DocumentsView.vue'), meta: { titre: 'Documents', droit: 'documents' } },
  { path: '/parametrage', name: 'parametrage', component: () => import('@/views/ParametrageView.vue'), meta: { titre: 'Paramétrage' } },
  { path: '/utilisateurs', name: 'utilisateurs', component: () => import('@/views/UtilisateursView.vue'), meta: { titre: 'Utilisateurs', droit: 'gererUtilisateurs' } },
  { path: '/profil', name: 'profil', component: () => import('@/views/ProfilView.vue'), meta: { titre: 'Mon compte' } },
  { path: '/:chemin(.*)*', name: 'introuvable', component: () => import('@/views/IntrouvableView.vue'), meta: { titre: 'Page introuvable' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.restaurer();
  if (!to.meta.public && !auth.connecte) {
    return { name: 'connexion', query: to.fullPath !== '/' ? { suite: to.fullPath } : undefined };
  }
  if (to.name === 'connexion' && auth.connecte) return { name: 'tableau-de-bord' };
  if (to.meta.droit && !auth.peut(to.meta.droit)) return { name: 'tableau-de-bord' };
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.titre ? `${to.meta.titre} · ParcForm` : 'ParcForm';
});
