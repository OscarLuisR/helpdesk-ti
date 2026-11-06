import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { CredencialesLogin } from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

const MAX_INTENTOS_FALLIDOS = 5;
const SEGUNDOS_BLOQUEO = 30;
/** Lista blanca estricta: solo letras, números, punto, guion y guion bajo (3 a 50 caracteres). */
export const PATRON_NOMBRE_USUARIO = /^[a-zA-Z0-9._-]{3,50}$/;

/** Elimina caracteres de control y espacios laterales. */
function sanitizarUsername(valor: string): string {
  return valor.replace(/[\p{Cc}\s]/gu, '');
}

export function rutaInicioPorRol(rol: RolUsuario): string {
  // TODO: Asignar ruta destino específica por perfil cuando se definan todas las vistas
  if (rol === 'ADMINISTRADOR') {
    return '/admin/usuarios';
  }
  return '/tecnico/mis-tickets';
}

export function useAuth() {
  const authStore = useAuthStore();
  const ticketStore = useTicketStore();
  const router = useRouter();

  const cargando = ref(false);
  const errorAuth = ref<string | null>(null);
  const intentosFallidos = ref(0);
  const segundosBloqueo = ref(0);
  let temporizadorBloqueo: ReturnType<typeof setInterval> | null = null;

  const usuario = computed(() => authStore.usuario);
  const rolActual = computed(() => authStore.rolActual);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const estaBloqueado = computed(() => segundosBloqueo.value > 0);

  function detenerTemporizador(): void {
    if (temporizadorBloqueo !== null) {
      clearInterval(temporizadorBloqueo);
      temporizadorBloqueo = null;
    }
  }

  function activarBloqueoTemporal(): void {
    detenerTemporizador();
    segundosBloqueo.value = SEGUNDOS_BLOQUEO;
    temporizadorBloqueo = setInterval(() => {
      segundosBloqueo.value -= 1;
      if (segundosBloqueo.value <= 0) {
        detenerTemporizador();
        intentosFallidos.value = 0;
        errorAuth.value = null;
      }
    }, 1000);
  }

  onUnmounted(() => {
    detenerTemporizador();
  });

  async function iniciarSesion(credenciales: CredencialesLogin): Promise<boolean> {
    if (cargando.value || estaBloqueado.value) return false;

    errorAuth.value = null;
    const usernameLimpio = sanitizarUsername(credenciales.username);

    if (!usernameLimpio || !credenciales.password) {
      errorAuth.value = 'Ingresa tu nombre de usuario y contraseña.';
      return false;
    }

    if (!PATRON_NOMBRE_USUARIO.test(usernameLimpio) || credenciales.password.length > 128) {
      errorAuth.value = 'Usuario o contraseña incorrectos.';
      return false;
    }

    cargando.value = true;
    try {
      const sesion = await authStore.autenticar({
        username: usernameLimpio,
        password: credenciales.password,
      });
      intentosFallidos.value = 0;
      await ticketStore.cargarTickets();
      await router.push(rutaInicioPorRol(sesion.rol));
      return true;
    } catch (err) {
      intentosFallidos.value += 1;
      if (intentosFallidos.value >= MAX_INTENTOS_FALLIDOS) {
        activarBloqueoTemporal();
        errorAuth.value =
          'Demasiados intentos fallidos. Por seguridad, espera antes de volver a intentar.';
      } else {
        errorAuth.value =
          err instanceof Error ? err.message : 'No fue posible iniciar sesión. Intenta nuevamente.';
      }
      return false;
    } finally {
      cargando.value = false;
    }
  }

  async function cerrarSesion(): Promise<void> {
    await authStore.cerrarSesion();
    ticketStore.limpiarTickets();
    await router.push('/');
  }

  function limpiarError(): void {
    if (!estaBloqueado.value) {
      errorAuth.value = null;
    }
  }

  return {
    usuario,
    rolActual,
    isAuthenticated,
    cargando,
    errorAuth,
    estaBloqueado,
    segundosBloqueo,
    iniciarSesion,
    cerrarSesion,
    limpiarError,
  };
}
