import type { UsuarioSesion } from '@/models/auth';

export interface UsuarioMock extends UsuarioSesion {
  /** Solo para simulación local sin backend. Nunca exponer en estado ni en sessionStorage. */
  passwordMock: string;
}

// TODO: Eliminar este archivo mock al integrar POST /api/v1/auth/login con el backend real.
export const USUARIOS_MOCK: readonly UsuarioMock[] = [
  {
    id: 'usr-sol-01',
    username: 'solicitante',
    nombre: 'María González (Contabilidad)',
    rol: 'USUARIO',
    passwordMock: 'demo1234',
  },
  {
    id: 'adm-01',
    username: 'admin',
    nombre: 'Administrador TI',
    rol: 'ADMINISTRADOR',
    passwordMock: 'demo1234',
  },
  {
    id: 'mt-01',
    username: 'mesa.tecnica',
    nombre: 'Ana Morales',
    rol: 'MESA_TECNICA',
    passwordMock: 'demo1234',
  },
  {
    id: 'ger-01',
    username: 'gerente.redes',
    nombre: 'Roberto Silva',
    rol: 'GERENTE_AREA',
    area: 'Redes',
    passwordMock: 'demo1234',
  },
  {
    id: 'tec-01',
    username: 'tecnico.01',
    nombre: 'Luis Mendoza',
    rol: 'TECNICO',
    area: 'Soporte Técnico',
    passwordMock: 'demo1234',
  },
  {
    id: 'gg-01',
    username: 'gerente.general',
    nombre: 'Carlos Mendoza',
    rol: 'GERENTE_GENERAL',
    passwordMock: 'demo1234',
  },
];
