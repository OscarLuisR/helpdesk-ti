export type TonoTipoDepartamento = 'gerencia' | 'subgerencia' | 'usuaria' | 'extra1' | 'extra2';

export interface EstiloTipoDepartamento {
  tono: TonoTipoDepartamento;
  claseTono: string;
  icono: string;
  alcance: string;
}

function normalizarNombre(nombre: string): string {
  return (nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Asigna de forma determinista el tono Mineral (Paleta A), ícono estructural y alcance
 * para cada Tipo de Departamento, garantizando diferenciación frente a Roles, Prioridades y Estados.
 */
export function resolverEstiloTipoDepartamento(
  nombre: string,
  idTipo?: number | null,
): EstiloTipoDepartamento {
  const n = normalizarNombre(nombre);

  if (n.includes('sub') && (n.includes('gerencia') || n.includes('ti'))) {
    return {
      tono: 'subgerencia',
      claseTono: 'tipo-depto-tone--subgerencia',
      icono: 'account_tree',
      alcance: 'Resolución TI',
    };
  }

  if (n.includes('gerencia') || n.includes('direccion')) {
    return {
      tono: 'gerencia',
      claseTono: 'tipo-depto-tone--gerencia',
      icono: 'shield',
      alcance: 'Gobierno TI',
    };
  }

  if (n.includes('usuaria') || n.includes('usuario') || n.includes('cliente') || n.includes('solicitante')) {
    return {
      tono: 'usuaria',
      claseTono: 'tipo-depto-tone--usuaria',
      icono: 'domain',
      alcance: 'Solicitante',
    };
  }

  // Respaldo determinista para futuros tipos personalizados (4º, 5º, etc.)
  const indice = typeof idTipo === 'number' && idTipo > 0 ? idTipo % 2 : n.length % 2;
  if (indice === 0) {
    return {
      tono: 'extra1',
      claseTono: 'tipo-depto-tone--extra1',
      icono: 'category',
      alcance: 'Clasificación',
    };
  }

  return {
    tono: 'extra2',
    claseTono: 'tipo-depto-tone--extra2',
    icono: 'layers',
    alcance: 'Clasificación',
  };
}
