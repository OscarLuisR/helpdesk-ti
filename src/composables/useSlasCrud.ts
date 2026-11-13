import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { opcionesCambioEstado, useConfirmacion } from '@/composables/useConfirmacion';
import {
  usePrioridadesStore,
  type PrioridadFormPayload,
  type PrioridadItem,
} from '@/stores/usePrioridadesStore';

export const COLUMNAS_SLAS: QTableColumn<PrioridadItem>[] = [
  { name: 'prioridad', label: 'Prioridad', field: 'nombre', align: 'left', sortable: true },
  {
    name: 'criterio',
    label: 'Criterio (Impacto × Urgencia)',
    field: (row) => row.descripcion_criterio ?? '',
    align: 'left',
  },
  {
    name: 'metaAsignacion',
    label: 'Meta Asignación',
    field: 'tiempo_max_asignacion_minutos',
    align: 'left',
    sortable: true,
  },
  {
    name: 'metaResolucion',
    label: 'Meta Resolución',
    field: 'tiempo_meta_resolucion_horas',
    align: 'left',
    sortable: true,
  },
  {
    name: 'suplencia',
    label: 'Suplencia Mesa Técnica',
    field: 'activa_suplencia',
    align: 'left',
    sortable: true,
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export function claseChipPrioridad(nombre: string): string {
  const norm = nombre
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (norm === 'CRITICA' || norm === 'URGENTE') return 'bad';
  if (norm === 'ALTA') return 'warn';
  if (norm === 'MEDIA') return 'info';
  if (norm === 'BAJA') return 'ok';
  return 'brand';
}

export function formatearMinutos(min: number): string {
  if (min < 60) return `Máx. ${min} min`;
  const horas = Math.round((min / 60) * 10) / 10;
  return `Máx. ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
}

export function formatearHoras(horas: number): string {
  return `${horas} ${horas === 1 ? 'hora laboral' : 'horas laborales'}`;
}

export function useSlasCrud() {
  const $q = useQuasar();
  const prioridadesStore = usePrioridadesStore();
  const {
    confirmacionAbierta,
    confirmacionOpciones,
    solicitarConfirmacion,
    responderConfirmacion,
  } = useConfirmacion();

  const busqueda = ref('');
  const filtroEstado = ref<string>('Todos');
  const paginacion = ref<NonNullable<QTableProps['pagination']>>({
    sortBy: null,
    descending: false,
    page: 1,
    rowsPerPage: 0,
  });

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const slaEditando = ref<PrioridadItem | null>(null);

  const cargando = computed(() => prioridadesStore.cargando);

  const slas = computed<PrioridadItem[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return prioridadesStore.prioridades.filter((p) => {
      const matchEstado = filtroEstado.value === 'Todos' || p.estado === filtroEstado.value;
      const matchTexto =
        !q ||
        [p.nombre, p.descripcion_criterio ?? '', p.ejemplos_falla ?? ''].some((txt) =>
          txt.toLowerCase().includes(q),
        );
      return matchEstado && matchTexto;
    });
  });

  onMounted(async () => {
    try {
      await prioridadesStore.cargarPrioridades();
    } catch (err) {
      $q.notify({
        type: 'negative',
        message:
          err instanceof Error
            ? err.message
            : 'No fue posible cargar la configuración de prioridades.',
        timeout: 3000,
      });
    }
  });

  function abrirModalCrear(): void {
    slaEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(sla: PrioridadItem): void {
    slaEditando.value = { ...sla };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarSla(payload: PrioridadFormPayload): Promise<boolean> {
    if (guardando.value) return false;
    errorFormulario.value = null;
    guardando.value = true;

    try {
      if (slaEditando.value) {
        await prioridadesStore.actualizarPrioridad(slaEditando.value.id, payload);
        $q.notify({
          type: 'positive',
          message: 'Prioridad SLA actualizada con éxito.',
          timeout: 2500,
        });
      } else {
        await prioridadesStore.crearPrioridad(payload);
        $q.notify({
          type: 'positive',
          message: 'Prioridad SLA creada con éxito.',
          timeout: 2500,
        });
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'No fue posible guardar la prioridad SLA.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function alternarEstado(sla: PrioridadItem): Promise<void> {
    const confirmado = await solicitarConfirmacion(
      opcionesCambioEstado('la prioridad', sla.nombre, sla.is_activo),
    );
    if (!confirmado) return;

    try {
      const nuevoEstado = await prioridadesStore.alternarEstadoPrioridad(sla);
      $q.notify({
        type: 'info',
        message: `Prioridad "${sla.nombre}" ahora está ${nuevoEstado}.`,
        timeout: 2000,
      });
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo cambiar el estado.',
        timeout: 2500,
      });
    }
  }

  return {
    cargando,
    busqueda,
    filtroEstado,
    paginacion,
    slas,
    modalAbierto,
    guardando,
    errorFormulario,
    slaEditando,
    confirmacionAbierta,
    confirmacionOpciones,
    responderConfirmacion,
    abrirModalCrear,
    abrirModalEditar,
    guardarSla,
    alternarEstado,
  };
}
