import { ref } from 'vue';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  detalle?: string;
  textoConfirmar: string;
  color: string;
  icono: string;
}

const OPCIONES_POR_DEFECTO: OpcionesConfirmacion = {
  titulo: 'Confirmar acción',
  mensaje: '¿Deseas continuar?',
  textoConfirmar: 'Confirmar',
  color: 'primary',
  icono: 'help_outline',
};

/**
 * Construye las opciones del diálogo para activar o desactivar un registro.
 * @param entidad Nombre de la entidad con artículo (ej. "el rol", "la prioridad").
 * @param nombre Identificador visible del registro.
 * @param estaActivo Estado actual del registro (antes del cambio).
 */
export function opcionesCambioEstado(
  entidad: string,
  nombre: string,
  estaActivo: boolean,
): OpcionesConfirmacion {
  if (estaActivo) {
    return {
      titulo: 'Confirmar desactivación',
      mensaje: `¿Deseas desactivar ${entidad} "${nombre}"?`,
      detalle: 'El registro dejará de estar disponible para nuevas operaciones.',
      textoConfirmar: 'Desactivar',
      color: 'negative',
      icono: 'block',
    };
  }
  return {
    titulo: 'Confirmar activación',
    mensaje: `¿Deseas activar ${entidad} "${nombre}"?`,
    detalle: 'El registro volverá a estar disponible para nuevas operaciones.',
    textoConfirmar: 'Activar',
    color: 'positive',
    icono: 'check_circle_outline',
  };
}

/**
 * Estado reutilizable para ConfirmarAccionDialog.vue.
 * `solicitarConfirmacion` abre el diálogo y resuelve true/false según la respuesta del usuario.
 */
export function useConfirmacion() {
  const confirmacionAbierta = ref(false);
  const confirmacionOpciones = ref<OpcionesConfirmacion>({ ...OPCIONES_POR_DEFECTO });
  let resolverPendiente: ((confirmado: boolean) => void) | null = null;

  function solicitarConfirmacion(opciones: OpcionesConfirmacion): Promise<boolean> {
    resolverPendiente?.(false);
    confirmacionOpciones.value = opciones;
    confirmacionAbierta.value = true;
    return new Promise<boolean>((resolve) => {
      resolverPendiente = resolve;
    });
  }

  function responderConfirmacion(confirmado: boolean): void {
    confirmacionAbierta.value = false;
    const resolver = resolverPendiente;
    resolverPendiente = null;
    resolver?.(confirmado);
  }

  return {
    confirmacionAbierta,
    confirmacionOpciones,
    solicitarConfirmacion,
    responderConfirmacion,
  };
}
