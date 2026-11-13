import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { opcionesCambioEstado, useConfirmacion } from '@/composables/useConfirmacion';
import { claseChipPrioridad } from '@/composables/useSlasCrud';
import {
  useCatalogStore,
  type EstadoServicio,
  type ServiceCatalog,
  type ServiceCatalogPayload,
} from '@/stores/useCatalogStore';
import { useDepartmentsStore, type Department } from '@/stores/useDepartmentsStore';
import { usePrioridadesStore, type PrioridadItem } from '@/stores/usePrioridadesStore';

export const COLUMNAS_CATALOGO: QTableColumn<ServiceCatalog>[] = [
  { name: 'nombre', label: 'Nombre del Servicio / Incidencia', field: 'nombre', align: 'left', sortable: true },
  { name: 'departamento', label: 'Departamento Asignado', field: 'departamento', align: 'left', sortable: true },
  { name: 'prioridad', label: 'Prioridad', field: 'prioridad', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionSelectCatalogo {
  valor: number | 'TODAS';
  etiqueta: string;
}

export { claseChipPrioridad };

export function useCatalogView() {
  const $q = useQuasar();
  const store = useCatalogStore();
  const departmentsStore = useDepartmentsStore();
  const prioridadesStore = usePrioridadesStore();
  const {
    confirmacionAbierta,
    confirmacionOpciones,
    solicitarConfirmacion,
    responderConfirmacion,
  } = useConfirmacion();

  const busqueda = ref('');
  const filtroDepartamento = ref<number | 'TODAS'>('TODAS');
  const filtroPrioridad = ref<number | 'TODAS'>('TODAS');
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
  const servicioEditando = ref<ServiceCatalog | null>(null);

  const cargando = computed(() => store.cargando);
  const departamentosCatalogo = computed<Department[]>(() => departmentsStore.departments);
  const prioridadesCatalogo = computed<PrioridadItem[]>(() => prioridadesStore.prioridades);

  const opcionesFiltroDepartamento = computed<OpcionSelectCatalogo[]>(() => [
    { valor: 'TODAS', etiqueta: 'Todos los departamentos' },
    ...departmentsStore.departments.map((d) => ({
      valor: d.id,
      etiqueta: `${d.codigo} — ${d.nombre}`,
    })),
  ]);

  const opcionesFiltroPrioridad = computed<OpcionSelectCatalogo[]>(() => [
    { valor: 'TODAS', etiqueta: 'Todas las prioridades' },
    ...prioridadesStore.prioridades.map((p) => ({
      valor: p.id,
      etiqueta: p.nombre,
    })),
  ]);

  const serviciosFiltrados = computed(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return store.services.filter((s) => {
      const matchEstado =
        filtroEstado.value === 'Todos' || s.estado === (filtroEstado.value as EstadoServicio);
      const matchDepto =
        filtroDepartamento.value === 'TODAS' || s.id_departamento === filtroDepartamento.value;
      const matchPrioridad =
        filtroPrioridad.value === 'TODAS' || s.id_prioridad === filtroPrioridad.value;
      const matchText =
        !q ||
        [s.nombre, s.departamento, s.codigo_departamento, s.prioridad].some((txt) =>
          txt.toLowerCase().includes(q),
        );
      return matchEstado && matchDepto && matchPrioridad && matchText;
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(serviciosFiltrados.value.length / filasPorPagina)),
  );

  const textoMostrando = computed(() => {
    const total = serviciosFiltrados.value.length;
    if (total === 0) return '0 servicios';
    const inicio = (paginaActual.value - 1) * filasPorPagina + 1;
    const fin = Math.min(inicio + filasPorPagina - 1, total);
    return `Mostrando ${inicio}-${fin} de ${total} servicios`;
  });

  watch([busqueda, filtroDepartamento, filtroPrioridad, filtroEstado], () => {
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
        store.cargarCatalogo(),
        departmentsStore.cargarDepartamentos(),
        prioridadesStore.cargarPrioridades(),
      ]);
    } catch (err) {
      $q.notify({
        type: 'negative',
        message:
          err instanceof Error
            ? err.message
            : 'No fue posible cargar el catálogo de incidencias.',
        timeout: 3000,
      });
    }
  });

  function abrirModalCrear(): void {
    servicioEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(servicio: ServiceCatalog): void {
    servicioEditando.value = { ...servicio };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarServicio(payload: ServiceCatalogPayload): Promise<boolean> {
    if (guardando.value) return false;
    guardando.value = true;
    errorFormulario.value = null;
    try {
      if (servicioEditando.value) {
        await store.actualizarServicio(servicioEditando.value.id, payload);
        $q.notify({ type: 'positive', message: 'Servicio actualizado correctamente.', timeout: 2500 });
      } else {
        await store.agregarServicio(payload);
        $q.notify({ type: 'positive', message: 'Servicio registrado con éxito.', timeout: 2500 });
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'Error al guardar el servicio.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function alternarEstado(servicio: ServiceCatalog): Promise<void> {
    const confirmado = await solicitarConfirmacion(
      opcionesCambioEstado('el servicio', servicio.nombre, servicio.is_activo),
    );
    if (!confirmado) return;

    try {
      const nuevoEstado = await store.alternarEstado(servicio);
      $q.notify({
        type: 'info',
        message: `Servicio "${servicio.nombre}" ahora está ${nuevoEstado}.`,
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
    departamentosCatalogo,
    prioridadesCatalogo,
    opcionesFiltroDepartamento,
    opcionesFiltroPrioridad,
    busqueda,
    filtroDepartamento,
    filtroPrioridad,
    filtroEstado,
    paginacion,
    paginaActual,
    totalPaginas,
    serviciosFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    servicioEditando,
    confirmacionAbierta,
    confirmacionOpciones,
    responderConfirmacion,
    abrirModalCrear,
    abrirModalEditar,
    guardarServicio,
    alternarEstado,
  };
}
