import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

export type EstadoPrioridad = 'Activo' | 'Inactivo';

export interface PrioridadApi {
  id: number;
  nombre: string;
  tiempo_max_asignacion_minutos: number;
  tiempo_meta_resolucion_horas: number;
  is_activo: boolean;
  descripcion_criterio: string | null;
  ejemplos_falla: string | null;
  activa_suplencia: boolean;
}

export interface PrioridadItem {
  id: number;
  nombre: string;
  tiempo_max_asignacion_minutos: number;
  tiempo_meta_resolucion_horas: number;
  is_activo: boolean;
  estado: EstadoPrioridad;
  descripcion_criterio: string | null;
  ejemplos_falla: string | null;
  activa_suplencia: boolean;
}

export interface PrioridadFormPayload {
  nombre: string;
  tiempo_max_asignacion_minutos: number;
  tiempo_meta_resolucion_horas: number;
  descripcion_criterio: string | null;
  ejemplos_falla: string | null;
  activa_suplencia: boolean;
  is_activo?: boolean;
}

function mapearPrioridad(item: PrioridadApi): PrioridadItem {
  return {
    id: Number(item.id),
    nombre: item.nombre.trim(),
    tiempo_max_asignacion_minutos: Number(item.tiempo_max_asignacion_minutos),
    tiempo_meta_resolucion_horas: Number(item.tiempo_meta_resolucion_horas),
    is_activo: Boolean(item.is_activo),
    estado: item.is_activo ? 'Activo' : 'Inactivo',
    descripcion_criterio: item.descripcion_criterio ? item.descripcion_criterio.trim() : null,
    ejemplos_falla: item.ejemplos_falla ? item.ejemplos_falla.trim() : null,
    activa_suplencia: Boolean(item.activa_suplencia),
  };
}

interface PrioridadesState {
  prioridades: PrioridadItem[];
  cargando: boolean;
  errorCarga: string | null;
}

export const usePrioridadesStore = defineStore('prioridades', {
  state: (): PrioridadesState => ({
    prioridades: [],
    cargando: false,
    errorCarga: null,
  }),

  getters: {
    prioridadesActivas: (state): PrioridadItem[] =>
      state.prioridades.filter((p) => p.is_activo),
  },

  actions: {
    async cargarPrioridades(): Promise<PrioridadItem[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const { data: respuesta } = await api.get<RespuestaApi<PrioridadApi[]>>('/prioridades');
        const lista = Array.isArray(respuesta.data) ? respuesta.data.map(mapearPrioridad) : [];
        this.prioridades = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(
          err,
          'No fue posible cargar la configuración de prioridades SLA.',
        );
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    async crearPrioridad(payload: PrioridadFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          nombre: payload.nombre.trim(),
          tiempo_max_asignacion_minutos: Number(payload.tiempo_max_asignacion_minutos),
          tiempo_meta_resolucion_horas: Number(payload.tiempo_meta_resolucion_horas),
          activa_suplencia: Boolean(payload.activa_suplencia),
        };

        if (payload.descripcion_criterio && payload.descripcion_criterio.trim().length > 0) {
          body.descripcion_criterio = payload.descripcion_criterio.trim();
        }
        if (payload.ejemplos_falla && payload.ejemplos_falla.trim().length > 0) {
          body.ejemplos_falla = payload.ejemplos_falla.trim();
        }

        await api.post<RespuestaApi<null>>('/prioridades', body);
        await this.cargarPrioridades();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible crear la prioridad.'), {
          cause: err,
        });
      }
    },

    async actualizarPrioridad(id: number, payload: PrioridadFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          nombre: payload.nombre.trim(),
          tiempo_max_asignacion_minutos: Number(payload.tiempo_max_asignacion_minutos),
          tiempo_meta_resolucion_horas: Number(payload.tiempo_meta_resolucion_horas),
          descripcion_criterio:
            payload.descripcion_criterio && payload.descripcion_criterio.trim().length > 0
              ? payload.descripcion_criterio.trim()
              : null,
          ejemplos_falla:
            payload.ejemplos_falla && payload.ejemplos_falla.trim().length > 0
              ? payload.ejemplos_falla.trim()
              : null,
          activa_suplencia: Boolean(payload.activa_suplencia),
        };

        if (typeof payload.is_activo === 'boolean') {
          body.is_activo = payload.is_activo;
        }

        await api.patch<RespuestaApi<null>>(`/prioridades/${id}`, body);
        await this.cargarPrioridades();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible actualizar la prioridad.'), {
          cause: err,
        });
      }
    },

    async alternarEstadoPrioridad(prioridad: PrioridadItem): Promise<EstadoPrioridad> {
      const nuevoActivo = !prioridad.is_activo;
      try {
        await api.patch<RespuestaApi<null>>(`/prioridades/${prioridad.id}`, {
          is_activo: nuevoActivo,
        });
        await this.cargarPrioridades();
        return nuevoActivo ? 'Activo' : 'Inactivo';
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cambiar el estado de la prioridad.'),
          { cause: err },
        );
      }
    },
  },
});
