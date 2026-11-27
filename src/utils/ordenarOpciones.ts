// 🛡️ [FASE 3 - UI COMBOS] Utilitario inmutable de ordenamiento alfabético (es) para combos y selectores

const comparadorEspanol = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});

/**
 * Compara dos textos en español ignorando mayúsculas/minúsculas y tildes.
 */
export function compararTextoEs(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return comparadorEspanol.compare((a ?? '').trim(), (b ?? '').trim());
}

/**
 * Devuelve una nueva copia ordenada alfabéticamente por la descripción visible del ítem.
 * No muta el arreglo original (seguro para props y estado reactivo de Pinia).
 */
export function ordenarPorTexto<T>(
  items: readonly T[],
  obtenerTexto: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort((a, b) => compararTextoEs(obtenerTexto(a), obtenerTexto(b)));
}

/**
 * Ordena elementos del catálogo de incidencias primero por departamento y luego por incidencia.
 */
export function ordenarCatalogoPorDepartamentoEIncidencia<
  T extends { departamento: string; nombre: string },
>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) =>
      compararTextoEs(a.departamento, b.departamento) || compararTextoEs(a.nombre, b.nombre),
  );
}
