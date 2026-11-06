import { defineStore } from 'pinia';
import type { RolUsuario } from '@/models/types';

export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface User {
  id: number;
  nombre: string;
  username: string;
  telefono: string;
  departamento: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
}

export interface UserFormPayload {
  nombre: string;
  username: string;
  telefono: string;
  departamento: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
}

export const DEPARTAMENTOS_SISTEMA: readonly string[] = [
  'Tecnología - Mesa Técnica',
  'Tecnología - Soporte Técnico',
  'Tecnología - Redes',
  'Tecnología - Aplicaciones y Desarrollo',
  'Gerencia General de Tecnología',
  'Contabilidad y Finanzas',
  'Ventas y Comercialización',
  'Recursos Humanos',
  'Almacén y Despacho',
  'Compras y Suministros',
];

const MOCK_USERS: readonly User[] = [
  {
    id: 1,
    nombre: 'Administrador TI',
    username: 'admin',
    telefono: '0412-2964550',
    departamento: 'Gerencia General de Tecnología',
    rol: 'ADMINISTRADOR',
    estado: 'Activo',
    fechaRegistro: '01/10/2026',
  },
  {
    id: 2,
    nombre: 'Ana Morales',
    username: 'mesa.tecnica',
    telefono: '0414-3819204',
    departamento: 'Tecnología - Mesa Técnica',
    rol: 'MESA_TECNICA',
    estado: 'Activo',
    fechaRegistro: '03/10/2026',
  },
  {
    id: 3,
    nombre: 'Roberto Silva',
    username: 'gerente.redes',
    telefono: '0412-7458319',
    departamento: 'Tecnología - Redes',
    rol: 'GERENTE_AREA',
    estado: 'Activo',
    fechaRegistro: '05/10/2026',
  },
  {
    id: 4,
    nombre: 'Patricia Vega',
    username: 'gerente.soporte',
    telefono: '0424-1948372',
    departamento: 'Tecnología - Soporte Técnico',
    rol: 'GERENTE_AREA',
    estado: 'Activo',
    fechaRegistro: '05/10/2026',
  },
  {
    id: 5,
    nombre: 'Luis Mendoza',
    username: 'tecnico.01',
    telefono: '0414-9026415',
    departamento: 'Tecnología - Soporte Técnico',
    rol: 'TECNICO',
    estado: 'Activo',
    fechaRegistro: '08/10/2026',
  },
  {
    id: 6,
    nombre: 'Diego Herrera',
    username: 'tecnico.redes',
    telefono: '0424-5183920',
    departamento: 'Tecnología - Redes',
    rol: 'TECNICO',
    estado: 'Activo',
    fechaRegistro: '10/10/2026',
  },
  {
    id: 7,
    nombre: 'Carlos Mendoza',
    username: 'gerente.general',
    telefono: '0412-8304716',
    departamento: 'Gerencia General de Tecnología',
    rol: 'GERENTE_GENERAL',
    estado: 'Activo',
    fechaRegistro: '01/10/2026',
  },
  {
    id: 8,
    nombre: 'María González',
    username: 'solicitante',
    telefono: '0416-6204918',
    departamento: 'Contabilidad y Finanzas',
    rol: 'USUARIO',
    estado: 'Activo',
    fechaRegistro: '12/10/2026',
  },
  {
    id: 9,
    nombre: 'Sofía Castro',
    username: 'tecnico.apps',
    telefono: '0412-4092831',
    departamento: 'Tecnología - Aplicaciones y Desarrollo',
    rol: 'TECNICO',
    estado: 'Inactivo',
    fechaRegistro: '14/10/2026',
  },
];

interface UsersState {
  users: User[];
}

function formatearFechaActual(): string {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: MOCK_USERS.map((u) => ({ ...u })),
  }),

  actions: {
    async agregarUsuario(payload: UserFormPayload): Promise<User> {
      const usernameNorm = payload.username.trim().toLowerCase();
      const duplicado = this.users.some((u) => u.username.toLowerCase() === usernameNorm);
      if (duplicado) {
        throw new Error('Ya existe un usuario registrado con ese login.');
      }

      // TODO: Integrar endpoint REST para Crear Usuario (POST /api/v1/admin/usuarios)
      await new Promise((resolve) => setTimeout(resolve, 350));

      const siguienteId = this.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      const nuevo: User = {
        id: siguienteId,
        nombre: payload.nombre.trim(),
        username: usernameNorm,
        telefono: payload.telefono.trim(),
        departamento: payload.departamento,
        rol: payload.rol,
        estado: payload.estado,
        fechaRegistro: formatearFechaActual(),
      };

      this.users.unshift(nuevo);
      return nuevo;
    },

    async actualizarUsuario(id: number, payload: UserFormPayload): Promise<User> {
      const idx = this.users.findIndex((u) => u.id === id);
      if (idx === -1) {
        throw new Error('No se encontró el usuario a actualizar.');
      }

      const usernameNorm = payload.username.trim().toLowerCase();
      const duplicado = this.users.some(
        (u) => u.id !== id && u.username.toLowerCase() === usernameNorm,
      );
      if (duplicado) {
        throw new Error('Ese nombre de usuario ya está asignado a otra cuenta.');
      }

      // TODO: Integrar endpoint REST para Actualizar Usuario (PUT /api/v1/admin/usuarios/:id)
      await new Promise((resolve) => setTimeout(resolve, 350));

      const actual = this.users[idx]!;
      const actualizado: User = {
        id: actual.id,
        nombre: payload.nombre.trim(),
        username: usernameNorm,
        telefono: payload.telefono.trim(),
        departamento: payload.departamento,
        rol: payload.rol,
        estado: payload.estado,
        fechaRegistro: actual.fechaRegistro,
      };

      this.users[idx] = actualizado;
      return actualizado;
    },

    async eliminarUsuario(id: number): Promise<void> {
      const usuario = this.users.find((u) => u.id === id);
      if (!usuario) return;

      // TODO: Integrar endpoint REST para Eliminar / Desactivar Usuario (DELETE /api/v1/admin/usuarios/:id)
      await Promise.resolve();
      usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    },

    async resetearPasswordUsuario(id: number, nuevaPassword: string): Promise<void> {
      const usuario = this.users.find((u) => u.id === id);
      if (!usuario) {
        throw new Error('No se encontró el usuario para restablecer la contraseña.');
      }
      if (nuevaPassword.trim().length < 8) {
        throw new Error('La contraseña temporal debe tener al menos 8 caracteres.');
      }

      // TODO: Integrar endpoint REST para Resetear Contraseña de Usuario (POST /api/v1/admin/usuarios/:id/reset-password)
      await new Promise((resolve) => setTimeout(resolve, 350));
    },
  },
});
