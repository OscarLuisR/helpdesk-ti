import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { PATRON_NOMBRE_USUARIO } from '@/composables/useAuth';
import { OPCIONES_ROL_SIMULADOR } from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import { useUsersStore, type EstadoUsuario, type User, type UserFormPayload } from '@/stores/useUsersStore';

export const COLUMNAS_USUARIOS: QTableColumn<User>[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'username', label: 'Usuario', field: 'username', align: 'left', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'departamento', label: 'Departamento', field: 'departamento', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'left' },
];

export const OPCIONES_FILTRO_ESTADO: readonly string[] = ['Todos', 'Activo', 'Inactivo'];

export interface OpcionFiltroRol {
  valor: 'TODOS' | RolUsuario;
  etiqueta: string;
}

export const OPCIONES_FILTRO_ROL: readonly OpcionFiltroRol[] = [
  { valor: 'TODOS', etiqueta: 'Todos los roles' },
  ...OPCIONES_ROL_SIMULADOR,
];

export const ROL_CHIP_CLASS: Record<RolUsuario, string> = {
  ADMINISTRADOR: 'bad',
  GERENTE_GENERAL: 'brand',
  MESA_TECNICA: 'info',
  GERENTE_AREA: 'warn',
  TECNICO: 'neutral',
  USUARIO: 'ok',
};

export function etiquetaRol(rol: RolUsuario): string {
  return OPCIONES_ROL_SIMULADOR.find((op) => op.valor === rol)?.etiqueta ?? rol;
}

export function estadoChipClass(estado: EstadoUsuario): string {
  return estado === 'Activo' ? 'ok' : 'bad';
}

export function validarUsernameLogin(valor: string): true | string {
  const limpio = (valor ?? '').trim();
  if (!limpio) return 'Ingresa el nombre de usuario (login)';
  if (!PATRON_NOMBRE_USUARIO.test(limpio)) {
    return 'Solo letras, números, punto o guion (3 a 50 caracteres)';
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

export function useUsersView() {
  const usersStore = useUsersStore();
  const $q = useQuasar();

  const busqueda = ref('');
  const filtroEstado = ref<string>('Todos');
  const filtroRol = ref<'TODOS' | RolUsuario>('TODOS');
  const paginaActual = ref(1);
  const filasPorPagina = 8;

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const usuarioEditando = ref<User | null>(null);

  const modalResetAbierto = ref(false);
  const guardandoReset = ref(false);
  const errorReset = ref<string | null>(null);
  const usuarioReset = ref<User | null>(null);

  const usuariosFiltrados = computed<User[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return usersStore.users.filter((u) => {
      const coincideEstado = filtroEstado.value === 'Todos' || u.estado === filtroEstado.value;
      const coincideRol = filtroRol.value === 'TODOS' || u.rol === filtroRol.value;
      const coincideTexto =
        !q ||
        [String(u.id), u.nombre, u.username, u.telefono, u.departamento, etiquetaRol(u.rol)].some((c) =>
          c.toLowerCase().includes(q),
        );
      return coincideEstado && coincideRol && coincideTexto;
    });
  });

  watch([busqueda, filtroEstado, filtroRol], () => {
    paginaActual.value = 1;
  });

  const totalResultados = computed(() => usuariosFiltrados.value.length);

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(totalResultados.value / filasPorPagina)),
  );

  const usuariosPaginados = computed<User[]>(() => {
    const inicio = (paginaActual.value - 1) * filasPorPagina;
    return usuariosFiltrados.value.slice(inicio, inicio + filasPorPagina);
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
        $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente.', position: 'top-right' });
      } else {
        await usersStore.agregarUsuario(payload);
        $q.notify({ type: 'positive', message: 'Usuario creado correctamente.', position: 'top-right' });
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

  function alternarEstado(usuario: User): void {
    void usersStore.eliminarUsuario(usuario.id);
    const accion = usuario.estado === 'Activo' ? 'activado' : 'desactivado';
    $q.notify({
      type: 'info',
      message: `Usuario @${usuario.username} ${accion}.`,
      position: 'top-right',
    });
  }

  function abrirModalReset(usuario: User): void {
    usuarioReset.value = { ...usuario };
    errorReset.value = null;
    modalResetAbierto.value = true;
  }

  async function confirmarResetPassword(nuevaPassword: string): Promise<boolean> {
    if (guardandoReset.value || !usuarioReset.value) return false;
    errorReset.value = null;
    guardandoReset.value = true;

    try {
      await usersStore.resetearPasswordUsuario(usuarioReset.value.id, nuevaPassword);
      $q.notify({
        type: 'positive',
        message: `Contraseña de @${usuarioReset.value.username} restablecida correctamente.`,
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
    busqueda,
    filtroEstado,
    filtroRol,
    paginaActual,
    filasPorPagina,
    totalPaginas,
    usuariosPaginados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    usuarioEditando,
    modalResetAbierto,
    guardandoReset,
    errorReset,
    usuarioReset,
    abrirModalCrear,
    abrirModalEditar,
    guardarUsuario,
    alternarEstado,
    abrirModalReset,
    confirmarResetPassword,
  };
}

