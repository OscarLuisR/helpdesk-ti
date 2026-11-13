import axios from 'axios';
import { defineStore } from 'pinia';
import type { ErrorApiBackend, RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';

export type EstadoRol = 'Activo' | 'Inactivo';

export interface RolBackend {
  id: number;
  codigo: string;
  nombre: string;
  is_activo: boolean;
}

export interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  is_activo: boolean;
  estado: EstadoRol;
}

export interface RolFormPayload {
  codigo: string;
  nombre: string;
  is_activo?: boolean;
}

function mapearRol(item: RolBackend): RolItem {
  return {
    id: Number(item.id),
    codigo: item.codigo.trim().toUpperCase(),
    nombre: item.nombre.trim(),
    is_activo: Boolean(item.is_activo),
    estado: item.is_activo ? 'Activo' : 'Inactivo',
  };
}

export function extraerMensajeErrorApi(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ErrorApiBackend>(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
    if (!err.response) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}

interface RolesState {
  roles: RolItem[];
  cargando: boolean;
  errorCarga: string | null;
}

export const useRolesStore = defineStore('roles', {
  state: (): RolesState => ({
    roles: [],
    cargando: false,
    errorCarga: null,
  }),

  getters: {
    rolesActivos: (state): RolItem[] => state.roles.filter((r) => r.is_activo),
  },

  actions: {
    async cargarRoles(): Promise<RolItem[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const { data: respuesta } = await api.get<RespuestaApi<RolBackend[]>>('/roles');
        const lista = Array.isArray(respuesta.data) ? respuesta.data.map(mapearRol) : [];
        this.roles = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(err, 'No fue posible cargar el listado de roles.');
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    async crearRol(payload: RolFormPayload): Promise<void> {
      try {
        await api.post('/roles', {
          codigo: payload.codigo.trim().toUpperCase(),
          nombre: payload.nombre.trim(),
        });
        await this.cargarRoles();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible crear el rol.'), {
          cause: err,
        });
      }
    },

    async actualizarRol(id: number, payload: RolFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          codigo: payload.codigo.trim().toUpperCase(),
          nombre: payload.nombre.trim(),
        };
        if (typeof payload.is_activo === 'boolean') {
          body.is_activo = payload.is_activo;
        }
        await api.patch(`/roles/${id}`, body);
        await this.cargarRoles();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible actualizar el rol.'), {
          cause: err,
        });
      }
    },

    async alternarEstadoRol(rol: RolItem): Promise<EstadoRol> {
      const nuevoActivo = !rol.is_activo;
      try {
        await api.patch(`/roles/${rol.id}`, {
          is_activo: nuevoActivo,
        });
        await this.cargarRoles();
        return nuevoActivo ? 'Activo' : 'Inactivo';
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No se pudo cambiar el estado del rol.'), {
          cause: err,
        });
      }
    },
  },
});
