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
    redirect: '/dashboard',
    children: [
      // 🛡️ [FASE 3 - DASHBOARD OPERATIVO] Vista principal adaptativa por rol
      {
        path: '/dashboard',
        alias: ['/dashboard/ejecutivo', '/gerencia/metricas', '/tickets/carga-tecnica'],
        component: () => import('@/pages/tickets/DashboardOperativoPage.vue'),
        meta: {
          requiresAuth: true,
          roles: [
            'ADMINISTRADOR',
            'MESA_TECNICA',
            'DIRECTOR',
            'GERENTE_AREA',
            'TECNICO',
          ],
        },
      },
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
          roles: ['ADMINISTRADOR', 'MESA_TECNICA', 'DIRECTOR'],
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
      // 🛡️ [FASE 3.5 - VISTAS] Balanceo de Cargas para Gerente de Área
      {
        path: '/gerencia/asignacion',
        component: () => import('@/pages/tickets/BalanceoCargasPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['GERENTE_AREA'],
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
      // 🛡️ [FASE 3.5 - VISTAS] Base de Soluciones (sin PII) para Técnico y roles supervisores
      {
        path: '/tecnico/historial',
        component: () => import('@/pages/tickets/BaseSolucionesPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['TECNICO', 'GERENTE_AREA', 'MESA_TECNICA', 'DIRECTOR', 'ADMINISTRADOR'],
        },
      },
      // 🛡️ [FASE 3.5 - VISTAS] Reportes y SLAs con motor SQL de relojes reales
      {
        path: '/dashboard/reportes',
        component: () => import('@/pages/tickets/ReportesSlaPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['DIRECTOR', 'ADMINISTRADOR', 'MESA_TECNICA'],
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
      {
        path: '/admin/configuraciones',
        component: () => import('@/pages/admin/ConfiguracionesPage.vue'),
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
