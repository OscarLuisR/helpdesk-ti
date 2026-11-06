import { defineStore } from 'pinia';

export type NaturalezaTrabajo =
  | 'Incidencia'
  | 'Requerimiento de Servicio'
  | 'Desarrollo / Evolutivo'
  | 'Actividad Interna / Preventiva';

export type SubgerenciaDestino = 'Redes' | 'Soporte Técnico' | 'Aplicaciones' | 'Desarrollo';
export type PrioridadSugerida = 'Crítica' | 'Alta' | 'Media' | 'Baja';
export type EstadoServicio = 'Activo' | 'Inactivo';

export interface ServiceCatalog {
  id: number;
  nombre: string;
  naturaleza: NaturalezaTrabajo;
  subgerenciaDestino: SubgerenciaDestino;
  prioridadSugerida: PrioridadSugerida;
  estado: EstadoServicio;
}

export interface ServiceCatalogPayload {
  nombre: string;
  naturaleza: NaturalezaTrabajo;
  subgerenciaDestino: SubgerenciaDestino;
  prioridadSugerida: PrioridadSugerida;
  estado: EstadoServicio;
}

export const OPCIONES_NATURALEZA: readonly NaturalezaTrabajo[] = [
  'Incidencia',
  'Requerimiento de Servicio',
  'Desarrollo / Evolutivo',
  'Actividad Interna / Preventiva',
];

export const OPCIONES_SUBGERENCIA: readonly SubgerenciaDestino[] = [
  'Redes',
  'Soporte Técnico',
  'Aplicaciones',
  'Desarrollo',
];

export const OPCIONES_PRIORIDAD: readonly PrioridadSugerida[] = ['Crítica', 'Alta', 'Media', 'Baja'];

const MOCK_SERVICES: readonly ServiceCatalog[] = [
  { id: 1, nombre: 'Falla o Caída de Enlace VPN Corporativo', naturaleza: 'Incidencia', subgerenciaDestino: 'Redes', prioridadSugerida: 'Crítica', estado: 'Activo' },
  { id: 2, nombre: 'Falla de Impresora o Periférico de Red', naturaleza: 'Incidencia', subgerenciaDestino: 'Soporte Técnico', prioridadSugerida: 'Media', estado: 'Activo' },
  { id: 3, nombre: 'Creación y Asignación de Usuario de Dominio', naturaleza: 'Requerimiento de Servicio', subgerenciaDestino: 'Soporte Técnico', prioridadSugerida: 'Media', estado: 'Activo' },
  { id: 4, nombre: 'Instalación y Configuración de Software', naturaleza: 'Requerimiento de Servicio', subgerenciaDestino: 'Aplicaciones', prioridadSugerida: 'Baja', estado: 'Activo' },
  { id: 5, nombre: 'Nuevo Módulo o Ajuste en ERP Corporativo', naturaleza: 'Desarrollo / Evolutivo', subgerenciaDestino: 'Desarrollo', prioridadSugerida: 'Media', estado: 'Activo' },
  { id: 6, nombre: 'Desarrollo de Nuevo Reporte en Plataforma BI', naturaleza: 'Desarrollo / Evolutivo', subgerenciaDestino: 'Aplicaciones', prioridadSugerida: 'Baja', estado: 'Activo' },
  { id: 7, nombre: 'Mantenimiento Preventivo a Servidores', naturaleza: 'Actividad Interna / Preventiva', subgerenciaDestino: 'Redes', prioridadSugerida: 'Alta', estado: 'Activo' },
  { id: 8, nombre: 'Depuración y Respaldo Periódico de Bases de Datos', naturaleza: 'Actividad Interna / Preventiva', subgerenciaDestino: 'Desarrollo', prioridadSugerida: 'Crítica', estado: 'Activo' },
  { id: 9, nombre: 'Acceso a Carpetas Compartidas Legacy', naturaleza: 'Requerimiento de Servicio', subgerenciaDestino: 'Soporte Técnico', prioridadSugerida: 'Baja', estado: 'Inactivo' },
];

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    services: MOCK_SERVICES.map((s) => ({ ...s })),
  }),

  getters: {
    serviciosActivos: (state): ServiceCatalog[] =>
      state.services.filter((s) => s.estado === 'Activo'),
    serviciosPorNaturaleza: (state) => (nat: NaturalezaTrabajo) =>
      state.services.filter((s) => s.naturaleza === nat && s.estado === 'Activo'),
  },

  actions: {
    async agregarServicio(payload: ServiceCatalogPayload): Promise<ServiceCatalog> {
      const nombreNorm = payload.nombre.trim().toLowerCase();
      if (this.services.some((s) => s.nombre.trim().toLowerCase() === nombreNorm)) {
        throw new Error('Ya existe un servicio registrado con este nombre.');
      }
      // TODO: Integrar endpoint REST para Crear Servicio (POST /api/v1/admin/catalogo)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const siguienteId = this.services.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      const nuevo: ServiceCatalog = {
        id: siguienteId,
        nombre: payload.nombre.trim(),
        naturaleza: payload.naturaleza,
        subgerenciaDestino: payload.subgerenciaDestino,
        prioridadSugerida: payload.prioridadSugerida,
        estado: payload.estado,
      };

      this.services.unshift(nuevo);
      return nuevo;
    },

    async actualizarServicio(id: number, payload: ServiceCatalogPayload): Promise<ServiceCatalog> {
      const idx = this.services.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('No se encontró el servicio a actualizar.');

      const nombreNorm = payload.nombre.trim().toLowerCase();
      const duplicado = this.services.some(
        (s) => s.id !== id && s.nombre.trim().toLowerCase() === nombreNorm,
      );
      if (duplicado) throw new Error('Ya existe otro servicio con ese nombre.');

      // TODO: Integrar endpoint REST para Actualizar Servicio (PUT /api/v1/admin/catalogo/:id)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const actualizado: ServiceCatalog = {
        id,
        nombre: payload.nombre.trim(),
        naturaleza: payload.naturaleza,
        subgerenciaDestino: payload.subgerenciaDestino,
        prioridadSugerida: payload.prioridadSugerida,
        estado: payload.estado,
      };

      this.services[idx] = actualizado;
      return actualizado;
    },

    async alternarEstado(id: number): Promise<ServiceCatalog> {
      const servicio = this.services.find((s) => s.id === id);
      if (!servicio) throw new Error('No se encontró el servicio.');

      // TODO: Integrar endpoint REST para Cambiar Estado (Soft Delete) (PATCH /api/v1/admin/catalogo/:id/estado)
      await new Promise((resolve) => setTimeout(resolve, 200));
      servicio.estado = servicio.estado === 'Activo' ? 'Inactivo' : 'Activo';
      return servicio;
    },
  },
});
