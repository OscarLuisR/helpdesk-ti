import type { AreaDestino, RolUsuario } from './types';

export interface UsuarioSesion {
  id: string;
  username: string;
  nombre: string;
  rol: RolUsuario;
  /** Sub-área asignada cuando el usuario pertenece a una especialidad de TI. */
  area?: AreaDestino;
}

export interface CredencialesLogin {
  username: string;
  password: string;
}

export interface OpcionRolSimulador {
  valor: RolUsuario;
  etiqueta: string;
}

export const OPCIONES_ROL_SIMULADOR: readonly OpcionRolSimulador[] = [
  { valor: 'USUARIO', etiqueta: 'Usuario (Solicitante)' },
  { valor: 'MESA_TECNICA', etiqueta: 'Mesa Técnica' },
  { valor: 'GERENTE_AREA', etiqueta: 'Gerente de Área' },
  { valor: 'TECNICO', etiqueta: 'Técnico' },
  { valor: 'GERENTE_GENERAL', etiqueta: 'Gerente General' },
  { valor: 'ADMINISTRADOR', etiqueta: 'Administrador' },
];
