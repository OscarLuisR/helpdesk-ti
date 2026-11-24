import type { RolUsuario } from './types';

export interface UsuarioSesion {
  id: string;
  username: string;
  nombre: string;
  rol: RolUsuario;
  /** Nombre descriptivo del rol enviado por el backend (ej. "Administrador"). */
  rolNombre?: string;
  /** Teléfono registrado del usuario. */
  telefono?: string;
  /** Indica si el usuario debe cambiar obligatoriamente su contraseña temporal ("123456"). */
  is_new_user?: boolean;
  // 🛡️ [FASE 2.3 - TICKETS] ID del departamento real del usuario enviado en el JWT
  id_departamento?: number;
}

/** Estructura exacta de `data` (IPayLoad) devuelta por `/auth/login`, `/auth/refresh` y `/auth/me`. */
export interface PayloadUsuarioBackend {
  id: number;
  nombre_completo: string;
  nick: string;
  telefono: string;
  is_activo: boolean;
  is_new_user: boolean;
  codigo_rol?: string;
  rol: string;
  // 🛡️ [FASE 2.3 - TICKETS] Departamento del usuario autenticado
  id_departamento?: number;
}

/** Envoltorio estándar de respuesta exitosa del backend HelpDesk TI. */
export interface RespuestaApi<T> {
  error: boolean;
  status: number;
  message: string;
  data: T;
}

/** Envoltorio estándar de respuesta de error del backend HelpDesk TI. */
export interface ErrorApiBackend {
  error: boolean;
  status: number;
  code?: string;
  message: string;
  details?: {
    intentos_restantes?: number;
    retry_after_segundos?: number;
    [clave: string]: unknown;
  };
  path?: string;
  method?: string;
}

export interface CredencialesLogin {
  username: string;
  password: string;
}
