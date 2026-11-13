import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { OPCIONES_ROL_SIMULADOR } from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';

export interface MenuItem {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
  seccion?: string;
}

/** Opciones maestras compartidas entre ADMINISTRADOR y MESA_TECNICA (en el orden de los módulos). */
export const OPCIONES_ADMINISTRATIVAS: readonly MenuItem[] = [
  {
    id: 'admin-roles',
    titulo: 'Roles',
    icono: 'admin_panel_settings',
    ruta: '/admin/roles',
    seccion: 'Administración',
  },
  {
    id: 'admin-tipo-departamentos',
    titulo: 'Tipo Departamentos',
    icono: 'account_tree',
    ruta: '/admin/tipo-departamentos',
  },
  {
    id: 'admin-departamentos',
    titulo: 'Departamentos',
    icono: 'apartment',
    ruta: '/admin/departamentos',
  },
  {
    id: 'admin-usuarios',
    titulo: 'Usuarios',
    icono: 'manage_accounts',
    ruta: '/admin/usuarios',
  },
  {
    id: 'admin-sla',
    titulo: 'Prioridades (SLA)',
    icono: 'timer',
    ruta: '/admin/sla',
  },
  {
    id: 'admin-catalogo',
    titulo: 'Catálogo de Incidencias',
    icono: 'category',
    ruta: '/admin/catalogo',
  },
];

/** Mapa estricto de opciones del menú lateral según los 6 roles del sistema. */
export const MENU_POR_ROL: Record<RolUsuario, readonly MenuItem[]> = {
  USUARIO: [
    {
      id: 'usuario-solicitudes',
      titulo: 'Mis Solicitudes / Validación',
      icono: 'fact_check',
      ruta: '/usuario/mis-solicitudes',
    },
  ],

  MESA_TECNICA: [
    {
      id: 'tickets-nuevo',
      titulo: 'Nuevo Ticket',
      icono: 'add_box',
      ruta: '/tickets/nuevo',
      seccion: 'Operación Mesa',
    },
    {
      id: 'tickets-recepcion',
      titulo: 'Recepción Global',
      icono: 'inbox',
      ruta: '/tickets/recepcion',
    },
    {
      id: 'tickets-cierre',
      titulo: 'Verificación y Cierre',
      icono: 'task_alt',
      ruta: '/tickets/cierre',
    },
    {
      id: 'tickets-carga',
      titulo: 'Carga Técnica',
      icono: 'engineering',
      ruta: '/tickets/carga-tecnica',
    },
    ...OPCIONES_ADMINISTRATIVAS,
  ],

  GERENTE_AREA: [
    {
      id: 'gerencia-bandeja',
      titulo: 'Bandeja de Área',
      icono: 'folder_open',
      ruta: '/gerencia/bandeja',
    },
    {
      id: 'gerencia-asignacion',
      titulo: 'Balanceo de Cargas',
      icono: 'balance',
      ruta: '/gerencia/asignacion',
    },
    {
      id: 'gerencia-metricas',
      titulo: 'Mis Indicadores',
      icono: 'analytics',
      ruta: '/gerencia/metricas',
    },
  ],

  TECNICO: [
    {
      id: 'tecnico-cola',
      titulo: 'Mi Cola de Trabajo',
      icono: 'assignment',
      ruta: '/tecnico/mis-tickets',
    },
    {
      id: 'tecnico-historial',
      titulo: 'Base de Soluciones',
      icono: 'menu_book',
      ruta: '/tecnico/historial',
    },
  ],

  GERENTE_GENERAL: [
    {
      id: 'dashboard-ejecutivo',
      titulo: 'Tablero Ejecutivo 360',
      icono: 'insert_chart_outlined',
      ruta: '/dashboard/ejecutivo',
    },
    {
      id: 'dashboard-reportes',
      titulo: 'Reportes y SLAs',
      icono: 'pie_chart_outline',
      ruta: '/dashboard/reportes',
    },
  ],

  // 🛡️ [FASE 2.3 - TICKETS] Administrador también tiene acceso directo a creación y recepción de tickets
  ADMINISTRADOR: [
    {
      id: 'admin-tickets-nuevo',
      titulo: 'Nuevo Ticket',
      icono: 'add_box',
      ruta: '/tickets/nuevo',
      seccion: 'Operación Tickets',
    },
    {
      id: 'admin-tickets-recepcion',
      titulo: 'Recepción Global',
      icono: 'inbox',
      ruta: '/tickets/recepcion',
    },
    ...OPCIONES_ADMINISTRATIVAS,
  ],
};

export function useNavigation() {
  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const $q = useQuasar();

  const itemsMenu = computed<readonly MenuItem[]>(() => {
    return MENU_POR_ROL[authStore.role] ?? [];
  });

  const rutaActiva = ref<string>(route.path);

  watch(
    () => route.path,
    (nuevaRuta) => {
      rutaActiva.value = nuevaRuta;
    },
  );

  function rutaRegistradaEnRouter(ruta: string): boolean {
    const resuelta = router.resolve(ruta);
    return resuelta.matched.some((record) => record.path !== '/:catchAll(.*)*');
  }

  watch(
    () => authStore.role,
    (nuevoRol) => {
      const opciones = MENU_POR_ROL[nuevoRol] ?? [];
      const primeraExistente = opciones.find((op) => rutaRegistradaEnRouter(op.ruta));
      const destino = primeraExistente ?? opciones[0];
      if (!destino) return;

      rutaActiva.value = destino.ruta;
      if (rutaRegistradaEnRouter(destino.ruta) && route.path !== destino.ruta) {
        void router.push(destino.ruta);
      }
    },
  );

  const inicialesUsuario = computed(() => {
    const nombre = authStore.usuario?.nombre ?? 'TI';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  });

  const etiquetaRolActual = computed(
    () =>
      OPCIONES_ROL_SIMULADOR.find((op) => op.valor === authStore.role)?.etiqueta ??
      authStore.role,
  );

  function esRutaActiva(ruta: string): boolean {
    return rutaActiva.value === ruta || route.path === ruta;
  }

  async function irARuta(item: MenuItem): Promise<void> {
    rutaActiva.value = item.ruta;

    if (!rutaRegistradaEnRouter(item.ruta)) {
      $q.notify({
        type: 'info',
        message: `Vista "${item.titulo}" (${item.ruta}) pendiente por construir.`,
        position: 'top-right',
        timeout: 2200,
      });
      return;
    }

    if (route.path !== item.ruta) {
      await router.push(item.ruta);
    }
  }

  // TODO: Eliminar este manejador del simulador de rol antes de pasar a producción
  function cambiarRolSimulado(nuevoRol: RolUsuario): void {
    authStore.cambiarRolDesarrollo(nuevoRol);
  }

  return {
    authStore,
    itemsMenu,
    inicialesUsuario,
    etiquetaRolActual,
    esRutaActiva,
    irARuta,
    cambiarRolSimulado,
  };
}

