import { defineStore } from 'pinia';
import type { PaginationMeta, RespuestaApi } from '@/models/auth';
import type {
  BaseSolucionesFiltrosQuery,
  BaseSolucionItem,
  CreateTicketComentarioPayload,
  CreateTicketPayload,
  CreateTicketResult,
  EstadoTicket,
  MetricasFiltrosQuery,
  MetricasTicketsResponse,
  PatchTicketEstadoPayload,
  PatchTicketEstadoResult,
  SolicitanteItem,
  TecnicoDisponible,
  Ticket,
  TicketAdjuntoItem,
  TicketBitacoraItem,
  TicketComentarioItem,
  TicketFiltrosQuery,
  TransferirTicketPayload,
  TransferirTicketResult,
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
  paginacionMeta: PaginationMeta | null;
  tecnicosDisponibles: TecnicoDisponible[];
  ultimosFiltros: TicketFiltrosQuery;
  cargando: boolean;
  guardando: boolean;
  errorCarga: string | null;
}

export const useTicketStore = defineStore('ticket', {
  state: (): TicketState => ({
    tickets: [],
    paginacionMeta: null,
    tecnicosDisponibles: [],
    ultimosFiltros: {},
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
    /** Carga tickets desde GET /api/tickets aplicando filtros opcionales y paginación server-side. */
    async cargarTickets(filtros: TicketFiltrosQuery = {}): Promise<Ticket[]> {
      this.cargando = true;
      this.errorCarga = null;
      this.ultimosFiltros = { ...filtros };
      try {
        const params: Record<string, string | number | boolean> = {};
        for (const [clave, valor] of Object.entries(filtros)) {
          if (valor === undefined || valor === '') continue;
          if (clave === 'estados' && Array.isArray(valor)) {
            if (valor.length > 0) {
              params.estados = valor.join(',');
            }
            continue;
          }
          params[clave] = valor as string | number | boolean;
        }
        const { data: respuesta } = await api.get<RespuestaApi<Ticket[]>>('/tickets', {
          params,
        });
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        this.tickets = lista;
        this.paginacionMeta = respuesta.pagination ?? null;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(err, 'No fue posible cargar los tickets.');
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    /** Consulta puntual de un ticket por folio sin alterar la página actual de la bandeja. */
    async buscarTicketPorFolio(folio: string): Promise<Ticket | null> {
      try {
        const { data: respuesta } = await api.get<RespuestaApi<Ticket[]>>('/tickets', {
          params: { folio: folio.trim() },
        });
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        return lista[0] ?? null;
      } catch {
        return null;
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
        await this.cargarTickets(this.ultimosFiltros);
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

    // 🛡️ [FASE 3.3 - TICKETS] Transferencia de ticket hacia otra Sub-Gerencia TI
    async transferirTicket(
      idTicket: number,
      payload: TransferirTicketPayload,
    ): Promise<TransferirTicketResult> {
      this.guardando = true;
      try {
        const { data: respuesta } = await api.patch<RespuestaApi<TransferirTicketResult>>(
          `/tickets/${idTicket}/transferir`,
          payload,
        );
        await this.cargarTickets(this.ultimosFiltros);
        return respuesta.data;
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible transferir el ticket de área TI.'),
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

    // 🛡️ [FASE 3.1 - SOLICITANTES] Búsqueda de solicitantes registrados en GET /api/tickets/solicitantes
    async buscarSolicitantes(q?: string, idDepartamento?: number): Promise<SolicitanteItem[]> {
      try {
        const params: Record<string, string | number> = {};
        if (q?.trim()) params.q = q.trim();
        if (idDepartamento && idDepartamento > 0) params.id_departamento = idDepartamento;

        const { data: respuesta } = await api.get<RespuestaApi<SolicitanteItem[]>>(
          '/tickets/solicitantes',
          { params },
        );
        return Array.isArray(respuesta.data) ? respuesta.data : [];
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible consultar el directorio de solicitantes.'),
          { cause: err },
        );
      }
    },

    limpiarTickets(): void {
      this.tickets = [];
      this.paginacionMeta = null;
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

    // 🛡️ [FASE 3.0 - COMENTARIOS] Anulación lógica (tachado) auditada de comentario manual
    async anularComentario(idTicket: number, comentarioId: number): Promise<void> {
      this.guardando = true;
      try {
        await api.patch(`/tickets/${idTicket}/comentarios/${comentarioId}/anular`);
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible anular el comentario.'), {
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

    // 🛡️ [FASE 3.5 - VISTAS] Consulta del motor SQL de relojes reales y KPIs (GET /api/tickets/metricas)
    async cargarMetricas(filtros: MetricasFiltrosQuery = {}): Promise<MetricasTicketsResponse> {
      try {
        const params = Object.fromEntries(
          Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
        );
        const { data: respuesta } = await api.get<RespuestaApi<MetricasTicketsResponse>>(
          '/tickets/metricas',
          { params },
        );
        return respuesta.data;
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar las métricas reales de SLA.'),
          { cause: err },
        );
      }
    },

    // 🛡️ [FASE 3.5 / 4.3 - VISTAS] Consulta paginada server-side (sin PII) de Base de Soluciones
    async cargarBaseSolucionesPaginadas(
      filtros: BaseSolucionesFiltrosQuery = {},
    ): Promise<{ data: BaseSolucionItem[]; pagination: PaginationMeta }> {
      try {
        const params = Object.fromEntries(
          Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
        );
        const { data: respuesta } = await api.get<RespuestaApi<BaseSolucionItem[]>>(
          '/tickets/base-soluciones',
          { params },
        );
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        const limit = Number(filtros.limit ?? 10);
        const page = Number(filtros.page ?? 1);
        return {
          data: lista,
          pagination: respuesta.pagination ?? {
            total: lista.length,
            page,
            limit,
            total_pages: Math.max(1, Math.ceil(lista.length / Math.max(1, limit))),
          },
        };
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible consultar la Base de Soluciones.'),
          { cause: err },
        );
      }
    },

    // 🛡️ [FASE 3.5 - VISTAS] Consulta acotada (sin PII) de Base de Soluciones (GET /api/tickets/base-soluciones)
    async cargarBaseSoluciones(
      filtros: BaseSolucionesFiltrosQuery = {},
    ): Promise<BaseSolucionItem[]> {
      try {
        const params = Object.fromEntries(
          Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
        );
        const { data: respuesta } = await api.get<RespuestaApi<BaseSolucionItem[]>>(
          '/tickets/base-soluciones',
          { params },
        );
        return Array.isArray(respuesta.data) ? respuesta.data : [];
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible consultar la Base de Soluciones.'),
          { cause: err },
        );
      }
    },
  },
});
