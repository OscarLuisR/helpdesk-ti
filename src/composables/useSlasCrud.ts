import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import type { ConfiguracionSla, PayloadConfiguracionSla } from '@/models/catalogos';
import { useCatalogosStore } from '@/stores/catalogosStore';

export const COLUMNAS_SLAS: QTableColumn<ConfiguracionSla>[] = [
  { name: 'prioridad', label: 'Prioridad', field: 'prioridad', align: 'left' },
  { name: 'criterio', label: 'Criterio (Impacto × Urgencia)', field: 'criterio', align: 'left' },
  { name: 'metaAsignacion', label: 'Meta Asignación', field: 'minutosMetaAsignacion', align: 'left' },
  { name: 'metaResolucion', label: 'Meta Resolución Efectiva', field: 'horasResolucionMax', align: 'left' },
  { name: 'suplencia', label: 'Suplencia Mesa Técnica', field: 'activaSuplenciaMesa', align: 'left' },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
];

export function formatearMinutos(min: number): string {
  if (min < 60) return `Máx. ${min} min`;
  const horas = Math.round((min / 60) * 10) / 10;
  return `Máx. ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
}

export function useSlasCrud() {
  const catalogosStore = useCatalogosStore();

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const slaEditando = ref<ConfiguracionSla | null>(null);

  onMounted(() => {
    void catalogosStore.cargarSlas();
  });

  const slas = computed<ConfiguracionSla[]>(() => catalogosStore.slas);

  function abrirModalEditar(sla: ConfiguracionSla): void {
    slaEditando.value = { ...sla };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarSla(payload: PayloadConfiguracionSla): Promise<boolean> {
    if (guardando.value || !slaEditando.value) return false;
    errorFormulario.value = null;
    guardando.value = true;

    try {
      await catalogosStore.actualizarSla(slaEditando.value.id, payload);
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'No fue posible actualizar el nivel de servicio.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    slas,
    modalAbierto,
    guardando,
    errorFormulario,
    slaEditando,
    abrirModalEditar,
    guardarSla,
  };
}

