export type RolUsuario =
  | 'USUARIO'
  | 'MESA_TECNICA'
  | 'GERENTE_AREA'
  | 'TECNICO'
  | 'DIRECTOR'
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

/** Sub-áreas de la Gerencia de Tecnología (referencia legacy de catálogos). */
export type AreaDestino = 'Redes' | 'Soporte Técnico' | 'Desarrollo' | 'Aplicaciones';

// 🛡️ [FASE 2.3 - TICKETS] Contratos reales alineados con fn_get_tickets, fn_post_tickets, fn_patch_ticket_estado y fn_get_ticket_bitacora

export interface Ticket {
  id: number;
  folio: string;
  estado: EstadoTicket;
  descripcion_incidencia: string;
  id_usuario_solicitante: number | null;
  // 🛡️ [FASE 3.1 - SOLICITANTES] Relación normalizada hacia public.solicitantes
  id_solicitante: number;
  solicitante: string;
  solicitante_nick: string | null;
  solicitante_telefono: string;
  id_departamento_solicitante: number;
  departamento_solicitante: string;
  id_catalogo: number;
  catalogo_incidencia: string;
  id_prioridad: number;
  prioridad: string;
  tiempo_max_asignacion_minutos: number;
  tiempo_meta_resolucion_horas: number;
  activa_suplencia: boolean;
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  id_tecnico: number | null;
  tecnico: string | null;
  id_usuario_creador: number;
  usuario_creador: string;
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_inicio_atencion: string | null;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
  causa_raiz: string | null;
  solucion_aplicada: string | null;
  conformidad_usuario: boolean | null;
}

// 🛡️ [FASE 3.1 - SOLICITANTES] Catálogo normalizado de solicitantes de tickets
export interface SolicitanteItem {
  id: number;
  nombre_completo: string;
  telefono: string;
  id_departamento: number;
  departamento: string;
  is_activo: boolean;
  fecha_creacion: string;
}

export interface CreateTicketPayload {
  id_solicitante?: number;
  // 🛡️ [FASE 3.2 - SOLICITANTES] Confirmación explícita para actualizar datos del solicitante en su mismo departamento
  actualizar_solicitante?: boolean;
  id_departamento_solicitante?: number;
  solicitante_nombre?: string;
  solicitante_telefono?: string;
  id_catalogo: number;
  descripcion_incidencia: string;
}

export interface CreateTicketResult {
  id: number;
  folio: string;
  estado: EstadoTicket;
  fecha_creacion: string;
}

export interface PatchTicketEstadoPayload {
  estado_nuevo: EstadoTicket;
  id_tecnico?: number;
  motivo_pausa?: string;
  comentario?: string;
  causa_raiz?: string;
  solucion_aplicada?: string;
  conformidad_usuario?: boolean;
}

export interface PatchTicketEstadoResult {
  id: number;
  folio: string;
  estado_anterior: EstadoTicket;
  estado_nuevo: EstadoTicket;
  id_tecnico: number | null;
  fecha_registro: string;
}

export interface TicketBitacoraItem {
  id: number;
  id_ticket: number;
  id_usuario_accion: number;
  usuario_accion: string;
  codigo_rol_accion: string;
  rol_accion: string;
  estado_anterior: EstadoTicket | null;
  estado_nuevo: EstadoTicket;
  motivo_pausa: string | null;
  comentario: string | null;
  fecha_registro: string;
}

export interface TecnicoDisponible {
  id: number;
  nombre_completo: string;
  nick: string;
  id_departamento: number;
  departamento: string;
}

export interface TicketFiltrosQuery {
  folio?: string;
  estado?: EstadoTicket;
  id_tecnico?: number;
  id_departamento_ti?: number;
  id_departamento_solicitante?: number;
  id_usuario_solicitante?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// 🛡️ [FASE 2.4 - TICKETS] Contratos de Comentarios (chat) y Adjuntos

export interface TicketComentarioItem {
  id: number;
  id_ticket: number;
  id_usuario_autor: number;
  usuario_autor: string;
  codigo_rol_autor: string;
  rol_autor: string;
  mensaje: string;
  es_interno: boolean;
  // 🛡️ [FASE 3.0 - COMENTARIOS] Trazabilidad de sistema y anulación lógica auditada
  is_sistema: boolean;
  is_anulado: boolean;
  id_usuario_anula: number | null;
  usuario_anula: string | null;
  fecha_anulacion: string | null;
  fecha_creacion: string;
}

export interface CreateTicketComentarioPayload {
  mensaje: string;
  es_interno?: boolean;
}

export interface TicketAdjuntoItem {
  id: number;
  id_ticket: number;
  id_usuario_sube: number;
  usuario_sube: string;
  nombre_archivo: string;
  peso_kb: number | null;
  fecha_subida: string;
}
