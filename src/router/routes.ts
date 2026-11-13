import type { RouteRecordRaw } from 'vue-router';
import type { RolUsuario } from '@/models/types';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresPasswordChange?: boolean;
    roles?: readonly RolUsuario[];
    // 🛡️ [FASE 2.3 - TICKETS] Contexto de bandeja para adaptar filtros por defecto
    modoBandeja?: 'recepcion' | 'cierre' | 'gerencia' | 'tecnico' | 'usuario';
  }
}

const ROLES_ADMINISTRATIVOS: readonly RolUsuario[] = ['ADMINISTRADOR', 'MESA_TECNICA'];

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/BlankLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/LoginPage.vue') },
      {
        path: 'cambiar-contrasena',
        component: () => import('@/pages/CambiarContrasenaPage.vue'),
        meta: { requiresAuth: true, requiresPasswordChange: true },
      },
    ],
  },
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/tecnico/mis-tickets',
    children: [
      // 🛡️ [FASE 2.3 - TICKETS] Rutas lazy-loaded protegidas por RBAC para bandejas y creación
      { path: '/bandeja', redirect: '/tickets/recepcion' },
      {
        path: '/tickets/nuevo',
        component: () => import('@/pages/tickets/NuevoTicketPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/tickets/recepcion',
        component: () => import('@/pages/tickets/BandejaTicketsPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ADMINISTRADOR', 'MESA_TECNICA', 'GERENTE_GENERAL'],
          modoBandeja: 'recepcion',
        },
      },
      {
        path: '/tickets/cierre',
        component: () => import('@/pages/tickets/BandejaTicketsPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['MESA_TECNICA'],
          modoBandeja: 'cierre',
        },
      },
      {
        path: '/gerencia/bandeja',
        component: () => import('@/pages/tickets/BandejaTicketsPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['GERENTE_AREA'],
          modoBandeja: 'gerencia',
        },
      },
      {
        path: '/tecnico/mis-tickets',
        component: () => import('@/pages/tickets/BandejaTicketsPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['TECNICO'],
          modoBandeja: 'tecnico',
        },
      },
      {
        path: '/usuario/mis-solicitudes',
        component: () => import('@/pages/tickets/BandejaTicketsPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['USUARIO'],
          modoBandeja: 'usuario',
        },
      },
      {
        path: '/admin/roles',
        component: () => import('@/pages/admin/RolesPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/admin/tipo-departamentos',
        component: () => import('@/pages/admin/TipoDepartamentosPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/admin/usuarios',
        component: () => import('@/pages/admin/UsuariosRolesPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/admin/departamentos',
        component: () => import('@/pages/admin/DepartamentosPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/admin/catalogo',
        alias: ['/admin/catalogo-casos'],
        component: () => import('@/pages/admin/CatalogoCasosPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
      {
        path: '/admin/sla',
        alias: ['/admin/configuracion-slas'],
        component: () => import('@/pages/admin/ConfiguracionSlasPage.vue'),
        meta: { requiresAuth: true, roles: ROLES_ADMINISTRATIVOS },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
