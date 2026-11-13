import { computed, onMounted, ref, watch, type Ref } from 'vue';
import type { EstadoTicket, Prioridad, RolUsuario, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { ESTADOS_ACTIVOS_TECNICO, useTicketStore } from '@/stores/ticketStore';

// 🛡️ [FASE 2.3 - TICKETS] Composable de bandeja adaptado a roles y datos reales del backend

export const ESTADOS_DISPONIBLES: readonly EstadoTicket[] = [
  'Abierto',
  'Asignado',
  'En Progreso',
  'En Espera',
  'Resuelto - Por Verificar',
  'Cerrado',
  'Reabierto',
];

export const PRIORIDAD_CLASS: Record<Prioridad, string> = {
  Crítica: 'bad',
  Alta: 'warn',
  Media: 'info',
  Baja: 'neutral',
};

export function claseChipPrioridad(prioridad: string): string {
  const normalizada = prioridad.trim().toLowerCase();
  if (normalizada.includes('crít') || normalizada.includes('crit')) return 'bad';
  if (normalizada.includes('alta')) return 'warn';
  if (normalizada.includes('media')) return 'info';
  return 'neutral';
}

export const ESTADO_CLASS: Record<EstadoTicket, string> = {
  Abierto: 'neutral',
  Asignado: 'info',
  'En Progreso': 'brand',
  'En Espera': 'warn',
  'Resuelto - Por Verificar': 'ok',
  Cerrado: 'neutral',
  Reabierto: 'bad',
};

const AVATAR_COLORES = [
  { bg: 'rgba(15, 118, 110, 0.14)', fg: '#0f766e' },
  { bg: 'rgba(30, 58, 95, 0.14)', fg: '#1e3a5f' },
  { bg: 'rgba(245, 158, 11, 0.18)', fg: '#b45309' },
  { bg: 'rgba(2, 132, 199, 0.14)', fg: '#0284c7' },
  { bg: 'rgba(22, 163, 74, 0.14)', fg: '#16a34a' },
  { bg: 'rgba(100, 116, 139, 0.16)', fg: '#475569' },
];

export function inicialesSolicitante(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function avatarSolicitanteStyle(nombre: string): { backgroundColor: string; color: string } {
  let hash = 0;
  for (const ch of nombre) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR_COLORES[hash % AVATAR_COLORES.length]!;
  return { backgroundColor: color.bg, color: color.fg };
}

/**
 * Determina el filtro de estados inicial según el rol en sesión y el modo de bandeja.
 */
function estadosPorDefectoSegunRol(rol: RolUsuario, modoRuta?: string): EstadoTicket[] {
  if (modoRuta === 'cierre') {
    return ['Resuelto - Por Verificar'];
  }
  if (rol === 'TECNICO') {
    return [...ESTADOS_ACTIVOS_TECNICO];
  }
  if (rol === 'GERENTE_AREA') {
    return ['Abierto', 'Asignado', 'Reabierto'];
  }
  return [];
}

export function useTickets(modoRuta?: Ref<string | undefined>) {
  const authStore = useAuthStore();
  const ticketStore = useTicketStore();

  const busqueda = ref('');
  const estadosFiltro = ref<EstadoTicket[]>(
    estadosPorDefectoSegunRol(authStore.role, modoRuta?.value),
  );

  function aplicarFiltroPorDefecto(): void {
    estadosFiltro.value = estadosPorDefectoSegunRol(authStore.role, modoRuta?.value);
  }

  watch(
    () => [authStore.role, modoRuta?.value] as const,
    () => {
      aplicarFiltroPorDefecto();
    },
  );

  async function recargarTickets(): Promise<void> {
    await ticketStore.cargarTickets();
  }

  onMounted(() => {
    void recargarTickets();
  });

  /** El backend aplica el scoping RBAC real; aquí se mantiene una capa de coherencia visual. */
  const ticketsVisibles = computed<Ticket[]>(() => ticketStore.tickets);

  const ticketsFiltrados = computed<Ticket[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return ticketsVisibles.value.filter((t) => {
      const coincideEstado =
        !estadosFiltro.value.length || estadosFiltro.value.includes(t.estado);
      const coincideTexto =
        !q ||
        [
          t.folio,
          t.solicitante,
          t.departamento_solicitante,
          t.catalogo_incidencia,
          t.departamento,
          t.prioridad,
          t.estado,
          t.tecnico ?? '',
        ].some((v) => v.toLowerCase().includes(q));
      return coincideEstado && coincideTexto;
    });
  });

  function limpiarFiltros(): void {
    busqueda.value = '';
    estadosFiltro.value = [];
  }

  return {
    busqueda,
    estadosFiltro,
    estadosDisponibles: ESTADOS_DISPONIBLES,
    ticketsVisibles,
    ticketsFiltrados,
    cargando: computed(() => ticketStore.cargando),
    errorCarga: computed(() => ticketStore.errorCarga),
    limpiarFiltros,
    aplicarFiltroPorDefecto,
    recargarTickets,
  };
}
