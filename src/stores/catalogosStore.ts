import { defineStore } from 'pinia';
import type {
  ConfiguracionSla,
  DepartamentoMaestro,
  PayloadConfiguracionSla,
  PayloadDepartamentoMaestro,
  PayloadTipoCasoMaestro,
  PayloadUsuarioMaestro,
  TipoCasoMaestro,
  UsuarioMaestro,
} from '@/models/catalogos';

interface CatalogosState {
  usuarios: UsuarioMaestro[];
  departamentos: DepartamentoMaestro[];
  tiposCaso: TipoCasoMaestro[];
  slas: ConfiguracionSla[];
}

const MOCK_USUARIOS_MAESTROS: readonly UsuarioMaestro[] = [
  {
    id: 'adm-01',
    username: 'admin',
    nombre: 'Administrador TI',
    rol: 'ADMINISTRADOR',
    activo: true,
    fechaCreacion: '2026-10-01T08:00:00-04:00',
  },
  {
    id: 'mt-01',
    username: 'mesa.tecnica',
    nombre: 'Ana Morales',
    rol: 'MESA_TECNICA',
    activo: true,
    fechaCreacion: '2026-10-03T09:15:00-04:00',
  },
  {
    id: 'ger-01',
    username: 'gerente.redes',
    nombre: 'Roberto Silva',
    rol: 'GERENTE_AREA',
    area: 'Redes',
    activo: true,
    fechaCreacion: '2026-10-05T10:30:00-04:00',
  },
  {
    id: 'ger-02',
    username: 'gerente.soporte',
    nombre: 'Patricia Vega',
    rol: 'GERENTE_AREA',
    area: 'Soporte Técnico',
    activo: true,
    fechaCreacion: '2026-10-05T11:00:00-04:00',
  },
  {
    id: 'tec-01',
    username: 'tecnico.01',
    nombre: 'Luis Mendoza',
    rol: 'TECNICO',
    area: 'Soporte Técnico',
    activo: true,
    fechaCreacion: '2026-10-08T08:45:00-04:00',
  },
  {
    id: 'tec-02',
    username: 'tecnico.redes',
    nombre: 'Diego Herrera',
    rol: 'TECNICO',
    area: 'Redes',
    activo: true,
    fechaCreacion: '2026-10-10T14:20:00-04:00',
  },
  {
    id: 'tec-03',
    username: 'tecnico.apps',
    nombre: 'Sofía Castro',
    rol: 'TECNICO',
    area: 'Aplicaciones',
    activo: false,
    fechaCreacion: '2026-10-12T16:00:00-04:00',
  },
  {
    id: 'gg-01',
    username: 'gerente.general',
    nombre: 'Carlos Mendoza',
    rol: 'GERENTE_GENERAL',
    activo: true,
    fechaCreacion: '2026-10-01T08:30:00-04:00',
  },
];

const MOCK_DEPARTAMENTOS_MAESTROS: readonly DepartamentoMaestro[] = [
  {
    id: 'dep-01',
    codigo: 'CONT',
    nombre: 'Contabilidad y Finanzas',
    responsable: 'María González',
    ubicacion: 'Edificio Principal - Piso 2',
    extensionTelefonica: '210',
    activo: true,
  },
  {
    id: 'dep-02',
    codigo: 'VTAS',
    nombre: 'Ventas y Comercialización',
    responsable: 'Carlos Pérez',
    ubicacion: 'Edificio Principal - Piso 1',
    extensionTelefonica: '115',
    activo: true,
  },
  {
    id: 'dep-03',
    codigo: 'RRHH',
    nombre: 'Recursos Humanos',
    responsable: 'Luisa Fernández',
    ubicacion: 'Edificio Principal - Piso 3',
    extensionTelefonica: '305',
    activo: true,
  },
  {
    id: 'dep-04',
    codigo: 'ALMC',
    nombre: 'Almacén y Despacho',
    responsable: 'Jorge Ramírez',
    ubicacion: 'Nave Logística - Planta Baja',
    extensionTelefonica: '410',
    activo: true,
  },
  {
    id: 'dep-05',
    codigo: 'COMP',
    nombre: 'Compras y Suministros',
    responsable: 'Elena Torres',
    ubicacion: 'Edificio Principal - Piso 2',
    extensionTelefonica: '225',
    activo: true,
  },
];

