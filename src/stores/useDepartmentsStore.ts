import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { RespuestaApi } from '@/models/auth';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

export type EstadoDepartamento = 'Activo' | 'Inactivo';

export interface DepartamentoApi {
  id: number;
  codigo: string;
  nombre: string;
  responsable: string | null;
  telefono: string;
  ubicacion: string;
  id_tipo_departamento: number;
  tipo_departamento?: string;
  is_activo: boolean;
}

export interface Department {
  id: number;
  codigo: string;
  nombre: string;
  responsable: string | null;
  telefono: string;
  ubicacion: string;
  id_tipo_departamento: number;
  tipo_departamento: string;
  is_activo: boolean;
  estado: EstadoDepartamento;
}

export interface DepartmentFormPayload {
  codigo: string;
  nombre: string;
  responsable: string | null;
  telefono: string;
  ubicacion: string;
  id_tipo_departamento: number;
  estado?: EstadoDepartamento;
}

function mapearDepartamento(item: DepartamentoApi): Department {
  return {
    id: Number(item.id),
    codigo: item.codigo.trim().toUpperCase(),
    nombre: item.nombre.trim(),
    responsable: item.responsable ? item.responsable.trim() : null,
    telefono: item.telefono.trim(),
    ubicacion: (item.ubicacion ?? '').trim(),
    id_tipo_departamento: Number(item.id_tipo_departamento),
    tipo_departamento: (item.tipo_departamento ?? 'SIN TIPO').trim(),
    is_activo: Boolean(item.is_activo),
    estado: item.is_activo ? 'Activo' : 'Inactivo',
  };
}

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: [] as Department[],
    cargando: false,
  }),

  getters: {
    departamentosActivos: (state): Department[] =>
      state.departments.filter((d) => d.is_activo),
    nombresDepartamentosActivos: (state): string[] =>
      state.departments.filter((d) => d.is_activo).map((d) => d.nombre),
  },

  actions: {
    async cargarDepartamentos(): Promise<void> {
      this.cargando = true;
      try {
        const { data } = await api.get<RespuestaApi<DepartamentoApi[]>>('/departamentos');
        const lista = Array.isArray(data.data) ? data.data : [];
        this.departments = lista.map(mapearDepartamento);
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar el listado de departamentos.'),
          { cause: err },
        );
      } finally {
        this.cargando = false;
      }
    },

    async agregarDepartamento(payload: DepartmentFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          codigo: payload.codigo.trim().toUpperCase(),
          nombre: payload.nombre.trim(),
          telefono: payload.telefono.trim(),
          ubicacion: payload.ubicacion.trim(),
          id_tipo_departamento: Number(payload.id_tipo_departamento),
        };

        if (payload.responsable && payload.responsable.trim().length > 0) {
          body.responsable = payload.responsable.trim();
        }

        await api.post<RespuestaApi<null>>('/departamentos', body);
        await this.cargarDepartamentos();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible crear el departamento.'), {
          cause: err,
        });
      }
    },

    async actualizarDepartamento(id: number, payload: DepartmentFormPayload): Promise<void> {
      try {
        const body: Record<string, unknown> = {
          codigo: payload.codigo.trim().toUpperCase(),
          nombre: payload.nombre.trim(),
          responsable:
            payload.responsable && payload.responsable.trim().length > 0
              ? payload.responsable.trim()
              : null,
          telefono: payload.telefono.trim(),
          ubicacion: payload.ubicacion.trim(),
          id_tipo_departamento: Number(payload.id_tipo_departamento),
        };

        if (payload.estado !== undefined) {
          body.is_activo = payload.estado === 'Activo';
        }

        await api.patch<RespuestaApi<null>>(`/departamentos/${id}`, body);
        await this.cargarDepartamentos();
      } catch (err: unknown) {
        throw new Error(extraerMensajeErrorApi(err, 'No fue posible actualizar el departamento.'), {
          cause: err,
        });
      }
    },

    async alternarEstado(id: number): Promise<Department> {
      const depto = this.departments.find((d) => d.id === id);
      if (!depto) {
        throw new Error('No se encontró el departamento.');
      }

      const nuevoIsActivo = !depto.is_activo;
      try {
        await api.patch<RespuestaApi<null>>(`/departamentos/${id}`, {
          is_activo: nuevoIsActivo,
        });
        await this.cargarDepartamentos();
        const actualizado = this.departments.find((d) => d.id === id);
        return (
          actualizado ?? {
            ...depto,
            is_activo: nuevoIsActivo,
            estado: nuevoIsActivo ? 'Activo' : 'Inactivo',
          }
        );
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cambiar el estado del departamento.'),
          { cause: err },
        );
      }
    },
  },
});
