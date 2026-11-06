import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  useDepartmentsStore,
  type Department,
  type DepartmentFormPayload,
  type EstadoDepartamento,
} from '@/stores/useDepartmentsStore';

export const COLUMNAS_DEPARTAMENTOS: QTableColumn<Department>[] = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'responsable', label: 'Responsable', field: 'responsable', align: 'left', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: (row) => (row.esSubgerenciaTI ? 'Sub-Gerencia TI' : 'Usuario'), align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionFiltroTipo {
  valor: 'TODOS' | 'TI' | 'USUARIO';
  etiqueta: string;
}

export const OPCIONES_FILTRO_TIPO: readonly OpcionFiltroTipo[] = [
  { valor: 'TODOS', etiqueta: 'Todos los tipos' },
  { valor: 'TI', etiqueta: 'Sub-Gerencia TI' },
  { valor: 'USUARIO', etiqueta: 'Áreas Usuarias' },
];

export function useDepartmentsView() {
  const $q = useQuasar();
  const store = useDepartmentsStore();

  const busqueda = ref('');
  const filtroTipo = ref<'TODOS' | 'TI' | 'USUARIO'>('TODOS');
  const filtroEstado = ref<string>('Todos');

  const paginaActual = ref(1);
  const filasPorPagina = ref(6);

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const departamentoEditando = ref<Department | null>(null);

  const departamentosFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return store.departments.filter((d) => {
      const matchEstado =
        filtroEstado.value === 'Todos' || d.estado === (filtroEstado.value as EstadoDepartamento);

      const matchTipo =
        filtroTipo.value === 'TODOS' ||
        (filtroTipo.value === 'TI' && d.esSubgerenciaTI) ||
        (filtroTipo.value === 'USUARIO' && !d.esSubgerenciaTI);

      const matchBusqueda =
        !q ||
        [d.codigo, d.nombre, d.responsable, d.telefono, d.ubicacion ?? ''].some((txt) =>
          txt.toLowerCase().includes(q),
        );

      return matchEstado && matchTipo && matchBusqueda;
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(departamentosFiltrados.value.length / filasPorPagina.value)),
  );

  const departamentosPaginados = computed(() => {
    const inicio = (paginaActual.value - 1) * filasPorPagina.value;
    return departamentosFiltrados.value.slice(inicio, inicio + filasPorPagina.value);
  });

  const textoMostrando = computed(() => {
    const total = departamentosFiltrados.value.length;
    if (total === 0) return '0 departamentos';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(inicio + filasPorPagina.value - 1, total);
    return `Mostrando ${inicio}-${fin} de ${total} departamentos`;
  });

  watch([busqueda, filtroTipo, filtroEstado], () => {
    paginaActual.value = 1;
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
    busqueda,
    filtroTipo,
    filtroEstado,
    paginaActual,
    filasPorPagina,
    totalPaginas,
    departamentosPaginados,
    departamentosFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    departamentoEditando,
    abrirModalCrear,
    abrirModalEditar,
    guardarDepartamento,
    alternarEstado,
  };
}