export const useCatalogosStore = defineStore('catalogos', {
  state: (): CatalogosState => ({
    usuarios: [],
    departamentos: [],
    tiposCaso: [],
    slas: [],
  }),

  actions: {
    async cargarUsuarios(): Promise<void> {
      if (this.usuarios.length > 0) return;

      // TODO: Integrar endpoint GET /api/v1/admin/usuarios para listar usuarios del sistema
      // const { data } = await api.get<UsuarioMaestro[]>('/admin/usuarios');
      // this.usuarios = data;

      this.usuarios = await Promise.resolve(MOCK_USUARIOS_MAESTROS.map((u) => ({ ...u })));
    },

    async crearUsuario(payload: PayloadUsuarioMaestro): Promise<UsuarioMaestro> {
      const usernameNorm = payload.username.trim().toLowerCase();
      const duplicado = this.usuarios.some((u) => u.username.toLowerCase() === usernameNorm);
      if (duplicado) {
        throw new Error('Ya existe un usuario registrado con ese nombre de usuario.');
      }

      // TODO: Integrar endpoint POST /api/v1/admin/usuarios para crear usuario
      // const { data } = await api.post<UsuarioMaestro>('/admin/usuarios', payload);
      // this.usuarios.unshift(data);
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const nuevo: UsuarioMaestro = {
        id: `usr-${Date.now()}`,
        username: usernameNorm,
        nombre: payload.nombre.trim(),
        rol: payload.rol,
        ...(payload.area ? { area: payload.area } : {}),
        activo: payload.activo,
        fechaCreacion: new Date().toISOString(),
      };

      this.usuarios.unshift(nuevo);
      return nuevo;
    },

    async actualizarUsuario(id: string, payload: PayloadUsuarioMaestro): Promise<UsuarioMaestro> {
      const idx = this.usuarios.findIndex((u) => u.id === id);
      if (idx === -1) {
        throw new Error('No se encontró el usuario a actualizar.');
      }

      const usernameNorm = payload.username.trim().toLowerCase();
      const duplicado = this.usuarios.some(
        (u) => u.id !== id && u.username.toLowerCase() === usernameNorm,
      );
      if (duplicado) {
        throw new Error('Ese nombre de usuario ya está asignado a otra cuenta.');
      }

      // TODO: Integrar endpoint PUT /api/v1/admin/usuarios/:id para actualizar datos y rol
      // const { data } = await api.put<UsuarioMaestro>(`/admin/usuarios/${id}`, payload);
      // this.usuarios[idx] = data;
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const actual = this.usuarios[idx]!;
      const actualizado: UsuarioMaestro = {
        id: actual.id,
        username: usernameNorm,
        nombre: payload.nombre.trim(),
        rol: payload.rol,
        ...(payload.area ? { area: payload.area } : {}),
        activo: payload.activo,
        fechaCreacion: actual.fechaCreacion,
      };

      this.usuarios[idx] = actualizado;
      return actualizado;
    },

    async alternarEstadoUsuario(id: string): Promise<void> {
      const usuario = this.usuarios.find((u) => u.id === id);
      if (!usuario) return;

      // TODO: Integrar endpoint PATCH /api/v1/admin/usuarios/:id/estado para activar/desactivar cuenta
      // await api.patch(`/admin/usuarios/${id}/estado`, { activo: !usuario.activo });

      await Promise.resolve();
      usuario.activo = !usuario.activo;
    },

    async cargarDepartamentos(): Promise<void> {
      if (this.departamentos.length > 0) return;

      // TODO: Integrar endpoint GET /api/v1/admin/departamentos para listar departamentos
      // const { data } = await api.get<DepartamentoMaestro[]>('/admin/departamentos');
      // this.departamentos = data;

      this.departamentos = await Promise.resolve(
        MOCK_DEPARTAMENTOS_MAESTROS.map((d) => ({ ...d })),
      );
    },

    async crearDepartamento(payload: PayloadDepartamentoMaestro): Promise<DepartamentoMaestro> {
      const codigoNorm = payload.codigo.trim().toUpperCase();
      const duplicado = this.departamentos.some((d) => d.codigo.toUpperCase() === codigoNorm);
      if (duplicado) {
        throw new Error('Ya existe un departamento registrado con ese código.');
      }

      // TODO: Integrar endpoint POST /api/v1/admin/departamentos para crear departamento
      // const { data } = await api.post<DepartamentoMaestro>('/admin/departamentos', payload);
      // this.departamentos.unshift(data);
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const nuevo: DepartamentoMaestro = {
        id: `dep-${Date.now()}`,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        responsable: payload.responsable.trim(),
        ubicacion: payload.ubicacion.trim(),
        extensionTelefonica: payload.extensionTelefonica.trim(),
        activo: payload.activo,
      };

      this.departamentos.unshift(nuevo);
      return nuevo;
    },

    async actualizarDepartamento(
      id: string,
      payload: PayloadDepartamentoMaestro,
    ): Promise<DepartamentoMaestro> {
      const idx = this.departamentos.findIndex((d) => d.id === id);
      if (idx === -1) {
        throw new Error('No se encontró el departamento a actualizar.');
      }

      const codigoNorm = payload.codigo.trim().toUpperCase();
      const duplicado = this.departamentos.some(
        (d) => d.id !== id && d.codigo.toUpperCase() === codigoNorm,
      );
      if (duplicado) {
        throw new Error('Ese código ya pertenece a otro departamento.');
      }

      // TODO: Integrar endpoint PUT /api/v1/admin/departamentos/:id para actualizar departamento
      // const { data } = await api.put<DepartamentoMaestro>(`/admin/departamentos/${id}`, payload);
      // this.departamentos[idx] = data;
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const actualizado: DepartamentoMaestro = {
        id,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        responsable: payload.responsable.trim(),
        ubicacion: payload.ubicacion.trim(),
        extensionTelefonica: payload.extensionTelefonica.trim(),
        activo: payload.activo,
      };

      this.departamentos[idx] = actualizado;
      return actualizado;
    },

    async alternarEstadoDepartamento(id: string): Promise<void> {
      const depto = this.departamentos.find((d) => d.id === id);
      if (!depto) return;

      // TODO: Integrar endpoint PATCH /api/v1/admin/departamentos/:id/estado para activar/desactivar
      // await api.patch(`/admin/departamentos/${id}/estado`, { activo: !depto.activo });

      await Promise.resolve();
      depto.activo = !depto.activo;
    },

    async cargarTiposCaso(): Promise<void> {
      if (this.tiposCaso.length > 0) return;

      // TODO: Integrar endpoint GET /api/v1/admin/catalogo-casos para listar catálogo de casos
      // const { data } = await api.get<TipoCasoMaestro[]>('/admin/catalogo-casos');
      // this.tiposCaso = data;

      const iniciales: readonly TipoCasoMaestro[] = [
        {
          id: 'tc-01',
          codigo: 'INC-RED-01',
          nombre: 'Caída de enlace o switch de piso',
          naturaleza: 'Incidencia',
          areaDestino: 'Redes',
          prioridadSugerida: 'Crítica',
          requiereEquipo: true,
          activo: true,
        },
        {
          id: 'tc-02',
          codigo: 'INC-SOP-01',
          nombre: 'Falla de estación de trabajo o impresora',
          naturaleza: 'Incidencia',
          areaDestino: 'Soporte Técnico',
          prioridadSugerida: 'Alta',
          requiereEquipo: true,
          activo: true,
        },
        {
          id: 'tc-03',
          codigo: 'REQ-SOP-01',
          nombre: 'Instalación de periférico o reubicación de equipo',
          naturaleza: 'Requerimiento de Servicio',
          areaDestino: 'Soporte Técnico',
          prioridadSugerida: 'Baja',
          requiereEquipo: true,
          activo: true,
        },
        {
          id: 'tc-04',
          codigo: 'INC-APP-01',
          nombre: 'Error en sistema administrativo / Nómina',
          naturaleza: 'Incidencia',
          areaDestino: 'Aplicaciones',
          prioridadSugerida: 'Alta',
          requiereEquipo: false,
          activo: true,
        },
        {
          id: 'tc-05',
          codigo: 'DEV-EVO-01',
          nombre: 'Nuevo reporte o mejora evolutiva de sistema',
          naturaleza: 'Desarrollo',
          areaDestino: 'Desarrollo',
          prioridadSugerida: 'Media',
          requiereEquipo: false,
          activo: true,
        },
        {
          id: 'tc-06',
          codigo: 'INT-MNT-01',
          nombre: 'Respaldo de servidores y mantenimiento preventivo',
          naturaleza: 'Actividad Interna',
          areaDestino: 'Redes',
          prioridadSugerida: 'Media',
          requiereEquipo: true,
          activo: true,
        },
      ];

      this.tiposCaso = await Promise.resolve(iniciales.map((c) => ({ ...c })));
    },

    async crearTipoCaso(payload: PayloadTipoCasoMaestro): Promise<TipoCasoMaestro> {
      const codigoNorm = payload.codigo.trim().toUpperCase();
      const duplicado = this.tiposCaso.some((c) => c.codigo.toUpperCase() === codigoNorm);
      if (duplicado) {
        throw new Error('Ya existe un tipo de caso registrado con ese código.');
      }

      // TODO: Integrar endpoint POST /api/v1/admin/catalogo-casos para crear tipo de caso
      // const { data } = await api.post<TipoCasoMaestro>('/admin/catalogo-casos', payload);
      // this.tiposCaso.unshift(data);
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const nuevo: TipoCasoMaestro = {
        id: `tc-${Date.now()}`,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        naturaleza: payload.naturaleza,
        areaDestino: payload.areaDestino,
        prioridadSugerida: payload.prioridadSugerida,
        requiereEquipo: payload.requiereEquipo,
        activo: payload.activo,
      };

      this.tiposCaso.unshift(nuevo);
      return nuevo;
    },

    async actualizarTipoCaso(
      id: string,
      payload: PayloadTipoCasoMaestro,
    ): Promise<TipoCasoMaestro> {
      const idx = this.tiposCaso.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new Error('No se encontró el tipo de caso a actualizar.');
      }

      const codigoNorm = payload.codigo.trim().toUpperCase();
      const duplicado = this.tiposCaso.some(
        (c) => c.id !== id && c.codigo.toUpperCase() === codigoNorm,
      );
      if (duplicado) {
        throw new Error('Ese código ya pertenece a otro tipo de caso.');
      }

      // TODO: Integrar endpoint PUT /api/v1/admin/catalogo-casos/:id para actualizar tipo de caso
      // const { data } = await api.put<TipoCasoMaestro>(`/admin/catalogo-casos/${id}`, payload);
      // this.tiposCaso[idx] = data;
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const actualizado: TipoCasoMaestro = {
        id,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        naturaleza: payload.naturaleza,
        areaDestino: payload.areaDestino,
        prioridadSugerida: payload.prioridadSugerida,
        requiereEquipo: payload.requiereEquipo,
        activo: payload.activo,
      };

      this.tiposCaso[idx] = actualizado;
      return actualizado;
    },

    async alternarEstadoTipoCaso(id: string): Promise<void> {
      const item = this.tiposCaso.find((c) => c.id === id);
      if (!item) return;

      // TODO: Integrar endpoint PATCH /api/v1/admin/catalogo-casos/:id/estado para activar/desactivar
      // await api.patch(`/admin/catalogo-casos/${id}/estado`, { activo: !item.activo });

      await Promise.resolve();
      item.activo = !item.activo;
    },

    async cargarSlas(): Promise<void> {
      if (this.slas.length > 0) return;

      // TODO: Integrar endpoint GET /api/v1/admin/slas para consultar la matriz de niveles de servicio
      // const { data } = await api.get<ConfiguracionSla[]>('/admin/slas');
      // this.slas = data;

      const iniciales: readonly ConfiguracionSla[] = [
        {
          id: 'sla-01',
          prioridad: 'Crítica',
          criterio: 'Paraliza toda la empresa, un área clave completa o un proceso crítico sin alternativa.',
          ejemploCorporativo: 'Caída de servidor administrativo o corte de red en cierre de nómina.',
          minutosMetaAsignacion: 15,
          horasResolucionMin: 1,
          horasResolucionMax: 4,
          activaSuplenciaMesa: true,
          minutosUmbralSuplencia: 15,
        },
        {
          id: 'sla-02',
          prioridad: 'Alta',
          criterio: 'Afecta severamente a un departamento o puesto clave sin detener toda la empresa.',
          ejemploCorporativo: 'Falla en estación de caja/despacho o impresora departamental única.',
          minutosMetaAsignacion: 30,
          horasResolucionMin: 4,
          horasResolucionMax: 8,
          activaSuplenciaMesa: true,
          minutosUmbralSuplencia: 30,
        },
        {
          id: 'sla-03',
          prioridad: 'Media',
          criterio: 'Falla individual con impacto moderado o requerimiento operativo estándar.',
          ejemploCorporativo: 'Falla en PC individual con contingencia o configuración de periférico.',
          minutosMetaAsignacion: 120,
          horasResolucionMin: 8,
          horasResolucionMax: 24,
          activaSuplenciaMesa: false,
          minutosUmbralSuplencia: 120,
        },
        {
          id: 'sla-04',
          prioridad: 'Baja',
          criterio: 'Consultas menores, mejoras estéticas o instalaciones no urgentes programables.',
          ejemploCorporativo: 'Reubicación física de equipo o solicitud de accesorio secundario.',
          minutosMetaAsignacion: 240,
          horasResolucionMin: 24,
          horasResolucionMax: 72,
          activaSuplenciaMesa: false,
          minutosUmbralSuplencia: 240,
        },
      ];

      this.slas = await Promise.resolve(iniciales.map((s) => ({ ...s })));
    },

    async actualizarSla(id: string, payload: PayloadConfiguracionSla): Promise<ConfiguracionSla> {
      const idx = this.slas.findIndex((s) => s.id === id);
      if (idx === -1) {
        throw new Error('No se encontró el nivel de servicio a actualizar.');
      }

      // TODO: Integrar endpoint PUT /api/v1/admin/slas/:id para actualizar parámetros de SLA
      // const { data } = await api.put<ConfiguracionSla>(`/admin/slas/${id}`, payload);
      // this.slas[idx] = data;
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      const actual = this.slas[idx]!;
      const actualizado: ConfiguracionSla = {
        id: actual.id,
        prioridad: actual.prioridad,
        criterio: payload.criterio.trim(),
        ejemploCorporativo: payload.ejemploCorporativo.trim(),
        minutosMetaAsignacion: payload.minutosMetaAsignacion,
        horasResolucionMin: payload.horasResolucionMin,
        horasResolucionMax: payload.horasResolucionMax,
        activaSuplenciaMesa: payload.activaSuplenciaMesa,
        minutosUmbralSuplencia: payload.minutosUmbralSuplencia,
      };

      this.slas[idx] = actualizado;
      return actualizado;
    },
  },
});
