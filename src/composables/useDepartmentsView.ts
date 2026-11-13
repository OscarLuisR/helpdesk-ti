import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { opcionesCambioEstado, useConfirmacion } from '@/composables/useConfirmacion';
import {
  useDepartmentsStore,
  type Department,
  type DepartmentFormPayload,
  type EstadoDepartamento,
} from '@/stores/useDepartmentsStore';
import {
  useTipoDepartamentosStore,
  type TipoDepartamentoItem,
} from '@/stores/useTipoDepartamentosStore';

export const COLUMNAS_DEPARTAMENTOS: QTableColumn<Department>[] = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  {
    name: 'responsable',
    label: 'Responsable',
    field: (row) => row.responsable ?? 'Sin asignar',
    align: 'left',
    sortable: true,
  },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  {
    name: 'tipo',
    label: 'Tipo',
    field: 'tipo_departamento',
    align: 'left',
    sortable: true,
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionFiltroTipo {
  valor: number | 'TODOS';
  etiqueta: string;
}

export function useDepartmentsView() {
  const $q = useQuasar();
  const store = useDepartmentsStore();
  const tipoDepartamentosStore = useTipoDepartamentosStore();
  const {
    confirmacionAbierta,
    confirmacionOpciones,
    solicitarConfirmacion,
    responderConfirmacion,
  } = useConfirmacion();

  const busqueda = ref('');
  const filtroTipo = ref<number | 'TODOS'>('TODOS');
  const filtroEstado = ref<string>('Todos');

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
  const departamentoEditando = ref<Department | null>(null);

  const cargando = computed(() => store.cargando);
  const tiposDepartamento = computed<TipoDepartamentoItem[]>(
    () => tipoDepartamentosStore.tiposDepartamento,
  );

  const opcionesFiltroTipo = computed<OpcionFiltroTipo[]>(() => [
    { valor: 'TODOS', etiqueta: 'Todos los tipos' },
    ...tipoDepartamentosStore.tiposDepartamento.map((t) => ({
      valor: t.id,
      etiqueta: t.nombre,
    })),
  ]);

  const departamentosFiltrados = computed(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return store.departments.filter((d) => {
      const matchEstado =
        filtroEstado.value === 'Todos' || d.estado === (filtroEstado.value as EstadoDepartamento);

      const matchTipo =
        filtroTipo.value === 'TODOS' || d.id_tipo_departamento === filtroTipo.value;

      const matchBusqueda =
        !q ||
        [
          d.codigo,
          d.nombre,
          d.responsable ?? '',
          d.telefono,
          d.ubicacion,
          d.tipo_departamento,
        ].some((txt) => txt.toLowerCase().includes(q));

      return matchEstado && matchTipo && matchBusqueda;
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(departamentosFiltrados.value.length / filasPorPagina)),
  );

  const textoMostrando = computed(() => {
    const total = departamentosFiltrados.value.length;
    if (total === 0) return '0 departamentos';
    const inicio = (paginaActual.value - 1) * filasPorPagina + 1;
    const fin = Math.min(inicio + filasPorPagina - 1, total);
    return `Mostrando ${inicio}-${fin} de ${total} departamentos`;
  });

  watch([busqueda, filtroTipo, filtroEstado], () => {
    paginaActual.value = 1;
  });

  watch(totalPaginas, (nuevoMax) => {
    if (paginaActual.value > nuevoMax) {
      paginaActual.value = nuevoMax;
    }
  });

  onMounted(async () => {
    try {
      await Promise.all([
        store.cargarDepartamentos(),
        tipoDepartamentosStore.cargarTiposDepartamento(),
      ]);
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No fue posible cargar los departamentos.',
        timeout: 3000,
      });
    }
  });

  function abrirModalCrear(): void {
    departamentoEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(depto: Department): void {
    departamentoEditando.value = { ...depto };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarDepartamento(payload: DepartmentFormPayload): Promise<boolean> {
    if (guardando.value) return false;
    guardando.value = true;
    errorFormulario.value = null;

    try {
      if (departamentoEditando.value) {
        await store.actualizarDepartamento(departamentoEditando.value.id, payload);
        $q.notify({ type: 'positive', message: 'Departamento actualizado con éxito.', timeout: 2500 });
      } else {
        await store.agregarDepartamento(payload);
        $q.notify({ type: 'positive', message: 'Departamento creado con éxito.', timeout: 2500 });
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'Error inesperado al guardar el departamento.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function alternarEstado(depto: Department): Promise<void> {
    const confirmado = await solicitarConfirmacion(
      opcionesCambioEstado('el departamento', `${depto.codigo} — ${depto.nombre}`, depto.is_activo),
    );
    if (!confirmado) return;

    try {
      const res = await store.alternarEstado(depto.id);
      $q.notify({
        type: 'info',
        message: `Departamento ${depto.codigo} ahora está ${res.estado}.`,
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
    tiposDepartamento,
    opcionesFiltroTipo,
    busqueda,
    filtroTipo,
    filtroEstado,
    paginacion,
    paginaActual,
    totalPaginas,
    departamentosFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    departamentoEditando,
    confirmacionAbierta,
    confirmacionOpciones,
    responderConfirmacion,
    abrirModalCrear,
    abrirModalEditar,
    guardarDepartamento,
    alternarEstado,
  };
}
