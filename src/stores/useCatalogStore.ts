import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

export type EstadoServicio = 'Activo' | 'Inactivo';

export interface CatalogoIncidenciaApi {
  id: number;
  nombre: string;
  id_departamento: number;
  codigo_departamento?: string;
  departamento?: string;
  id_prioridad: number;
  prioridad?: string;
  is_activo: boolean;
}

export interface ServiceCatalog {
  id: number;
  nombre: string;
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  id_prioridad: number;
  prioridad: string;
  is_activo: boolean;
  estado: EstadoServicio;
}

export interface ServiceCatalogPayload {
  nombre: string;
  id_departamento: number;
  id_prioridad: number;
  is_activo?: boolean;
}

function mapearServicio(item: CatalogoIncidenciaApi): ServiceCatalog {
  return {
    id: Number(item.id),
    nombre: item.nombre.trim(),
    id_departamento: Number(item.id_departamento),
    codigo_departamento: (item.codigo_departamento ?? '').trim().toUpperCase(),
    departamento: (item.departamento ?? '').trim(),
    id_prioridad: Number(item.id_prioridad),
    prioridad: (item.prioridad ?? '').trim(),
    is_activo: Boolean(item.is_activo),
    estado: item.is_activo ? 'Activo' : 'Inactivo',
  };
}

interface CatalogState {
  services: ServiceCatalog[];
  cargando: boolean;
  errorCarga: string | null;
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({
    services: [],
    cargando: false,
    errorCarga: null,
  }),

  getters: {
    serviciosActivos: (state): ServiceCatalog[] => state.services.filter((s) => s.is_activo),
  },

  actions: {
    async cargarCatalogo(): Promise<ServiceCatalog[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const { data: respuesta } = await api.get<RespuestaApi<CatalogoIncidenciaApi[]>>(
          '/catalogo-incidencias',
        );
        const lista = Array.isArray(respuesta.data) ? respuesta.data.map(mapearServicio) : [];
        this.services = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(
          err,
          'No fue posible cargar el catálogo de incidencias.',
        );
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    async agregarServicio(payload: ServiceCatalogPayload): Promise<void> {
      try {
        await api.post<RespuestaApi<null>>('/catalogo-incidencias', {
          nombre: payload.nombre.trim(),
          id_departamento: Number(payload.id_departamento),
          id_prioridad: Number(payload.id_prioridad),
        });
        await this.cargarCatalogo();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible registrar la incidencia en el catálogo.'),
          { cause: err },
        );
      }
    },

    async actualizarServicio(id: number, payload: ServiceCatalogPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          nombre: payload.nombre.trim(),
          id_departamento: Number(payload.id_departamento),
          id_prioridad: Number(payload.id_prioridad),
        };

        if (typeof payload.is_activo === 'boolean') {
          body.is_activo = payload.is_activo;
        }

        await api.patch<RespuestaApi<null>>(`/catalogo-incidencias/${id}`, body);
        await this.cargarCatalogo();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible actualizar la incidencia del catálogo.'),
          { cause: err },
        );
      }
    },

    async alternarEstado(servicio: ServiceCatalog): Promise<EstadoServicio> {
      const nuevoActivo = !servicio.is_activo;
      try {
        await api.patch<RespuestaApi<null>>(`/catalogo-incidencias/${servicio.id}`, {
          is_activo: nuevoActivo,
        });
        await this.cargarCatalogo();
        return nuevoActivo ? 'Activo' : 'Inactivo';
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No se pudo cambiar el estado del servicio.'),
          { cause: err },
        );
      }
    },
  },
});
