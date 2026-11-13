import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface UsuarioApi {
  id: number;
  nombre_completo: string;
  nick: string;
  telefono: string;
  is_activo: boolean;
  is_new_user: boolean;
  id_rol: number;
  codigo_rol: string;
  rol: string;
  id_departamento: number;
  codigo: string;
  departamento: string;
  tipo: string;
  email: string | null;
}

export interface User {
  id: number;
  nombre_completo: string;
  nick: string;
  telefono: string;
  email: string | null;
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  tipo_departamento: string;
  id_rol: number;
  codigo_rol: string;
  rol: string;
  is_activo: boolean;
  is_new_user: boolean;
  estado: EstadoUsuario;
}

export interface UserFormPayload {
  nombre_completo: string;
  nick: string;
  telefono: string;
  email: string | null;
  id_departamento: number;
  id_rol: number;
  is_activo?: boolean;
}

function mapearUsuario(item: UsuarioApi): User {
  return {
    id: Number(item.id),
    nombre_completo: item.nombre_completo.trim(),
    nick: item.nick.trim().toLowerCase(),
    telefono: item.telefono.trim(),
    email: item.email ? item.email.trim() : null,
    id_departamento: Number(item.id_departamento),
    codigo_departamento: (item.codigo ?? '').trim().toUpperCase(),
    departamento: (item.departamento ?? '').trim(),
    tipo_departamento: (item.tipo ?? '').trim(),
    id_rol: Number(item.id_rol),
    codigo_rol: (item.codigo_rol ?? '').trim().toUpperCase(),
    rol: (item.rol ?? '').trim(),
    is_activo: Boolean(item.is_activo),
    is_new_user: Boolean(item.is_new_user),
    estado: item.is_activo ? 'Activo' : 'Inactivo',
  };
}

interface UsersState {
  users: User[];
  cargando: boolean;
  errorCarga: string | null;
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    cargando: false,
    errorCarga: null,
  }),

  actions: {
    async cargarUsuarios(): Promise<User[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const { data: respuesta } = await api.get<RespuestaApi<UsuarioApi[]>>('/usuarios');
        const lista = Array.isArray(respuesta.data) ? respuesta.data.map(mapearUsuario) : [];
        this.users = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(
          err,
          'No fue posible cargar el listado de usuarios.',
        );
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    async agregarUsuario(payload: UserFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          nombre_completo: payload.nombre_completo.trim(),
          nick: payload.nick.trim().toLowerCase(),
          telefono: payload.telefono.trim(),
          id_departamento: Number(payload.id_departamento),
          id_rol: Number(payload.id_rol),
        };

        if (payload.email && payload.email.trim().length > 0) {
          body.email = payload.email.trim().toLowerCase();
        }

        await api.post<RespuestaApi<null>>('/usuarios', body);
        await this.cargarUsuarios();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible crear el usuario.'), {
          cause: err,
        });
      }
    },

    async actualizarUsuario(id: number, payload: UserFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          nombre_completo: payload.nombre_completo.trim(),
          nick: payload.nick.trim().toLowerCase(),
          telefono: payload.telefono.trim(),
          id_departamento: Number(payload.id_departamento),
          id_rol: Number(payload.id_rol),
          email:
            payload.email && payload.email.trim().length > 0
              ? payload.email.trim().toLowerCase()
              : null,
        };

        if (typeof payload.is_activo === 'boolean') {
          body.is_activo = payload.is_activo;
        }

        await api.patch<RespuestaApi<null>>(`/usuarios/${id}`, body);
        await this.cargarUsuarios();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible actualizar el usuario.'), {
          cause: err,
        });
      }
    },

    async alternarEstadoUsuario(usuario: User): Promise<EstadoUsuario> {
      const nuevoActivo = !usuario.is_activo;
      try {
        await api.patch<RespuestaApi<null>>(`/usuarios/${usuario.id}`, {
          is_activo: nuevoActivo,
        });
        await this.cargarUsuarios();
        return nuevoActivo ? 'Activo' : 'Inactivo';
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cambiar el estado del usuario.'),
          { cause: err },
        );
      }
    },

    async resetearPasswordUsuario(id: number): Promise<void> {
      try {
        await api.patch<RespuestaApi<null>>(`/usuarios/${id}/reset-password`);
        await this.cargarUsuarios();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible restablecer la contraseña del usuario.'),
          { cause: err },
        );
      }
    },
  },
});
