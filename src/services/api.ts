import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ErrorApiBackend, PayloadUsuarioBackend, RespuestaApi } from '@/models/auth';

export interface ConfiguracionPeticionExtendida extends InternalAxiosRequestConfig {
  _retry?: boolean;
  /** Cuando es true, un fallo de refresh no fuerza redirección (usado en la hidratación inicial silenciosa). */
  _omitirRedireccionAuth?: boolean;
}

interface PeticionEncolada {
  resolve: () => void;
  reject: (motivo?: unknown) => void;
}

interface CallbacksSesionAuth {
  alRenovarSesion: (payload: PayloadUsuarioBackend) => void;
  alExpirarSesion: (forzarRedireccion: boolean) => void;
}

let callbacksAuth: CallbacksSesionAuth | null = null;

/**
 * Conecta el Store de Autenticación con el interceptor HTTP sin crear dependencias circulares.
 */
export function registrarCallbacksSesionAuth(callbacks: CallbacksSesionAuth): void {
  callbacksAuth = callbacks;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5200/api',
  timeout: 10000,
  // Envía y recibe automáticamente las cookies HttpOnly (`access_token` y `refresh_token`)
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Estado del proceso de Silent Refresh y cola de peticiones concurrentes
let isRefreshing = false;
let colaPeticionesPendientes: PeticionEncolada[] = [];

function procesarColaPendiente(error: unknown): void {
  const copiaCola = [...colaPeticionesPendientes];
  colaPeticionesPendientes = [];

  for (const promesa of copiaCola) {
    if (error) {
      promesa.reject(error);
    } else {
      promesa.resolve();
    }
  }
}

/**
 * Determina si una URL corresponde a un endpoint de autenticación que NO debe disparar Silent Refresh
 * (evita bucles infinitos cuando el usuario falla su contraseña en `/auth/login` o cuando falla `/auth/refresh`).
 */
function esRutaExcluidaDeRefresh(url?: string): boolean {
  if (!url) return false;
  const normalizada = url.toLowerCase();
  return (
    normalizada.includes('/auth/login') ||
    normalizada.includes('/auth/refresh') ||
    normalizada.includes('/auth/logout')
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorApiBackend>) => {
    const peticionOriginal = error.config as ConfiguracionPeticionExtendida | undefined;
    const status = error.response?.status;
    const codigoError = error.response?.data?.code;

    if (!peticionOriginal || status !== 401 || esRutaExcluidaDeRefresh(peticionOriginal.url)) {
      return Promise.reject(error);
    }

    // Si la sesión fue explícitamente revocada o ya se reintentó tras un refresh, cerramos sesión local
    if (codigoError === 'SESSION_REVOKED' || peticionOriginal._retry) {
      callbacksAuth?.alExpirarSesion(!peticionOriginal._omitirRedireccionAuth);
      return Promise.reject(error);
    }

    // Si ya hay una renovación silenciosa en curso, encolamos esta petición hasta que termine
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        colaPeticionesPendientes.push({ resolve, reject });
      }).then(() => {
        peticionOriginal._retry = true;
        return api(peticionOriginal);
      });
    }

    peticionOriginal._retry = true;
    isRefreshing = true;

    try {
      const { data: respuestaRefresh } =
        await api.post<RespuestaApi<PayloadUsuarioBackend>>('/auth/refresh');

      if (respuestaRefresh?.data) {
        callbacksAuth?.alRenovarSesion(respuestaRefresh.data);
      }

      procesarColaPendiente(null);
      return await api(peticionOriginal);
    } catch (refreshError: unknown) {
      const errorRechazo =
        refreshError instanceof Error ? refreshError : new Error('La sesión ha expirado.');
      procesarColaPendiente(errorRechazo);
      callbacksAuth?.alExpirarSesion(!peticionOriginal._omitirRedireccionAuth);
      return Promise.reject(errorRechazo);
    } finally {
      isRefreshing = false;
    }
  },
);
