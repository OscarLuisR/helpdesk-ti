import { defineStore } from 'pinia';
import { USUARIOS_MOCK } from '@/mocks/usuarios';
import type {
  CredencialesLogin,
  PayloadUsuarioBackend,
  RespuestaApi,
  UsuarioSesion,
} from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import {
  api,
  registrarCallbacksSesionAuth,
  type ConfiguracionPeticionExtendida,
} from '@/services/api';

const ROLES_VALIDOS: readonly RolUsuario[] = [
  'ADMINISTRADOR',
  'MESA_TECNICA',
  'GERENTE_AREA',
  'TECNICO',
  'GERENTE_GENERAL',
  'USUARIO',
];

function normalizarRolSistema(codigoRol?: string, rolNombre?: string): RolUsuario {
  const candidato = (codigoRol || rolNombre || '').trim().toUpperCase();
  if (ROLES_VALIDOS.includes(candidato as RolUsuario)) {
    return candidato as RolUsuario;
  }
  return 'USUARIO';
}

export function mapearPayloadASesion(payload: PayloadUsuarioBackend): UsuarioSesion {
  const rol = normalizarRolSistema(payload.codigo_rol, payload.rol);

  return {
    id: String(payload.id),
    username: payload.nick.trim(),
    nombre: payload.nombre_completo.trim(),
    rol,
    rolNombre: payload.rol.trim(),
    telefono: payload.telefono.trim(),
    is_new_user: Boolean(payload.is_new_user),
    // 🛡️ [FASE 2.3 - TICKETS] Propagamos id_departamento del payload backend a la sesión
    ...(payload.id_departamento !== undefined
      ? { id_departamento: Number(payload.id_departamento) }
      : {}),
  };
}

function redirigirALoginNavegador(): void {
  if (typeof window === 'undefined') return;
  const hashActual = window.location.hash;
  const pathActual = window.location.pathname;

  if (hashActual.startsWith('#')) {
    if (hashActual !== '#/' && hashActual !== '#') {
      window.location.hash = '#/';
    }
    return;
  }

  if (pathActual !== '/') {
    window.location.assign('/');
  }
}

interface AuthState {
  usuario: UsuarioSesion | null;
  role: RolUsuario;
  /** Indica si ya se verificó la sesión inicial contra `GET /auth/me` tras cargar o recargar la SPA. */
  hidratado: boolean;
}

let promesaHidratacionEnCurso: Promise<UsuarioSesion | null> | null = null;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    usuario: null,
    role: 'USUARIO',
    hidratado: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.usuario !== null,
    rolActual: (state): RolUsuario => state.role,
    requiereCambioContrasena: (state): boolean => state.usuario?.is_new_user === true,
  },

  actions: {
    inicializarInterceptores(): void {
      registrarCallbacksSesionAuth({
        alRenovarSesion: (payload: PayloadUsuarioBackend) => {
          this.establecerSesionDesdeBackend(payload);
        },
        alExpirarSesion: (forzarRedireccion: boolean) => {
          this.limpiarEstadoLocal();
          if (forzarRedireccion) {
            redirigirALoginNavegador();
          }
        },
      });
    },

    establecerSesionDesdeBackend(payload: PayloadUsuarioBackend): UsuarioSesion {
      const sesion = mapearPayloadASesion(payload);
      this.usuario = sesion;
      this.role = sesion.rol;
      this.hidratado = true;
      return sesion;
    },

    limpiarEstadoLocal(): void {
      this.usuario = null;
      this.role = 'USUARIO';
      this.hidratado = true;
    },

    /**
     * Hidrata la sesión activa al iniciar o recargar la aplicación (F5) consultando `GET /auth/me`.
     * Si el `access_token` venció pero el `refresh_token` sigue vigente, el interceptor de `api.ts`
     * ejecuta el Silent Refresh automáticamente y reintenta `/auth/me`.
     */
    async hidratarSesion(forzar = false): Promise<UsuarioSesion | null> {
      this.inicializarInterceptores();

      if (this.hidratado && !forzar) {
        return this.usuario;
      }

      if (promesaHidratacionEnCurso) {
        return promesaHidratacionEnCurso;
      }

      promesaHidratacionEnCurso = (async () => {
        try {
          const config: Partial<ConfiguracionPeticionExtendida> = {
            _omitirRedireccionAuth: true,
          };
          const { data: respuesta } = await api.get<RespuestaApi<PayloadUsuarioBackend>>(
            '/auth/me',
            config,
          );
          return this.establecerSesionDesdeBackend(respuesta.data);
        } catch {
          this.limpiarEstadoLocal();
          return null;
        } finally {
          promesaHidratacionEnCurso = null;
        }
      })();

      return promesaHidratacionEnCurso;
    },

    async autenticar(credenciales: CredencialesLogin): Promise<UsuarioSesion> {
      this.inicializarInterceptores();
      const nickNormalizado = credenciales.username.trim();

      const { data: respuesta } = await api.post<RespuestaApi<PayloadUsuarioBackend>>(
        '/auth/login',
        {
          nick: nickNormalizado,
          password: credenciales.password,
        },
      );

      return this.establecerSesionDesdeBackend(respuesta.data);
    },

    // Mantenido temporalmente para compatibilidad con AppHeader hasta limpiar simulador de desarrollo
    cambiarRolDesarrollo(nuevoRol: RolUsuario): void {
      this.role = nuevoRol;
      const mockDelRol = USUARIOS_MOCK.find((u) => u.rol === nuevoRol);
      if (this.usuario && mockDelRol) {
        this.usuario = {
          ...this.usuario,
          rol: nuevoRol,
          ...(mockDelRol.area ? { area: mockDelRol.area } : {}),
        };
      }
    },

    async cerrarSesion(): Promise<void> {
      this.inicializarInterceptores();
      try {
        await api.post('/auth/logout');
      } catch {
        // Incluso si falla la red o la sesión ya expiró, limpiamos el estado local
      } finally {
        this.limpiarEstadoLocal();
      }
    },
  },
});
