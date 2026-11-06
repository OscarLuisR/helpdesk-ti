import { defineStore } from 'pinia';

export type EstadoDepartamento = 'Activo' | 'Inactivo';

export interface Department {
  id: number;
  codigo: string;
  nombre: string;
  responsable: string;
  telefono: string;
  ubicacion?: string;
  esSubgerenciaTI: boolean;
  estado: EstadoDepartamento;
}

export interface DepartmentFormPayload {
  codigo: string;
  nombre: string;
  responsable: string;
  telefono: string;
  ubicacion?: string;
  esSubgerenciaTI: boolean;
  estado: EstadoDepartamento;
}

const MOCK_DEPARTMENTS: readonly Department[] = [
  {
    id: 1,
    codigo: 'TI-SOP',
    nombre: 'Soporte Técnico y Atención a Usuarios',
    responsable: 'Patricia Vega',
    telefono: '0414-3021144',
    ubicacion: 'Edificio Principal - Piso 3',
    esSubgerenciaTI: true,
    estado: 'Activo',
  },
  {
    id: 2,
    codigo: 'TI-RED',
    nombre: 'Infraestructura, Redes y Telecomunicaciones',
    responsable: 'Roberto Silva',
    telefono: '0424-3035588',
    ubicacion: 'Centro de Datos - Piso 3',
    esSubgerenciaTI: true,
    estado: 'Activo',
  },
  {
    id: 3,
    codigo: 'TI-APP',
    nombre: 'Sistemas y Desarrollo de Aplicaciones',
    responsable: 'Sofía Castro',
    telefono: '0412-3047711',
    ubicacion: 'Edificio Principal - Piso 3',
    esSubgerenciaTI: true,
    estado: 'Activo',
  },
  {
    id: 4,
    codigo: 'TI-MT',
    nombre: 'Mesa Técnica y Gestión de Incidentes',
    responsable: 'Ana Morales',
    telefono: '0414-3019922',
    ubicacion: 'Edificio Principal - Piso 3',
    esSubgerenciaTI: true,
    estado: 'Activo',
  },
  {
    id: 5,
    codigo: 'CONT',
    nombre: 'Contabilidad y Finanzas',
    responsable: 'María González',
    telefono: '0416-2104433',
    ubicacion: 'Edificio Principal - Piso 2',
    esSubgerenciaTI: false,
    estado: 'Activo',
  },
  {
    id: 6,
    codigo: 'RRHH',
    nombre: 'Gestión Humana y Relaciones Laborales',
    responsable: 'Luisa Fernández',
    telefono: '0424-3058899',
    ubicacion: 'Edificio Principal - Piso 3',
    esSubgerenciaTI: false,
    estado: 'Activo',
  },
  {
    id: 7,
    codigo: 'VTAS',
    nombre: 'Ventas y Comercialización',
    responsable: 'Carlos Pérez',
    telefono: '0412-1156622',
    ubicacion: 'Edificio Principal - Piso 1',
    esSubgerenciaTI: false,
    estado: 'Activo',
  },
  {
    id: 8,
    codigo: 'COMP',
    nombre: 'Compras y Suministros',
    responsable: 'Elena Torres',
    telefono: '0424-2253300',
    ubicacion: 'Edificio Principal - Piso 2',
    esSubgerenciaTI: false,
    estado: 'Inactivo',
  },
];

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: MOCK_DEPARTMENTS.map((d) => ({ ...d })),
  }),

  getters: {
    departamentosActivos: (state): Department[] =>
      state.departments.filter((d) => d.estado === 'Activo'),
    subgerenciasTI: (state): Department[] =>
      state.departments.filter((d) => d.esSubgerenciaTI && d.estado === 'Activo'),
    departamentosRegulares: (state): Department[] =>
      state.departments.filter((d) => !d.esSubgerenciaTI && d.estado === 'Activo'),
    nombresDepartamentosActivos: (state): string[] =>
      state.departments.filter((d) => d.estado === 'Activo').map((d) => d.nombre),
  },

  actions: {
    async agregarDepartamento(payload: DepartmentFormPayload): Promise<Department> {
      const codigoNorm = payload.codigo.trim().toUpperCase();
      if (this.departments.some((d) => d.codigo.toUpperCase() === codigoNorm)) {
        throw new Error('Ya existe un departamento registrado con ese código.');
      }
      // TODO: Integrar endpoint REST para Crear Departamento (POST /api/v1/admin/departamentos)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const siguienteId = this.departments.reduce((max, d) => Math.max(max, d.id), 0) + 1;
      const nuevo: Department = {
        id: siguienteId,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        responsable: payload.responsable.trim(),
        telefono: payload.telefono.trim(),
        ubicacion: payload.ubicacion?.trim() || '',
        esSubgerenciaTI: payload.esSubgerenciaTI,
        estado: payload.estado,
      };
      this.departments.unshift(nuevo);
      return nuevo;
    },

    async actualizarDepartamento(id: number, payload: DepartmentFormPayload): Promise<Department> {
      const idx = this.departments.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('No se encontró el departamento a actualizar.');

      const codigoNorm = payload.codigo.trim().toUpperCase();
      const duplicado = this.departments.some(
        (d) => d.id !== id && d.codigo.toUpperCase() === codigoNorm,
      );
      if (duplicado) throw new Error('Ese código ya pertenece a otro departamento registrado.');

      // TODO: Integrar endpoint REST para Actualizar Departamento (PUT /api/v1/admin/departamentos/:id)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const actualizado: Department = {
        id,
        codigo: codigoNorm,
        nombre: payload.nombre.trim(),
        responsable: payload.responsable.trim(),
        telefono: payload.telefono.trim(),
        ubicacion: payload.ubicacion?.trim() || '',
        esSubgerenciaTI: payload.esSubgerenciaTI,
        estado: payload.estado,
      };
      this.departments[idx] = actualizado;
      return actualizado;
    },

    async alternarEstado(id: number): Promise<Department> {
      const depto = this.departments.find((d) => d.id === id);
      if (!depto) throw new Error('No se encontró el departamento.');

      // TODO: Integrar endpoint REST para Cambiar Estado (Soft Delete) (PATCH /api/v1/admin/departamentos/:id/estado)
      await new Promise((resolve) => setTimeout(resolve, 200));
      depto.estado = depto.estado === 'Activo' ? 'Inactivo' : 'Activo';
      return depto;
    },

    async eliminarDepartamento(id: number): Promise<void> {
      await this.alternarEstado(id);
    },
  },
});
