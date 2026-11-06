import { defineStore } from 'pinia';
import { USUARIOS_MOCK } from '@/mocks/usuarios';
import type { CredencialesLogin, UsuarioSesion } from '@/models/auth';
import type { RolUsuario } from '@/models/types';

// Clave temporal mientras no exista cookie de sesión HttpOnly desde el backend
const SESSION_STORAGE_KEY = 'helpdesk_ti_sesion';

const ROLES_VALIDOS: readonly RolUsuario[] = [
  'ADMINISTRADOR',
  'MESA_TECNICA',
  'GERENTE_AREA',
  'TECNICO',
  'GERENTE_GENERAL',
];

function esUsuarioSesion(valor: unknown): valor is UsuarioSesion {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as Record<string, unknown>;
  return (
    typeof candidato.id === 'string' &&
    typeof candidato.username === 'string' &&
    typeof candidato.nombre === 'string' &&
    typeof candidato.rol === 'string' &&
    ROLES_VALIDOS.includes(candidato.rol as RolUsuario)
  );
}

function leerSesionGuardada(): UsuarioSesion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return esUsuarioSesion(parsed) ? parsed : null;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

interface AuthState {
  usuario: UsuarioSesion | null;
  role: RolUsuario;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const sesion = leerSesionGuardada();
    return {
      // TODO: Al conectar el backend, hidratar sesión llamando a GET /api/v1/auth/me (vía cookie HttpOnly)
      usuario: sesion,
      role: sesion?.rol ?? 'TECNICO',
    };
  },

  getters: {
    isAuthenticated: (state): boolean => state.usuario !== null,
    rolActual: (state): RolUsuario => state.role,
  },

  actions: {
    async autenticar(credenciales: CredencialesLogin): Promise<UsuarioSesion> {
      const usernameNormalizado = credenciales.username.trim().toLowerCase();

      // TODO: Integrar endpoint POST /api/v1/auth/login (el backend setea cookie de sesión HttpOnly y retorna UsuarioSesion)
      // const { data } = await api.post<UsuarioSesion>('/auth/login', {
      //   username: usernameNormalizado,
      //   password: credenciales.password,
      // });
      // this.usuario = data;
      // this.role = data.rol;
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 700));

      const encontrado = USUARIOS_MOCK.find(
        (u) =>
          u.username.toLowerCase() === usernameNormalizado &&
          u.passwordMock === credenciales.password,
      );

      if (!encontrado) {
        throw new Error('Usuario o contraseña incorrectos.');
      }

      const sesion: UsuarioSesion = {
        id: encontrado.id,
        username: encontrado.username,
        nombre: encontrado.nombre,
        rol: encontrado.rol,
        ...(encontrado.area ? { area: encontrado.area } : {}),
      };

      this.usuario = sesion;
      this.role = sesion.rol;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
      return sesion;
    },

    // TODO: Eliminar esta acción simuladora de rol antes de pasar a producción.
    cambiarRolDesarrollo(nuevoRol: RolUsuario): void {
      this.role = nuevoRol;
      const mockDelRol = USUARIOS_MOCK.find((u) => u.rol === nuevoRol);
      if (this.usuario && mockDelRol) {
        const sesionActualizada: UsuarioSesion = {
          id: mockDelRol.id,
          username: mockDelRol.username,
          nombre: mockDelRol.nombre,
          rol: nuevoRol,
          ...(mockDelRol.area ? { area: mockDelRol.area } : {}),
        };
        this.usuario = sesionActualizada;
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesionActualizada));
      }
    },

    async cerrarSesion(): Promise<void> {
      // TODO: Integrar endpoint POST /api/v1/auth/logout para invalidar la cookie de sesión en el backend
      // await api.post('/auth/logout');

      await Promise.resolve();
      this.usuario = null;
      this.role = 'TECNICO';
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    },
  },
});
