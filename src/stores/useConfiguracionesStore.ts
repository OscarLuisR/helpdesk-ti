import { defineStore } from 'pinia';
import type { RespuestaApi } from '@/models/auth';
import { api } from '@/services/api';
import { extraerMensajeErrorApi } from '@/stores/useRolesStore';

// 🛡️ [FASE 3 - CONFIGURACIONES GENERALES] Store Pinia para parámetros globales dinámicos del sistema

export interface ConfiguracionGeneralItem {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  valor: string;
  tipo_dato: 'INTEGER' | 'TEXT' | 'BOOLEAN';
  valor_minimo: number | null;
  valor_maximo: number | null;
  fecha_actualizacion: string;
  id_usuario_actualizacion: number | null;
  usuario_actualizacion: string | null;
}

interface ConfiguracionesOperativasApi {
  max_adjuntos_por_ticket: number;
  max_imagenes_nuevo_ticket: number;
  tamano_max_adjunto_mb: number;
  meta_max_reapertura_pct: number;
  clave_temporal_defecto?: string;
}

function mapearConfiguracion(item: ConfiguracionGeneralItem): ConfiguracionGeneralItem {
  return {
    ...item,
    id: Number(item.id),
    valor_minimo: item.valor_minimo !== null ? Number(item.valor_minimo) : null,
    valor_maximo: item.valor_maximo !== null ? Number(item.valor_maximo) : null,
    id_usuario_actualizacion:
      item.id_usuario_actualizacion !== null ? Number(item.id_usuario_actualizacion) : null,
  };
}

function parseEnteroSeguro(valor: unknown, defecto: number): number {
  const num = Number(valor);
  return Number.isInteger(num) && num >= 1 ? num : defecto;
}

export const useConfiguracionesStore = defineStore('configuraciones', {
  state: () => ({
    configuraciones: [] as ConfiguracionGeneralItem[],
    maxAdjuntosPorTicket: 5,
    maxImagenesNuevoTicket: 3,
    tamanoMaxAdjuntoMb: 5,
    metaMaxReaperturaPct: 5,
    claveTemporalDefecto: '123456',
    cargando: false,
    guardando: false,
  }),

  getters: {
    tamanoMaxAdjuntoBytes: (state): number => state.tamanoMaxAdjuntoMb * 1024 * 1024,
  },

  actions: {
    sincronizarDesdeLista(): void {
      const porClave = new Map<string, string>();
      for (const c of this.configuraciones) {
        porClave.set(c.clave.trim().toUpperCase(), c.valor.trim());
      }

      this.maxAdjuntosPorTicket = parseEnteroSeguro(
        porClave.get('MAX_ADJUNTOS_POR_TICKET'),
        this.maxAdjuntosPorTicket,
      );
      this.maxImagenesNuevoTicket = parseEnteroSeguro(
        porClave.get('MAX_IMAGENES_NUEVO_TICKET'),
        this.maxImagenesNuevoTicket,
      );
      this.tamanoMaxAdjuntoMb = parseEnteroSeguro(
        porClave.get('TAMANO_MAX_ADJUNTO_MB'),
        this.tamanoMaxAdjuntoMb,
      );
      this.metaMaxReaperturaPct = parseEnteroSeguro(
        porClave.get('META_MAX_REAPERTURA_PCT'),
        this.metaMaxReaperturaPct,
      );

      const claveTemp = porClave.get('CLAVE_TEMPORAL_DEFECTO');
      if (claveTemp && claveTemp.length >= 6) {
        this.claveTemporalDefecto = claveTemp;
      }
    },

    async cargarConfiguraciones(): Promise<void> {
      this.cargando = true;
      try {
        const { data } = await api.get<RespuestaApi<ConfiguracionGeneralItem[]>>('/configuraciones');
        const lista = Array.isArray(data.data) ? data.data : [];
        this.configuraciones = lista.map(mapearConfiguracion);
        this.sincronizarDesdeLista();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible cargar las configuraciones generales.'),
          { cause: err },
        );
      } finally {
        this.cargando = false;
      }
    },

    async cargarOperativas(): Promise<void> {
      try {
        const { data } = await api.get<RespuestaApi<ConfiguracionesOperativasApi>>(
          '/configuraciones/operativas',
        );
        const ops = data.data;
        if (!ops) return;

        this.maxAdjuntosPorTicket = parseEnteroSeguro(
          ops.max_adjuntos_por_ticket,
          this.maxAdjuntosPorTicket,
        );
        this.maxImagenesNuevoTicket = parseEnteroSeguro(
          ops.max_imagenes_nuevo_ticket,
          this.maxImagenesNuevoTicket,
        );
        this.tamanoMaxAdjuntoMb = parseEnteroSeguro(
          ops.tamano_max_adjunto_mb,
          this.tamanoMaxAdjuntoMb,
        );
        this.metaMaxReaperturaPct = parseEnteroSeguro(
          ops.meta_max_reapertura_pct,
          this.metaMaxReaperturaPct,
        );
        if (ops.clave_temporal_defecto && ops.clave_temporal_defecto.trim().length >= 6) {
          this.claveTemporalDefecto = ops.clave_temporal_defecto.trim();
        }
      } catch {
        // En caso de error de red, conserva los valores vigentes y el backend valida de forma autoritativa
      }
    },

    async actualizarConfiguracion(id: number, valor: string): Promise<void> {
      this.guardando = true;
      try {
        await api.patch(`/configuraciones/${id}`, { valor: valor.trim() });
        await this.cargarConfiguraciones();
      } catch (err: unknown) {
        throw new Error(
          extraerMensajeErrorApi(err, 'No fue posible actualizar la configuración.'),
          { cause: err },
        );
      } finally {
        this.guardando = false;
      }
    },
  },
});
