import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
import { ordenarPorTexto } from '@/utils/ordenarOpciones';

// 🛡️ [FASE 3 - UI DEPARTAMENTOS] Anchos fijos (100%) para evitar scroll horizontal en escritorio y laptop 960px
export const COLUMNAS_DEPARTAMENTOS: QTableColumn<Department>[] = [
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true,
    style: 'width: 24%;',
    headerStyle: 'width: 24%;',
  },
  {
    name: 'responsable',
    label: 'Responsable',
    field: (row) => row.responsable ?? 'Sin asignar',
    align: 'left',
    sortable: true,
    style: 'width: 18%;',
    headerStyle: 'width: 18%;',
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left',
    style: 'width: 13%;',
    headerStyle: 'width: 13%;',
  },
  {
    name: 'tipo',
    label: 'Tipo',
    field: 'tipo_departamento',
    align: 'left',
    sortable: true,
    style: 'width: 15%;',
    headerStyle: 'width: 15%;',
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'left',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'right',
    style: 'width: 11%;',
    headerStyle: 'width: 11%;',
  },
];

export const OPCIONES_FILAS_POR_PAGINA_DEPARTAMENTOS: number[] = [3, 5, 10, 15, 20];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionFiltroTipo {
  valor: number | 'TODOS';
  etiqueta: string;
}

export function useDepartmentsView() {
  const $q = useQuasar();
  const route = useRoute();
  const router = useRouter();
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

  function aplicarQueryFiltros(): void {
    const rawTipo = Array.isArray(route.query.tipo) ? route.query.tipo[0] : route.query.tipo;
    if (rawTipo !== undefined && rawTipo !== null && rawTipo !== '') {
      const idNum = Number(rawTipo);
      if (Number.isInteger(idNum) && idNum > 0) {
        filtroTipo.value = idNum;
      }
    }

    const rawQ = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q;
    if (typeof rawQ === 'string' && rawQ.trim().length > 0) {
      busqueda.value = rawQ.trim();
    }
  }

  aplicarQueryFiltros();

  watch(
    () => [route.query.tipo, route.query.q],
    () => {
      aplicarQueryFiltros();
    },
  );

  const paginacion = ref<NonNullable<QTableProps['pagination']>>({
    sortBy: null,
    descending: false,
    page: 1,
    rowsPerPage: 5,
  });

  const filasPorPagina = computed({
    get: () => paginacion.value.rowsPerPage ?? 5,
    set: (val: number) => {
      paginacion.value = { ...paginacion.value, rowsPerPage: val, page: 1 };
    },
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

  // 🛡️ [FASE 3 - UI COMBOS] Tipos ordenados A-Z preservando "Todos los tipos" arriba
  const opcionesFiltroTipo = computed<OpcionFiltroTipo[]>(() => [
    { valor: 'TODOS', etiqueta: 'Todos los tipos' },
    ...ordenarPorTexto(
      tipoDepartamentosStore.tiposDepartamento.map((t) => ({
        valor: t.id,
        etiqueta: t.nombre,
      })),
      (op) => op.etiqueta,
    ),
  ]);

  const tipoFiltroActivo = computed<TipoDepartamentoItem | null>(() => {
    if (filtroTipo.value === 'TODOS') return null;
    return tipoDepartamentosStore.tiposDepartamento.find((t) => t.id === filtroTipo.value) ?? null;
  });

  function obtenerDescripcionTipo(idTipo: number): string {
    return tipoDepartamentosStore.tiposDepartamento.find((t) => t.id === idTipo)?.descripcion ?? '';
  }

  function filtrarPorTipo(idTipo: number | 'TODOS'): void {
    filtroTipo.value = idTipo;
    if (idTipo === 'TODOS' && (route.query.tipo || route.query.q)) {
      busqueda.value = '';
      void router.replace({ path: '/admin/departamentos' });
    }
  }

  function irATipoDepartamentos(): void {
    void router.push('/admin/tipo-departamentos');
  }

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
    Math.max(1, Math.ceil(departamentosFiltrados.value.length / filasPorPagina.value)),
  );

  const textoMostrando = computed(() => {
    const total = departamentosFiltrados.value.length;
    if (total === 0) return 'Mostrando 0 de 0 departamentos';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
    return `Mostrando ${inicio}–${fin} de ${total} departamentos`;
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
    tipoFiltroActivo,
    obtenerDescripcionTipo,
    filtrarPorTipo,
    irATipoDepartamentos,
    busqueda,
    filtroTipo,
    filtroEstado,
    paginacion,
    filasPorPagina,
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
