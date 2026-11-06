import type { AreaDestino, Prioridad, RolUsuario, TipoTrabajo } from './types';

export interface UsuarioMaestro {
  id: string;
  username: string;
  nombre: string;
  rol: RolUsuario;
  area?: AreaDestino;
  activo: boolean;
  /** Fecha ISO 8601. */
  fechaCreacion: string;
}

export interface PayloadUsuarioMaestro {
  username: string;
  nombre: string;
  rol: RolUsuario;
  area?: AreaDestino;
  activo: boolean;
}

export interface DepartamentoMaestro {
  id: string;
  codigo: string;
  nombre: string;
  responsable: string;
  ubicacion: string;
  extensionTelefonica: string;
  activo: boolean;
}

export interface PayloadDepartamentoMaestro {
  codigo: string;
  nombre: string;
  responsable: string;
  ubicacion: string;
  extensionTelefonica: string;
  activo: boolean;
}

export interface TipoCasoMaestro {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza: TipoTrabajo;
  areaDestino: AreaDestino;
  prioridadSugerida: Prioridad;
  requiereEquipo: boolean;
  activo: boolean;
}

export interface PayloadTipoCasoMaestro {
  codigo: string;
  nombre: string;
  naturaleza: TipoTrabajo;
  areaDestino: AreaDestino;
  prioridadSugerida: Prioridad;
  requiereEquipo: boolean;
  activo: boolean;
}

export interface ConfiguracionSla {
  id: string;
  prioridad: Prioridad;
  criterio: string;
  ejemploCorporativo: string;
  minutosMetaAsignacion: number;
  horasResolucionMin: number;
  horasResolucionMax: number;
  activaSuplenciaMesa: boolean;
  minutosUmbralSuplencia: number;
}

export interface PayloadConfiguracionSla {
  criterio: string;
  ejemploCorporativo: string;
  minutosMetaAsignacion: number;
  horasResolucionMin: number;
  horasResolucionMax: number;
  activaSuplenciaMesa: boolean;
  minutosUmbralSuplencia: number;
}
