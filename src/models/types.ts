export type RolUsuario =
  | 'USUARIO'
  | 'MESA_TECNICA'
  | 'GERENTE_AREA'
  | 'TECNICO'
  | 'GERENTE_GENERAL'
  | 'ADMINISTRADOR';

export type TipoTrabajo =
  | 'Incidencia'
  | 'Requerimiento de Servicio'
  | 'Desarrollo'
  | 'Actividad Interna';

export type Prioridad = 'Crítica' | 'Alta' | 'Media' | 'Baja';

export type EstadoTicket =
  | 'Abierto'
  | 'Asignado'
  | 'En Progreso'
  | 'En Espera'
  | 'Resuelto - Por Verificar'
  | 'Cerrado'
  | 'Reabierto';

/** Sub-áreas de la Gerencia de Tecnología. */
export type AreaDestino = 'Redes' | 'Soporte Técnico' | 'Desarrollo' | 'Aplicaciones';

export interface Ticket {
  id: string;
  folio: string;
  solicitante: string;
  departamento: string;
  areaDestino: AreaDestino;
  tipoTrabajo: TipoTrabajo;
  prioridad: Prioridad;
  estado: EstadoTicket;
  /** Fecha ISO 8601. */
  fechaCreacion: string;
  /** Motivo tipificado; aplica cuando el estado es 'En Espera'. */
  motivoPausa?: string;
  /** Id del técnico asignado. */
  tecnicoAsignado?: string;
}
