import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  useCatalogStore,
  type EstadoServicio,
  type NaturalezaTrabajo,
  type PrioridadSugerida,
  type ServiceCatalog,
  type ServiceCatalogPayload,
  type SubgerenciaDestino,
  OPCIONES_NATURALEZA,
  OPCIONES_SUBGERENCIA,
} from '@/stores/useCatalogStore';

export const COLUMNAS_CATALOGO: QTableColumn<ServiceCatalog>[] = [
  { name: 'nombre', label: 'Nombre del Servicio / Falla', field: 'nombre', align: 'left', sortable: true },
  { name: 'naturaleza', label: 'Naturaleza', field: 'naturaleza', align: 'left', sortable: true },
  { name: 'subgerenciaDestino', label: 'Sub-Gerencia Asignada', field: 'subgerenciaDestino', align: 'left', sortable: true },
  { name: 'prioridadSugerida', label: 'Prioridad Sugerida', field: 'prioridadSugerida', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const NATURALEZA_CHIP_CLASS: Record<NaturalezaTrabajo, string> = {
  'Incidencia': 'bad',
  'Requerimiento de Servicio': 'info',
  'Desarrollo / Evolutivo': 'brand',
  'Actividad Interna / Preventiva': 'neutral',
};

export const PRIORIDAD_CHIP_CLASS: Record<PrioridadSugerida, string> = {
  'Crítica': 'bad',
  'Alta': 'warn',
  'Media': 'info',
  'Baja': 'ok',
};

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionSelect<T> {
  valor: 'TODAS' | T;
  etiqueta: string;
}

export const OPCIONES_FILTRO_NATURALEZA: readonly OpcionSelect<NaturalezaTrabajo>[] = [
  { valor: 'TODAS', etiqueta: 'Todas las naturalezas' },
  ...OPCIONES_NATURALEZA.map((n) => ({ valor: n, etiqueta: n })),
];

export const OPCIONES_FILTRO_SUBGERENCIA: readonly OpcionSelect<SubgerenciaDestino>[] = [
  { valor: 'TODAS', etiqueta: 'Todas las sub-gerencias' },
  ...OPCIONES_SUBGERENCIA.map((s) => ({ valor: s, etiqueta: s })),
];

export function useCatalogView() {
  const $q = useQuasar();
  const store = useCatalogStore();

  const busqueda = ref('');
  const filtroNaturaleza = ref<'TODAS' | NaturalezaTrabajo>('TODAS');
  const filtroSubgerencia = ref<'TODAS' | SubgerenciaDestino>('TODAS');
  const filtroEstado = ref<string>('Todos');

  const paginaActual = ref(1);
  const filasPorPagina = ref(6);

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const servicioEditando = ref<ServiceCatalog | null>(null);

  const serviciosFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return store.services.filter((s) => {
      const matchEstado =
        filtroEstado.value === 'Todos' || s.estado === (filtroEstado.value as EstadoServicio);
      const matchNat =
        filtroNaturaleza.value === 'TODAS' || s.naturaleza === filtroNaturaleza.value;
      const matchSub =
        filtroSubgerencia.value === 'TODAS' || s.subgerenciaDestino === filtroSubgerencia.value;
      const matchText =
        !q ||
        [s.nombre, s.naturaleza, s.subgerenciaDestino, s.prioridadSugerida].some((txt) =>
          txt.toLowerCase().includes(q),
        );
      return matchEstado && matchNat && matchSub && matchText;
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(serviciosFiltrados.value.length / filasPorPagina.value)),
  );

  const serviciosPaginados = computed(() => {
    const inicio = (paginaActual.value - 1) * filasPorPagina.value;
    return serviciosFiltrados.value.slice(inicio, inicio + filasPorPagina.value);
  });

  const textoMostrando = computed(() => {
    const total = serviciosFiltrados.value.length;
    if (total === 0) return '0 servicios';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(inicio + filasPorPagina.value - 1, total);
    return `Mostrando ${inicio}-${fin} de ${total} servicios`;
  });

  watch([busqueda, filtroNaturaleza, filtroSubgerencia, filtroEstado], () => {
    paginaActual.value = 1;
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
    try {
      const res = await store.alternarEstado(servicio.id);
      $q.notify({
        type: 'info',
        message: `Servicio ahora está ${res.estado}.`,
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
    busqueda,
    filtroNaturaleza,
    filtroSubgerencia,
    filtroEstado,
    paginaActual,
    filasPorPagina,
    totalPaginas,
    serviciosPaginados,
    serviciosFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    servicioEditando,
    abrirModalCrear,
    abrirModalEditar,
    guardarServicio,
    alternarEstado,
  };
}

