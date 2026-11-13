import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

export interface TipoDepartamentoItem {
  id: number;
  nombre: string;
}

export interface TipoDepartamentoFormPayload {
  nombre: string;
}

function mapearTipoDepartamento(item: TipoDepartamentoItem): TipoDepartamentoItem {
  return {
    id: Number(item.id),
    nombre: item.nombre.trim(),
  };
}

interface TipoDepartamentosState {
  tiposDepartamento: TipoDepartamentoItem[];
  cargando: boolean;
  errorCarga: string | null;
}

export const useTipoDepartamentosStore = defineStore('tipoDepartamentos', {
  state: (): TipoDepartamentosState => ({
    tiposDepartamento: [],
    cargando: false,
    errorCarga: null,
  }),

  actions: {
    async cargarTiposDepartamento(): Promise<TipoDepartamentoItem[]> {
      this.cargando = true;
      this.errorCarga = null;
      try {
        const { data: respuesta } =
          await api.get<RespuestaApi<TipoDepartamentoItem[]>>('/tipo-departamentos');
        const lista = Array.isArray(respuesta.data)
          ? respuesta.data.map(mapearTipoDepartamento)
          : [];
        this.tiposDepartamento = lista;
        return lista;
      } catch (err: unknown) {
        const mensaje = extraerMensajeErrorApi(
          err,
          'No fue posible cargar los tipos de departamento.',
        );
        this.errorCarga = mensaje;
        throw new Error(mensaje, { cause: err });
      } finally {
        this.cargando = false;
      }
    },

    async crearTipoDepartamento(payload: TipoDepartamentoFormPayload): Promise<void> {
      try {
        await api.post('/tipo-departamentos', {
          nombre: payload.nombre.trim(),
        });
        await this.cargarTiposDepartamento();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible crear el tipo de departamento.'),
          { cause: err },
        );
      }
    },

    async actualizarTipoDepartamento(
      id: number,
      payload: TipoDepartamentoFormPayload,
    ): Promise<void> {
      try {
        await api.patch(`/tipo-departamentos/${id}`, {
          nombre: payload.nombre.trim(),
        });
        await this.cargarTiposDepartamento();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible actualizar el tipo de departamento.'),
          { cause: err },
        );
      }
    },
  },
});
