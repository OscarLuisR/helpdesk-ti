import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import {
  useTipoDepartamentosStore,
  type TipoDepartamentoFormPayload,
  type TipoDepartamentoItem,
} from '@/stores/useTipoDepartamentosStore';

export const COLUMNAS_TIPO_DEPARTAMENTOS: QTableColumn<TipoDepartamentoItem>[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre del Tipo', field: 'nombre', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export function useTipoDepartamentosView() {
  const $q = useQuasar();
  const store = useTipoDepartamentosStore();

  const busqueda = ref('');
  const filasPorPagina = 6;
  const paginacion = ref<NonNullable<QTableProps['pagination']>>({
    sortBy: null,
    descending: false,
    page: 1,
    rowsPerPage: filasPorPagina,
  });

  const paginaActual = computed({
    get: () => paginacion.value.page ?? 1,
    set: (val: number) => {
      paginacion.value = { ...paginacion.value, page: val };
    },
  });

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const tipoEditando = ref<TipoDepartamentoItem | null>(null);

  const cargando = computed(() => store.cargando);

  const tiposFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return store.tiposDepartamento.filter((t) => {
      return !q || [String(t.id), t.nombre].some((txt) => txt.toLowerCase().includes(q));
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(tiposFiltrados.value.length / filasPorPagina)),
  );

  const textoMostrando = computed(() => {
    const total = tiposFiltrados.value.length;
    if (total === 0) return '0 tipos de departamento';
    const inicio = (paginaActual.value - 1) * filasPorPagina + 1;
    const fin = Math.min(inicio + filasPorPagina - 1, total);
    return `Mostrando ${inicio}-${fin} de ${total} tipos de departamento`;
  });

  watch(busqueda, () => {
    paginaActual.value = 1;
  });

  watch(totalPaginas, (nuevoMax) => {
    if (paginaActual.value > nuevoMax) {
      paginaActual.value = nuevoMax;
    }
  });

  async function recargarTipos(): Promise<void> {
    try {
      await store.cargarTiposDepartamento();
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message:
          err instanceof Error ? err.message : 'No fue posible cargar los tipos de departamento.',
        timeout: 3000,
      });
    }
  }

  onMounted(() => {
    void recargarTipos();
  });

  function abrirModalCrear(): void {
    tipoEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(tipo: TipoDepartamentoItem): void {
    tipoEditando.value = { ...tipo };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarTipoDepartamento(
    payload: TipoDepartamentoFormPayload,
  ): Promise<boolean> {
    if (guardando.value) return false;
    guardando.value = true;
    errorFormulario.value = null;

    try {
      if (tipoEditando.value) {
        await store.actualizarTipoDepartamento(tipoEditando.value.id, payload);
        $q.notify({
          type: 'positive',
          message: 'Tipo de departamento actualizado con éxito.',
          timeout: 2500,
        });
      } else {
        await store.crearTipoDepartamento(payload);
        $q.notify({
          type: 'positive',
          message: 'Tipo de departamento creado con éxito.',
          timeout: 2500,
        });
      }
      modalAbierto.value = false;
      return true;
    } catch (err: unknown) {
      errorFormulario.value =
        err instanceof Error
          ? err.message
          : 'Error inesperado al guardar el tipo de departamento.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    cargando,
    busqueda,
    paginacion,
    paginaActual,
    totalPaginas,
    tiposFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    tipoEditando,
    recargarTipos,
    abrirModalCrear,
    abrirModalEditar,
    guardarTipoDepartamento,
  };
}
