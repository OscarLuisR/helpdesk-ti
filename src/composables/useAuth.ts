import axios from 'axios';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { CredencialesLogin, ErrorApiBackend } from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

const SEGUNDOS_BLOQUEO_DEFECTO = 15 * 60; // 15 minutos (alineado con rateLimit.middleware.ts del backend)
/** Lista blanca estricta: solo letras, números, punto, guion y guion bajo (3 a 25 caracteres). */
export const PATRON_NOMBRE_USUARIO = /^[a-zA-Z0-9._-]{3,25}$/;

/** Elimina caracteres de control y espacios laterales. */
function sanitizarUsername(valor: string): string {
  return valor.replace(/[\p{Cc}\s]/gu, '');
}

function formatearSegundos(totalSegundos: number): string {
  const seg = Math.max(0, Math.ceil(totalSegundos));
  if (seg < 60) {
    return `${seg}s`;
  }
  const minutos = Math.floor(seg / 60);
  const restoSegundos = seg % 60;
  return `${minutos}:${String(restoSegundos).padStart(2, '0')} min`;
}

// 🛡️ [FASE 2.3 - TICKETS] Ruta de aterrizaje real según el rol autenticado
export function rutaInicioPorRol(rol: RolUsuario): string {
  switch (rol) {
    case 'ADMINISTRADOR':
      return '/admin/roles';
    case 'MESA_TECNICA':
      return '/tickets/recepcion';
    case 'GERENTE_AREA':
      return '/gerencia/bandeja';
    case 'TECNICO':
      return '/tecnico/mis-tickets';
    case 'GERENTE_GENERAL':
      return '/tickets/recepcion';
    case 'USUARIO':
      return '/usuario/mis-solicitudes';
    default:
      return '/tecnico/mis-tickets';
  }
}

export function useAuth() {
  const authStore = useAuthStore();
  const ticketStore = useTicketStore();
  const router = useRouter();

  const cargando = ref(false);
  const errorAuth = ref<string | null>(null);
  const intentosRestantes = ref<number | null>(null);
  const segundosBloqueo = ref(0);
  let temporizadorBloqueo: ReturnType<typeof setInterval> | null = null;

  const usuario = computed(() => authStore.usuario);
  const rolActual = computed(() => authStore.rolActual);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const estaBloqueado = computed(() => segundosBloqueo.value > 0);
  const tiempoBloqueoTexto = computed(() => formatearSegundos(segundosBloqueo.value));

  function detenerTemporizador(): void {
    if (temporizadorBloqueo !== null) {
      clearInterval(temporizadorBloqueo);
      temporizadorBloqueo = null;
    }
  }

  function activarBloqueoTemporal(segundos = SEGUNDOS_BLOQUEO_DEFECTO): void {
    detenerTemporizador();
    segundosBloqueo.value = Math.max(1, Math.ceil(segundos));
    intentosRestantes.value = 0;

    temporizadorBloqueo = setInterval(() => {
      segundosBloqueo.value -= 1;
      if (segundosBloqueo.value <= 0) {
        detenerTemporizador();
        intentosRestantes.value = null;
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

    if (!PATRON_NOMBRE_USUARIO.test(usernameLimpio) || credenciales.password.length > 72) {
      errorAuth.value = 'Usuario o contraseña incorrectos.';
      return false;
    }

    cargando.value = true;
    try {
      const sesion = await authStore.autenticar({
        username: usernameLimpio,
        password: credenciales.password,
      });

      intentosRestantes.value = null;
      detenerTemporizador();
      segundosBloqueo.value = 0;

      // Regla de negocio: si es usuario nuevo (`is_new_user === true`), encapsular en cambio de contraseña
      if (sesion.is_new_user) {
        await router.push('/cambiar-contrasena');
        return true;
      }

      await ticketStore.cargarTickets();
      await router.push(rutaInicioPorRol(sesion.rol));
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError<ErrorApiBackend>(err)) {
        const status = err.response?.status;
        const datosError = err.response?.data;
        const mensajeBackend = datosError?.message?.trim();

        if (status === 429 || datosError?.code === 'ACCOUNT_LOCKED') {
          const retrySegundos =
            typeof datosError?.details?.retry_after_segundos === 'number'
              ? datosError.details.retry_after_segundos
              : SEGUNDOS_BLOQUEO_DEFECTO;

          activarBloqueoTemporal(retrySegundos);
          errorAuth.value =
            mensajeBackend ||
            'Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente por seguridad.';
        } else if (!err.response) {
          errorAuth.value =
            'No se pudo conectar con el servidor. Verifica que el servicio esté activo.';
        } else {
          intentosRestantes.value =
            typeof datosError?.details?.intentos_restantes === 'number'
              ? datosError.details.intentos_restantes
              : null;

          errorAuth.value = mensajeBackend || 'Usuario o contraseña incorrectos.';
        }
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
    intentosRestantes,
    estaBloqueado,
    segundosBloqueo,
    tiempoBloqueoTexto,
    iniciarSesion,
    cerrarSesion,
    limpiarError,
  };
}
