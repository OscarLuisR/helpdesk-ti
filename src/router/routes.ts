import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/BlankLayout.vue'),
    children: [{ path: '', component: () => import('@/pages/LoginPage.vue') }],
  },
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/tecnico/mis-tickets',
    children: [
      { path: '/bandeja', redirect: '/tecnico/mis-tickets' },
      { path: '/tecnico/mis-tickets', component: () => import('@/pages/BandejaTecnico.vue') },
      { path: '/admin/usuarios', component: () => import('@/pages/admin/UsuariosRolesPage.vue') },
      {
        path: '/admin/departamentos',
        component: () => import('@/pages/admin/DepartamentosPage.vue'),
      },
      {
        path: '/admin/catalogo',
        alias: ['/admin/catalogo-casos'],
        component: () => import('@/pages/admin/CatalogoCasosPage.vue'),
      },
      {
        path: '/admin/sla',
        alias: ['/admin/configuracion-slas'],
        component: () => import('@/pages/admin/ConfiguracionSlasPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
