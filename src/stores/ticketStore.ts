import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import type {
  CreateTicketComentarioPayload,
  CreateTicketPayload,
  CreateTicketResult,
  EstadoTicket,
  PatchTicketEstadoPayload,
  PatchTicketEstadoResult,
  TecnicoDisponible,
  Ticket,
  TicketAdjuntoItem,
  TicketBitacoraItem,
  TicketComentarioItem,
  TicketFiltrosQuery,
} from '@/models/types';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

// 🛡️ [FASE 2.3 - TICKETS] Store Pinia conectado con el backend real (/api/tickets)

/** Estados que forman parte de la cola activa de un técnico. */
export const ESTADOS_ACTIVOS_TECNICO: readonly EstadoTicket[] = [
  'Asignado',
  'En Progreso',
  'En Espera',
  'Reabierto',
];

interface TicketState {
  tickets: Ticket[];
  tecnicosDisponibles: TecnicoDisponible[];
  cargando: boolean;
  guardando: boolean;
  errorCarga: string | null;
}

export const useTicketStore = defineStore('ticket', {
  state: (): TicketState => ({
    tickets: [],
    tecnicosDisponibles: [],
    cargando: false,
    guardando: false,
    errorCarga: null,
  }),

  getters: {
    ticketsPorDepartamentoTi: (state) => (idDepartamentoTi: number) =>
      state.tickets.filter((t) => t.id_departamento === idDepartamentoTi),

    ticketsDelTecnico: (state) => (tecnicoId: number) =>
      state.tickets.filter(
        (t) => t.id_tecnico === tecnicoId && ESTADOS_ACTIVOS_TECNICO.includes(t.estado),
      ),
  },

  actions: {
    /** Carga tickets desde GET /api/tickets aplicando los filtros opcionales enviados. */
    async cargarTickets(filtros: TicketFiltrosQuery = {}): Promise<Ticket[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const params = Object.fromEntries(
          Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
        );
        const { data: respuesta } = await api.get<RespuestaApi<Ticket[]>>('/tickets', {
          params,
        });
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        this.tickets = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(err, 'No fue posible cargar los tickets.');
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    /** Registra un nuevo ticket en POST /api/tickets (retorna id, folio y estado inicial). */
    async crearTicket(payload: CreateTicketPayload): Promise<CreateTicketResult> {
      this.guardando = true;
      try {
        const { data: respuesta } = await api.post<RespuestaApi<CreateTicketResult>>(
          '/tickets',
          payload,
        );
        return respuesta.data;
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible registrar el ticket.'), {
          cause: err,
        });
      } finally {
        this.guardando = false;
      }
    },

    /** Ejecuta una transición de estado / asignación en PATCH /api/tickets/:id/estado y recarga la lista. */
    async cambiarEstadoTicket(
      idTicket: number,
      payload: PatchTicketEstadoPayload,
    ): Promise<PatchTicketEstadoResult> {
      this.guardando = true;
      try {
        const { data: respuesta } = await api.patch<RespuestaApi<PatchTicketEstadoResult>>(
          `/tickets/${idTicket}/estado`,
          payload,
        );
        await this.cargarTickets();
        return respuesta.data;
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible actualizar el estado del ticket.'),
          { cause: err },
        );
      } finally {
        this.guardando = false;
      }
    },

    /** Consulta la bitácora cronológica de auditoría en GET /api/tickets/:id/bitacora. */
    async cargarBitacora(idTicket: number): Promise<TicketBitacoraItem[]> {
      try {
        const { data: respuesta } = await api.get<RespuestaApi<TicketBitacoraItem[]>>(
          `/tickets/${idTicket}/bitacora`,
        );
        return Array.isArray(respuesta.data) ? respuesta.data : [];
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible consultar la bitácora del ticket.'),
          { cause: err },
        );
      }
    },

    /** Carga técnicos activos disponibles para asignación desde GET /api/tickets/tecnicos. */
    async cargarTecnicosDisponibles(idDepartamento?: number): Promise<TecnicoDisponible[]> {
      try {
        const { data: respuesta } = await api.get<RespuestaApi<TecnicoDisponible[]>>(
          '/tickets/tecnicos',
          {
            params: idDepartamento ? { id_departamento: idDepartamento } : undefined,
          },
        );
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        this.tecnicosDisponibles = lista;
        return lista;
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar los técnicos disponibles.'),
          { cause: err },
        );
      }
    },

    limpiarTickets(): void {
      this.tickets = [];
      this.tecnicosDisponibles = [];
      this.errorCarga = null;
    },

    // 🛡️ [FASE 2.4 - TICKETS] Comentarios y Adjuntos

    async cargarComentarios(idTicket: number): Promise<TicketComentarioItem[]> {
      try {
        const { data: respuesta } = await api.get<RespuestaApi<TicketComentarioItem[]>>(
          `/tickets/${idTicket}/comentarios`,
        );
        return Array.isArray(respuesta.data) ? respuesta.data : [];
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar los comentarios del ticket.'),
          { cause: err },
        );
      }
    },

    async crearComentario(
      idTicket: number,
      payload: CreateTicketComentarioPayload,
    ): Promise<void> {
      this.guardando = true;
      try {
        await api.post(`/tickets/${idTicket}/comentarios`, payload);
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible publicar el comentario.'), {
          cause: err,
        });
      } finally {
        this.guardando = false;
      }
    },

    async cargarAdjuntos(idTicket: number): Promise<TicketAdjuntoItem[]> {
      try {
        const { data: respuesta } = await api.get<RespuestaApi<TicketAdjuntoItem[]>>(
          `/tickets/${idTicket}/adjuntos`,
        );
        return Array.isArray(respuesta.data) ? respuesta.data : [];
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar los archivos adjuntos.'),
          { cause: err },
        );
      }
    },

    async subirAdjunto(idTicket: number, archivo: File): Promise<void> {
      this.guardando = true;
      try {
        const formData = new FormData();
        formData.append('archivo', archivo);

        await api.post(`/tickets/${idTicket}/adjuntos`, formData, {
          // Eliminar Content-Type JSON por defecto para que el navegador genere el boundary multipart
          transformRequest: [
            (data, headers) => {
              headers?.delete?.('Content-Type');
              return data;
            },
          ],
        });
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible subir el archivo adjunto.'), {
          cause: err,
        });
      } finally {
        this.guardando = false;
      }
    },

    async obtenerBlobAdjunto(idTicket: number, adjuntoId: number): Promise<Blob> {
      try {
        const { data } = await api.get<Blob>(
          `/tickets/${idTicket}/adjuntos/${adjuntoId}/descargar`,
          { responseType: 'blob' },
        );
        return data;
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible descargar el archivo.'), {
          cause: err,
        });
      }
    },
  },
});
