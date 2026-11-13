import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { rutaInicioPorRol } from '@/composables/useAuth';
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

  // Guardia Global de Navegación (Autenticación HttpOnly + Encapsulamiento is_new_user + RBAC por rol)
  Router.beforeEach(async (to) => {
    const auth = useAuthStore(store);

    // 0. Hidratar sesión desde el backend (GET /auth/me) en la carga inicial o al recargar (F5)
    if (!auth.hidratado) {
      await auth.hidratarSesion();
    }

    const requiereAuth = to.matched.some((record) => record.meta.requiresAuth);
    const esRutaCambioClave = to.matched.some((record) => record.meta.requiresPasswordChange);

    // 1. Si no está autenticado e intenta acceder a una ruta privada → redirigir al Login
    if (requiereAuth && !auth.isAuthenticated) {
      return '/';
    }

    // 2. Regla de negocio `is_new_user === true`: encapsulamiento forzoso en /cambiar-contrasena
    if (auth.isAuthenticated && auth.requiereCambioContrasena) {
      if (!esRutaCambioClave) {
        return '/cambiar-contrasena';
      }
      return true;
    }

    // 3. Si ya está autenticado (con `is_new_user === false`) e intenta ir al Login o a cambiar contraseña → panel por rol
    if (auth.isAuthenticated && (to.path === '/' || esRutaCambioClave)) {
      return rutaInicioPorRol(auth.rolActual);
    }

    // 4. Control de Acceso Basado en Roles (RBAC): bloquear navegación manual por URL sin permisos
    const rolesPermitidos = to.meta.roles;
    if (
      auth.isAuthenticated &&
      rolesPermitidos &&
      rolesPermitidos.length > 0 &&
      !rolesPermitidos.includes(auth.rolActual)
    ) {
      return rutaInicioPorRol(auth.rolActual);
    }

    return true;
  });

  return Router;
});
