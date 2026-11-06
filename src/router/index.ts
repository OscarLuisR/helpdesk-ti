import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { useAuthStore } from '@/stores/authStore';

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  // Navigation Guard: rutas protegidas requieren sesión activa en authStore.
  Router.beforeEach((to) => {
    const auth = useAuthStore(store);
    if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isAuthenticated) {
      return '/';
    }
    if (to.path === '/' && auth.isAuthenticated) {
      return '/bandeja';
    }
    return true;
  });

  return Router;
});
