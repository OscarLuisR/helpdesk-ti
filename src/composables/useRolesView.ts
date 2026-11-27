import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { opcionesCambioEstado, useConfirmacion } from '@/composables/useConfirmacion';
import {
  useRolesStore,
  type EstadoRol,
  type RolFormPayload,
  type RolItem,
} from '@/stores/useRolesStore';

// 🛡️ [FASE 3 - UI ROLES] Anchos fijos (100%) para evitar scroll horizontal
export const COLUMNAS_ROLES: QTableColumn<RolItem>[] = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true,
    style: 'width: 7%;',
    headerStyle: 'width: 7%;',
  },
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left',
    sortable: true,
    style: 'width: 20%;',
    headerStyle: 'width: 20%;',
  },
  {
    name: 'nombre',
    label: 'Nombre del Rol',
    field: 'nombre',
    align: 'left',
    sortable: true,
    style: 'width: 49%;',
    headerStyle: 'width: 49%;',
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'left',
    sortable: true,
    style: 'width: 12%;',
    headerStyle: 'width: 12%;',
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'right',
    style: 'width: 12%;',
    headerStyle: 'width: 12%;',
  },
];

export const OPCIONES_FILAS_POR_PAGINA_ROLES: number[] = [3, 5, 10, 15, 20];

export const OPCIONES_FILTRO_ESTADO_ROL: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

const CHIP_POR_CODIGO: Record<string, string> = {
  ADMINISTRADOR: 'brand',
  MESA_TECNICA: 'info',
  GERENTE_AREA: 'warn',
  DIRECTOR: 'warn',
  TECNICO: 'ok',
};

export function rolCodigoChipClass(codigo: string): string {
  return CHIP_POR_CODIGO[codigo.trim().toUpperCase()] ?? 'brand';
}

export function useRolesView() {
  const $q = useQuasar();
  const store = useRolesStore();
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
  const cambiandoEstadoId = ref<number | null>(null);
  const errorFormulario = ref<string | null>(null);
  const rolEditando = ref<RolItem | null>(null);

  const cargando = computed(() => store.cargando);
  const errorCarga = computed(() => store.errorCarga);

  const rolesFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return store.roles.filter((r) => {
      const matchEstado =
        filtroEstado.value === 'Todos' || r.estado === (filtroEstado.value as EstadoRol);

      const matchBusqueda =
        !q || [String(r.id), r.codigo, r.nombre].some((txt) => txt.toLowerCase().includes(q));

      return matchEstado && matchBusqueda;
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(rolesFiltrados.value.length / filasPorPagina.value)),
  );

  const textoMostrando = computed(() => {
    const total = rolesFiltrados.value.length;
    if (total === 0) return 'Mostrando 0 de 0 roles';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
    return `Mostrando ${inicio}–${fin} de ${total} roles`;
  });

  watch([busqueda, filtroEstado], () => {
    paginaActual.value = 1;
  });

  watch(totalPaginas, (nuevoMax) => {
    if (paginaActual.value > nuevoMax) {
      paginaActual.value = nuevoMax;
    }
  });

  async function recargarRoles(): Promise<void> {
    try {
      await store.cargarRoles();
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No fue posible cargar los roles.',
        timeout: 3000,
      });
    }
  }

  onMounted(() => {
    void recargarRoles();
  });

  function abrirModalCrear(): void {
    rolEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(rol: RolItem): void {
    rolEditando.value = { ...rol };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarRol(payload: RolFormPayload): Promise<boolean> {
    if (guardando.value) return false;
    guardando.value = true;
    errorFormulario.value = null;

    try {
      if (rolEditando.value) {
        await store.actualizarRol(rolEditando.value.id, payload);
        $q.notify({
          type: 'positive',
          message: 'Rol actualizado con éxito.',
          timeout: 2500,
        });
      } else {
        await store.crearRol(payload);
        $q.notify({
          type: 'positive',
          message: 'Rol creado con éxito.',
          timeout: 2500,
        });
      }
      modalAbierto.value = false;
      return true;
    } catch (err: unknown) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'Error inesperado al guardar el rol.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function alternarEstado(rol: RolItem): Promise<void> {
    if (cambiandoEstadoId.value !== null) return;
    const confirmado = await solicitarConfirmacion(
      opcionesCambioEstado('el rol', rol.nombre, rol.is_activo),
    );
    if (!confirmado) return;

    cambiandoEstadoId.value = rol.id;
    try {
      const nuevoEstado = await store.alternarEstadoRol(rol);
      $q.notify({
        type: 'info',
        message: `Rol ${rol.nombre} ahora está ${nuevoEstado}.`,
        timeout: 2200,
      });
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo cambiar el estado del rol.',
        timeout: 2800,
      });
    } finally {
      cambiandoEstadoId.value = null;
    }
  }

  return {
    cargando,
    errorCarga,
    busqueda,
    filtroEstado,
    paginacion,
    filasPorPagina,
    paginaActual,
    totalPaginas,
    rolesFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    cambiandoEstadoId,
    errorFormulario,
    rolEditando,
    confirmacionAbierta,
    confirmacionOpciones,
    responderConfirmacion,
    recargarRoles,
    abrirModalCrear,
    abrirModalEditar,
    guardarRol,
    alternarEstado,
  };
}
