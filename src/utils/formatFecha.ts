// 🛡️ [FASE 3 - FORMATO FECHA] Formato unificado 12 horas en todo el sistema: "DD/MM/AA hh:mm a. m."

function parsearFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Retorna la fecha en formato corto `DD/MM/AA` (ej. `19/11/26`). */
export function formatearFechaCorta(valor: string | Date | null | undefined): string {
  const fecha = parsearFecha(valor);
  if (!fecha) return '';
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const yy = String(fecha.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Retorna la hora en formato 12 horas `hh:mm a. m.` / `hh:mm p. m.` (ej. `09:40 a. m.`). */
export function formatearHora12(valor: string | Date | null | undefined): string {
  const fecha = parsearFecha(valor);
  if (!fecha) return '';
  const horas24 = fecha.getHours();
  const periodo = horas24 >= 12 ? 'p. m.' : 'a. m.';
  const horas12 = horas24 % 12 === 0 ? 12 : horas24 % 12;
  const hh = String(horas12).padStart(2, '0');
  const min = String(fecha.getMinutes()).padStart(2, '0');
  return `${hh}:${min} ${periodo}`;
}

/** Retorna fecha y hora en formato `DD/MM/AA hh:mm a. m.` (ej. `19/11/26 09:40 a. m.`). */
export function formatearFechaHora(valor: string | Date | null | undefined): string {
  const fecha = parsearFecha(valor);
  if (!fecha) return '';
  return `${formatearFechaCorta(fecha)} ${formatearHora12(fecha)}`;
}
