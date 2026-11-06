import { defineStore } from 'pinia';
import type { AreaDestino, EstadoTicket, Ticket } from '@/models/types';

/** Estados que forman parte de la cola activa de un técnico. */
const ESTADOS_ACTIVOS: readonly EstadoTicket[] = [
  'Asignado',
  'En Progreso',
  'En Espera',
  'Reabierto',
];

interface TicketState {
  tickets: Ticket[];
}

const MOCK_TICKETS: readonly Ticket[] = [
  {
    id: '1',
    folio: 'TCK-0001',
    solicitante: 'María González',
    departamento: 'Contabilidad',
    areaDestino: 'Soporte Técnico',
    tipoTrabajo: 'Incidencia',
    prioridad: 'Crítica',
    estado: 'En Progreso',
    fechaCreacion: '2026-11-05T08:15:00-04:00',
    tecnicoAsignado: 'tec-01',
  },
  {
    id: '2',
    folio: 'TCK-0002',
    solicitante: 'Carlos Pérez',
    departamento: 'Ventas',
    areaDestino: 'Redes',
    tipoTrabajo: 'Requerimiento de Servicio',
    prioridad: 'Media',
    estado: 'En Espera',
    fechaCreacion: '2026-11-04T10:40:00-04:00',
    motivoPausa: 'Esperando repuesto/compra',
    tecnicoAsignado: 'tec-01',
  },
  {
    id: '3',
    folio: 'TCK-0003',
    solicitante: 'Luisa Fernández',
    departamento: 'Recursos Humanos',
    areaDestino: 'Aplicaciones',
    tipoTrabajo: 'Incidencia',
    prioridad: 'Alta',
    estado: 'Resuelto - Por Verificar',
    fechaCreacion: '2026-11-03T14:05:00-04:00',
    tecnicoAsignado: 'tec-01',
  },
  {
    id: '4',
    folio: 'TCK-0004',
    solicitante: 'Jorge Ramírez',
    departamento: 'Almacén',
    areaDestino: 'Soporte Técnico',
    tipoTrabajo: 'Actividad Interna',
    prioridad: 'Baja',
    estado: 'Asignado',
    fechaCreacion: '2026-11-05T09:30:00-04:00',
    tecnicoAsignado: 'tec-01',
  },
];

export const useTicketStore = defineStore('ticket', {
  state: (): TicketState => ({
    tickets: [],
  }),

  getters: {
    ticketsPorArea: (state) => (area: AreaDestino) =>
      state.tickets.filter((t) => t.areaDestino === area),

    ticketsDelTecnico: (state) => (tecnicoId: string) =>
      state.tickets.filter(
        (t) => t.tecnicoAsignado === tecnicoId && ESTADOS_ACTIVOS.includes(t.estado),
      ),
  },

  actions: {
    /** Carga inicial de tickets. */
    async cargarTickets(): Promise<void> {
      // TODO: Integrar endpoint GET /api/v1/tickets para consultar tickets según el rol en sesión
      // const { data } = await api.get<Ticket[]>('/tickets');
      // this.tickets = data;

      this.tickets = await Promise.resolve(MOCK_TICKETS.map((t) => ({ ...t })));
    },

    limpiarTickets(): void {
      this.tickets = [];
    },
  },
});
