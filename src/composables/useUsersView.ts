import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { PATRON_NOMBRE_USUARIO } from '@/composables/useAuth';
import { opcionesCambioEstado, useConfirmacion } from '@/composables/useConfirmacion';
import { useDepartmentsStore, type Department } from '@/stores/useDepartmentsStore';
import { useRolesStore, type RolItem } from '@/stores/useRolesStore';
import {
  useUsersStore,
  type EstadoUsuario,
  type User,
  type UserFormPayload,
} from '@/stores/useUsersStore';

export const COLUMNAS_USUARIOS: QTableColumn<User>[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre_completo', align: 'left', sortable: true },
  { name: 'username', label: 'Usuario', field: 'nick', align: 'left', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'departamento', label: 'Departamento', field: 'departamento', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionFiltroRol {
  valor: number | 'TODOS';
  etiqueta: string;
}

const ROL_CHIP_CLASS: Record<string, string> = {
  ADMINISTRADOR: 'bad',
  GERENTE_GENERAL: 'brand',
  MESA_TECNICA: 'info',
  GERENTE_AREA: 'warn',
  TECNICO: 'neutral',
  USUARIO: 'ok',
};

export function claseChipRol(codigoRol: string): string {
  return ROL_CHIP_CLASS[codigoRol.trim().toUpperCase()] ?? 'neutral';
}

export function estadoChipClass(estado: EstadoUsuario): string {
  return estado === 'Activo' ? 'ok' : 'bad';
}

export function validarUsernameLogin(valor: string): true | string {
  const limpio = (valor ?? '').trim();
  if (!limpio) return 'Ingresa el nombre de usuario (login)';
  if (limpio.length > 25) return 'Máximo 25 caracteres';
  if (!PATRON_NOMBRE_USUARIO.test(limpio)) {
    return 'Solo letras, números, punto o guion (3 a 25 caracteres)';
  }
  return true;
}

export const PATRON_TELEFONO_USUARIO = /^\d{4}-\d{7}$/;

export function formatearTelefonoMask(valor: string): string {
  const soloDigitos = (valor ?? '').replace(/\D/g, '').slice(0, 11);
  if (soloDigitos.length <= 4) return soloDigitos;
  return `${soloDigitos.slice(0, 4)}-${soloDigitos.slice(4)}`;
}

export function validarTelefonoUsuario(valor: string): true | string {
  const limpio = (valor ?? '').trim();
  if (!limpio) return 'Ingresa el teléfono del usuario';
  if (!PATRON_TELEFONO_USUARIO.test(limpio)) {
    return 'Formato requerido: XXXX-XXXXXXX (ej. 0412-2964550)';
  }
  return true;
}

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmailUsuario(valor: string): true | string {
  const limpio = (valor ?? '').trim();
  if (!limpio) return true;
  if (limpio.length > 150) return 'Máximo 150 caracteres';
  if (!PATRON_EMAIL.test(limpio)) return 'Ingresa un correo electrónico válido';
  return true;
}

export function useUsersView() {
  const usersStore = useUsersStore();
  const rolesStore = useRolesStore();
  const departmentsStore = useDepartmentsStore();
  const $q = useQuasar();
  const {
    confirmacionAbierta,
    confirmacionOpciones,
    solicitarConfirmacion,
    responderConfirmacion,
  } = useConfirmacion();

  const busqueda = ref('');
  const filtroEstado = ref<string>('Todos');
  const filtroRol = ref<number | 'TODOS'>('TODOS');
  const filasPorPagina = 8;
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
  const usuarioEditando = ref<User | null>(null);

  const modalResetAbierto = ref(false);
  const guardandoReset = ref(false);
  const errorReset = ref<string | null>(null);
  const usuarioReset = ref<User | null>(null);

  const cargando = computed(() => usersStore.cargando);
  const rolesCatalogo = computed<RolItem[]>(() => rolesStore.roles);
  const departamentosCatalogo = computed<Department[]>(() => departmentsStore.departments);

  const opcionesFiltroRol = computed<OpcionFiltroRol[]>(() => [
    { valor: 'TODOS', etiqueta: 'Todos los roles' },
    ...rolesStore.roles.map((r) => ({ valor: r.id, etiqueta: r.nombre })),
  ]);

  const usuariosFiltrados = computed<User[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return usersStore.users.filter((u) => {
      const coincideEstado = filtroEstado.value === 'Todos' || u.estado === filtroEstado.value;
      const coincideRol = filtroRol.value === 'TODOS' || u.id_rol === filtroRol.value;
      const coincideTexto =
        !q ||
        [
          String(u.id),
          u.nombre_completo,
          u.nick,
          u.telefono,
          u.departamento,
          u.rol,
          u.email ?? '',
        ].some((c) => c.toLowerCase().includes(q));
      return coincideEstado && coincideRol && coincideTexto;
    });
  });

  watch([busqueda, filtroEstado, filtroRol], () => {
    paginaActual.value = 1;
  });

  onMounted(async () => {
    try {
      await Promise.all([
        usersStore.cargarUsuarios(),
        rolesStore.cargarRoles(),
        departmentsStore.cargarDepartamentos(),
      ]);
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No fue posible cargar los usuarios.',
        position: 'top-right',
        timeout: 3000,
      });
    }
  });

  const totalResultados = computed(() => usuariosFiltrados.value.length);

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(totalResultados.value / filasPorPagina)),
  );

  watch(totalPaginas, (nuevoMax) => {
    if (paginaActual.value > nuevoMax) {
      paginaActual.value = nuevoMax;
    }
  });

  const textoMostrando = computed(() => {
    if (totalResultados.value === 0) return 'Mostrando 0 de 0 resultados';
    const desde = (paginaActual.value - 1) * filasPorPagina + 1;
    const hasta = Math.min(paginaActual.value * filasPorPagina, totalResultados.value);
    return `Mostrando ${desde} a ${hasta} de ${totalResultados.value} resultados`;
  });

  function abrirModalCrear(): void {
    usuarioEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(usuario: User): void {
    usuarioEditando.value = { ...usuario };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarUsuario(payload: UserFormPayload): Promise<boolean> {
    if (guardando.value) return false;
    errorFormulario.value = null;
    guardando.value = true;

    try {
      if (usuarioEditando.value) {
        await usersStore.actualizarUsuario(usuarioEditando.value.id, payload);
        $q.notify({
          type: 'positive',
          message: 'Usuario actualizado correctamente.',
          position: 'top-right',
        });
      } else {
        await usersStore.agregarUsuario(payload);
        $q.notify({
          type: 'positive',
          message: 'Usuario creado correctamente (clave temporal inicial: 123456).',
          position: 'top-right',
        });
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'No fue posible guardar el usuario.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function alternarEstado(usuario: User): Promise<void> {
    const confirmado = await solicitarConfirmacion(
      opcionesCambioEstado(
        'el usuario',
        `${usuario.nombre_completo} (${usuario.nick})`,
        usuario.is_activo,
      ),
    );
    if (!confirmado) return;

    try {
      const nuevoEstado = await usersStore.alternarEstadoUsuario(usuario);
      const accion = nuevoEstado === 'Activo' ? 'activado' : 'desactivado';
      $q.notify({
        type: 'info',
        message: `Usuario ${usuario.nick} ${accion}.`,
        position: 'top-right',
      });
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo cambiar el estado del usuario.',
        position: 'top-right',
      });
    }
  }

  function abrirModalReset(usuario: User): void {
    usuarioReset.value = { ...usuario };
    errorReset.value = null;
    modalResetAbierto.value = true;
  }

  async function confirmarResetPassword(): Promise<boolean> {
    if (guardandoReset.value || !usuarioReset.value) return false;
    errorReset.value = null;
    guardandoReset.value = true;

    try {
      await usersStore.resetearPasswordUsuario(usuarioReset.value.id);
      $q.notify({
        type: 'positive',
        message: `Contraseña de ${usuarioReset.value.nick} restablecida a 123456.`,
        position: 'top-right',
      });
      modalResetAbierto.value = false;
      return true;
    } catch (err) {
      errorReset.value =
        err instanceof Error ? err.message : 'No fue posible restablecer la contraseña.';
      return false;
    } finally {
      guardandoReset.value = false;
    }
  }

  return {
    cargando,
    rolesCatalogo,
    departamentosCatalogo,
    opcionesFiltroRol,
    busqueda,
    filtroEstado,
    filtroRol,
    paginacion,
    paginaActual,
    totalPaginas,
    usuariosFiltrados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    usuarioEditando,
    modalResetAbierto,
    guardandoReset,
    errorReset,
    usuarioReset,
    confirmacionAbierta,
    confirmacionOpciones,
    responderConfirmacion,
    abrirModalCrear,
    abrirModalEditar,
    guardarUsuario,
    alternarEstado,
    abrirModalReset,
    confirmarResetPassword,
  };
}
