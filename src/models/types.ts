export type RolUsuario =
  | 'USUARIO'
  | 'MESA_TECNICA'
  | 'GERENTE_AREA'
  | 'TECNICO'
  | 'DIRECTOR'
  | 'ADMINISTRADOR';

export type Prioridad = 'Crítica' | 'Alta' | 'Media' | 'Baja';

export type EstadoTicket =
  | 'Abierto'
  | 'Asignado'
  | 'En Progreso'
  | 'En Espera'
  | 'Resuelto - Por Verificar'
  | 'Cerrado'
  | 'No Resuelto'
  | 'Cancelado'
  | 'Reabierto';

// 🛡️ [FASE 3.3 - TICKETS] Motivos tipificados de pausa y tipos oficiales de cierre
export const MOTIVOS_PAUSA = [
  'Esperando repuesto/compra',
  'Proveedor externo',
  'Usuario no disponible',
  'Esperando autorización',
] as const;

export type MotivoPausa = (typeof MOTIVOS_PAUSA)[number];

export const TIPOS_CIERRE = ['Confirmado', 'Administrativo'] as const;

export type TipoCierre = (typeof TIPOS_CIERRE)[number];

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
  // 🛡️ [FASE 3.3 - TICKETS] Tipo de cierre registrado (Confirmado vs Administrativo)
  tipo_cierre: TipoCierre | null;
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
  // 🛡️ [FASE 3.3 - TICKETS] Cierre Directo Nivel 1 en apertura
  cierre_directo_n1?: boolean;
  causa_raiz?: string;
  solucion_aplicada?: string;
  conformidad_usuario?: boolean;
  comentario?: string;
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
  motivo_pausa?: MotivoPausa;
  comentario?: string;
  causa_raiz?: string;
  solucion_aplicada?: string;
  conformidad_usuario?: boolean;
  tipo_cierre?: TipoCierre;
}

export interface PatchTicketEstadoResult {
  id: number;
  folio: string;
  estado_anterior: EstadoTicket;
  estado_nuevo: EstadoTicket;
  id_tecnico: number | null;
  fecha_registro: string;
}

// 🛡️ [FASE 3.3 - TICKETS] Contratos de transferencia entre Sub-Áreas TI
export interface TransferirTicketPayload {
  id_departamento_nuevo: number;
  comentario: string;
}

export interface TransferirTicketResult {
  id: number;
  folio: string;
  id_departamento_anterior: number;
  departamento_anterior: string;
  id_departamento_nuevo: number;
  departamento_nuevo: string;
  estado_anterior: EstadoTicket;
  estado_nuevo: EstadoTicket;
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
  motivo_pausa: MotivoPausa | null;
  comentario: string | null;
  fecha_registro: string;
  // 🛡️ [FASE 3.3 - TICKETS] Trazabilidad de transferencias, tipo de cierre y suplencia
  id_departamento_anterior: number | null;
  departamento_anterior: string | null;
  id_departamento_nuevo: number | null;
  departamento_nuevo: string | null;
  tipo_cierre: TipoCierre | null;
  es_suplencia: boolean;
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

// 🛡️ [FASE 3.5 - METRICAS Y BASE SOLUCIONES] Contratos espejo de GET /tickets/metricas y /tickets/base-soluciones

export interface MetricasFiltrosQuery {
  id_departamento_ti?: number;
  id_tecnico?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface MetricaTicketReal {
  id: number;
  folio: string;
  estado: EstadoTicket;
  tipo_cierre: TipoCierre | null;
  conformidad_usuario: boolean | null;
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  id_departamento_solicitante: number;
  departamento_solicitante: string;
  solicitante: string;
  id_catalogo: number;
  catalogo_incidencia: string;
  id_prioridad: number;
  prioridad: string;
  tiempo_max_asignacion_minutos: number;
  tiempo_meta_resolucion_horas: number;
  id_tecnico: number | null;
  tecnico: string | null;
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
  causa_raiz: string | null;
  solucion_aplicada: string | null;
  tiempo_asignacion_minutos: number;
  tiempo_efectivo_minutos: number;
  tiempo_pausa_minutos: number;
  pausa_repuesto_minutos: number;
  pausa_proveedor_minutos: number;
  pausa_usuario_minutos: number;
  pausa_autorizacion_minutos: number;
  ultimo_motivo_pausa: MotivoPausa | null;
  fecha_inicio_pausa_actual: string | null;
  tuvo_suplencia: boolean;
  cantidad_reaperturas: number;
  cantidad_transferencias: number;
  cumple_sla_asignacion: boolean | null;
  cumple_sla_resolucion: boolean | null;
}

export interface MetricasDepartamentoResumen {
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  total: number;
  evaluables: number;
  resueltos_cerrados: number;
  cancelados: number;
  suplencias: number;
  reaperturas: number;
  transferencias: number;
  pct_sla_asignacion: number;
  pct_sla_resolucion: number;
  promedio_asignacion_minutos: number;
  promedio_efectivo_minutos: number;
  total_pausa_minutos: number;
}

export interface MetricasTecnicoResumen {
  id_tecnico: number;
  tecnico: string;
  id_departamento: number;
  departamento: string;
  total: number;
  resueltos_cerrados: number;
  reabiertos: number;
  pct_sla_resolucion: number;
  pct_reapertura: number;
  promedio_efectivo_minutos: number;
  total_pausa_minutos: number;
}

export interface MetricasTopCatalogo {
  id_catalogo: number;
  catalogo_incidencia: string;
  departamento: string;
  cantidad: number;
  promedio_efectivo_minutos: number;
}

export interface MetricasResumenOperativo {
  total_tickets: number;
  total_evaluables: number;
  total_cancelados: number;
  total_resueltos_cerrados: number;
  pct_sla_asignacion: number;
  pct_sla_resolucion: number;
  promedio_asignacion_minutos: number;
  promedio_efectivo_minutos: number;
  promedio_pausa_minutos: number;
  pausas_por_motivo: {
    repuesto_compra_minutos: number;
    proveedor_externo_minutos: number;
    usuario_no_disponible_minutos: number;
    esperando_autorizacion_minutos: number;
  };
  gobernanza: {
    total_suplencias: number;
    total_reaperturas: number;
    total_transferencias: number;
    tasa_reapertura_pct: number;
    cierres_confirmados: number;
    cierres_administrativos: number;
    pct_conformidad_usuario: number;
  };
  por_departamento: MetricasDepartamentoResumen[];
  por_tecnico: MetricasTecnicoResumen[];
  top_catalogo: MetricasTopCatalogo[];
}

export interface MetricasTicketsResponse {
  resumen: MetricasResumenOperativo;
  tickets: MetricaTicketReal[];
}

export interface BaseSolucionesFiltrosQuery {
  q?: string;
  id_catalogo?: number;
  id_departamento_ti?: number;
  limite?: number;
}

export interface BaseSolucionItem {
  id: number;
  folio: string;
  estado: EstadoTicket;
  id_catalogo: number;
  catalogo_incidencia: string;
  id_departamento: number;
  codigo_departamento: string;
  departamento: string;
  prioridad: string;
  descripcion_incidencia: string;
  causa_raiz: string;
  solucion_aplicada: string;
  tecnico: string | null;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
}
