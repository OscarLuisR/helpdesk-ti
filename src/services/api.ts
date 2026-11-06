import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  // Habilita el envío/recepción automática de la cookie de sesión HttpOnly emitida por el backend
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// TODO: Activar interceptor de respuesta al conectar el backend para manejar expiración de cookie (HTTP 401)
// import { useAuthStore } from '@/stores/authStore';
//
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (axios.isAxiosError(error) && error.response?.status === 401) {
//       await useAuthStore().cerrarSesion();
//       window.location.assign('/');
//     }
//     return Promise.reject(error);
//   },
// );
