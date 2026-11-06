import { computed, onMounted, ref } from 'vue';
import type { EstadoTicket, Prioridad, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

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

export function useTickets() {
  const authStore = useAuthStore();
  const ticketStore = useTicketStore();

  const busqueda = ref('');
  const estadosFiltro = ref<EstadoTicket[]>([]);

  onMounted(() => {
    if (!ticketStore.tickets.length) {
      void ticketStore.cargarTickets();
    }
  });

  /** Filtra los tickets según la visibilidad permitida al rol en sesión. */
  const ticketsVisibles = computed<Ticket[]>(() => {
    const sesion = authStore.usuario;
    if (!sesion) return [];

    if (authStore.role === 'TECNICO') {
      return ticketStore.tickets.filter((t) => t.tecnicoAsignado === sesion.id);
    }
    if (authStore.role === 'GERENTE_AREA' && sesion.area) {
      return ticketStore.tickets.filter((t) => t.areaDestino === sesion.area);
    }
    // MESA_TECNICA y GERENTE_GENERAL tienen vista global 360°
    return ticketStore.tickets;
  });

  const ticketsFiltrados = computed<Ticket[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return ticketsVisibles.value.filter((t) => {
      const coincideEstado =
        !estadosFiltro.value.length || estadosFiltro.value.includes(t.estado);
      const coincideTexto =
        !q ||
        [t.folio, t.solicitante, t.departamento, t.tipoTrabajo, t.prioridad, t.estado].some((v) =>
          v.toLowerCase().includes(q),
        );
      return coincideEstado && coincideTexto;
    });
  });

  function limpiarFiltros(): void {
    estadosFiltro.value = [];
  }

  return {
    busqueda,
    estadosFiltro,
    estadosDisponibles: ESTADOS_DISPONIBLES,
    ticketsVisibles,
    ticketsFiltrados,
    limpiarFiltros,
  };
}
