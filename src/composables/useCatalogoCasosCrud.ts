import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import type { PayloadTipoCasoMaestro, TipoCasoMaestro } from '@/models/catalogos';
import type { AreaDestino, Prioridad, TipoTrabajo } from '@/models/types';
import { useCatalogosStore } from '@/stores/catalogosStore';

export const AREAS_TI_DISPONIBLES: readonly AreaDestino[] = [
  'Redes',
  'Soporte Técnico',
  'Desarrollo',
  'Aplicaciones',
];

export const TIPOS_TRABAJO_DISPONIBLES: readonly TipoTrabajo[] = [
  'Incidencia',
  'Requerimiento de Servicio',
  'Desarrollo',
  'Actividad Interna',
];

export const PRIORIDADES_DISPONIBLES: readonly Prioridad[] = [
  'Crítica',
  'Alta',
  'Media',
  'Baja',
];

export const NATURALEZA_CHIP_CLASS: Record<TipoTrabajo, string> = {
  Incidencia: 'bad',
  'Requerimiento de Servicio': 'info',
  Desarrollo: 'brand',
  'Actividad Interna': 'neutral',
};

export const COLUMNAS_TIPOS_CASO: QTableColumn<TipoCasoMaestro>[] = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nombre', label: 'Caso / Actividad Tipificada', field: 'nombre', align: 'left', sortable: true },
  { name: 'naturaleza', label: 'Naturaleza', field: 'naturaleza', align: 'left', sortable: true },
  { name: 'areaDestino', label: 'Sub-Área TI', field: 'areaDestino', align: 'left', sortable: true },
  { name: 'prioridadSugerida', label: 'Prioridad Base', field: 'prioridadSugerida', align: 'left', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left', sortable: true },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
];

export function useCatalogoCasosCrud() {
  const catalogosStore = useCatalogosStore();

  const busqueda = ref('');
  const naturalezasFiltro = ref<TipoTrabajo[]>([]);
  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const tipoCasoEditando = ref<TipoCasoMaestro | null>(null);

  onMounted(() => {
    void catalogosStore.cargarTiposCaso();
  });

  const tiposCasoFiltrados = computed<TipoCasoMaestro[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return catalogosStore.tiposCaso.filter((c) => {
      const coincideNaturaleza =
        !naturalezasFiltro.value.length || naturalezasFiltro.value.includes(c.naturaleza);
      const coincideTexto =
        !q ||
        [c.codigo, c.nombre, c.naturaleza, c.areaDestino, c.prioridadSugerida].some((v) =>
          v.toLowerCase().includes(q),
        );
      return coincideNaturaleza && coincideTexto;
    });
  });

  function limpiarFiltros(): void {
    naturalezasFiltro.value = [];
  }

  function abrirModalCrear(): void {
    tipoCasoEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(item: TipoCasoMaestro): void {
    tipoCasoEditando.value = { ...item };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarTipoCaso(payload: PayloadTipoCasoMaestro): Promise<boolean> {
    if (guardando.value) return false;
    errorFormulario.value = null;
    guardando.value = true;

    try {
      if (tipoCasoEditando.value) {
        await catalogosStore.actualizarTipoCaso(tipoCasoEditando.value.id, payload);
      } else {
        await catalogosStore.crearTipoCaso(payload);
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'No fue posible guardar el tipo de caso.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  function cambiarEstado(item: TipoCasoMaestro): void {
    void catalogosStore.alternarEstadoTipoCaso(item.id);
  }

  return {
    busqueda,
    naturalezasFiltro,
    modalAbierto,
    guardando,
    errorFormulario,
    tipoCasoEditando,
    tiposCasoFiltrados,
    limpiarFiltros,
    abrirModalCrear,
    abrirModalEditar,
    guardarTipoCaso,
    cambiarEstado,
  };
}

