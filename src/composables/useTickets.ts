import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { EstadoTicket, Prioridad, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useDepartmentsStore } from '@/stores/useDepartmentsStore';
import { ordenarPorTexto } from '@/utils/ordenarOpciones';

// 🛡️ [FASE 2.3 / 3.6 - TICKETS] Composable de bandeja con selector mensual SQL, Sub-Gerencia TI y Técnico

export const FILTRO_DEPTO_TODAS = 0;
export const FILTRO_TECNICO_TODOS = 'TODOS';

export type ValorFiltroDepartamento = number;
export type ValorFiltroTecnico = number | 'SIN_ASIGNAR' | typeof FILTRO_TECNICO_TODOS;

export interface OpcionFiltroSelect<T> {
  valor: T;
  etiqueta: string;
}

export const NOMBRES_MESES: readonly string[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const NOMBRES_MESES_CORTOS: readonly string[] = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function formatearIsoDiaLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula el primer y último día calendario real del mes indicado (ej. Enero 2026 -> 2026-01-01 a 2026-01-31).
 */
export function calcularRangoMesCalendario(
  anio: number,
  mesIndex: number,
): { desde: string; hasta: string } {
  const primerDia = new Date(anio, mesIndex, 1);
  const ultimoDia = new Date(anio, mesIndex + 1, 0);
  return {
    desde: formatearIsoDiaLocal(primerDia),
    hasta: formatearIsoDiaLocal(ultimoDia),
  };
}

function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const ESTADOS_DISPONIBLES: readonly EstadoTicket[] = [
  'Abierto',
  'Asignado',
  'En Progreso',
  'En Espera',
  'Resuelto - Por Verificar',
  'Cerrado',
  'No Resuelto',
  'Cancelado',
  'Reabierto',
];

export const PRIORIDAD_CLASS: Record<Prioridad, string> = {
  Crítica: 'bad',
  Alta: 'warn',
  Media: 'info',
  Baja: 'neutral',
};

export function claseChipPrioridad(prioridad: string): string {
  const normalizada = prioridad.trim().toLowerCase();
  if (normalizada.includes('crít') || normalizada.includes('crit')) return 'bad';
  if (normalizada.includes('alta')) return 'warn';
  if (normalizada.includes('media')) return 'info';
  return 'neutral';
}

export const ESTADO_CLASS: Record<EstadoTicket, string> = {
  Abierto: 'estado-abierto',
  Asignado: 'estado-asignado',
  'En Progreso': 'estado-progreso',
  'En Espera': 'estado-espera',
  'Resuelto - Por Verificar': 'estado-verificar',
  Cerrado: 'estado-cerrado',
  'No Resuelto': 'estado-no-resuelto',
  Cancelado: 'estado-cancelado',
  Reabierto: 'estado-reabierto',
};

const AVATAR_COLORES = [
  { bg: 'rgba(15, 118, 110, 0.14)', fg: '#0f766e' },
  { bg: 'rgba(30, 58, 95, 0.14)', fg: '#1e3a5f' },
  { bg: 'rgba(245, 158, 11, 0.18)', fg: '#b45309' },
  { bg: 'rgba(2, 132, 199, 0.14)', fg: '#0284c7' },
  { bg: 'rgba(22, 163, 74, 0.14)', fg: '#16a34a' },
  { bg: 'rgba(100, 116, 139, 0.16)', fg: '#475569' },
];

export function inicialesSolicitante(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function avatarSolicitanteStyle(nombre: string): { backgroundColor: string; color: string } {
  let hash = 0;
  for (const ch of nombre) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR_COLORES[hash % AVATAR_COLORES.length]!;
  return { backgroundColor: color.bg, color: color.fg };
}

export function useTickets(modoRuta?: Ref<string | undefined>) {
  const authStore = useAuthStore();
  const ticketStore = useTicketStore();
  const departmentsStore = useDepartmentsStore();

  const ahora = new Date();
  const anioActualSistema = ahora.getFullYear();
  const mesActualSistema = ahora.getMonth();

  const anioSeleccionado = ref<number>(anioActualSistema);
  const mesSeleccionado = ref<number>(mesActualSistema);

  const esMesActual = computed(
    () =>
      anioSeleccionado.value === anioActualSistema &&
      mesSeleccionado.value === mesActualSistema,
  );

  // 🛡️ [FASE 3 - UI BANDEJA] Filtros iniciales limpios para todos los roles;
  // si la navegación proviene de una tarjeta KPI del Dashboard (?estado=), BandejaTicketsPage aplica ese estado.
  const busqueda = ref('');
  const estadosFiltro = ref<EstadoTicket[]>([]);
  const idDepartamentoFiltro = ref<ValorFiltroDepartamento>(FILTRO_DEPTO_TODAS);
  const idTecnicoFiltro = ref<ValorFiltroTecnico>(FILTRO_TECNICO_TODOS);

  // 🛡️ [FASE 4.2 - ESCALABILIDAD] Paginación real server-side (PostgreSQL LIMIT/OFFSET + COUNT(*) OVER())
  const paginaActual = ref<number>(1);
  const filasPorPagina = ref<number>(5);
  let montado = false;
  let timerBusqueda: ReturnType<typeof setTimeout> | null = null;

  const mostrarFiltroDepartamento = computed(() =>
    ['ADMINISTRADOR', 'MESA_TECNICA', 'DIRECTOR'].includes(authStore.role ?? ''),
  );

  const mostrarFiltroTecnico = computed(() =>
    ['ADMINISTRADOR', 'MESA_TECNICA', 'DIRECTOR', 'GERENTE_AREA'].includes(authStore.role ?? ''),
  );

  // 🛡️ [FASE 3 - UI COMBOS] Opciones dinámicas ordenadas A-Z preservando las opciones centinela arriba
  const opcionesDepartamentosTi = computed<OpcionFiltroSelect<ValorFiltroDepartamento>[]>(() => [
    { valor: FILTRO_DEPTO_TODAS, etiqueta: 'Todas las Sub-Gerencias TI' },
    ...ordenarPorTexto(
      departmentsStore.departments
        .filter((d) => d.is_activo && normalizarTexto(d.tipo_departamento) === 'SUB-GERENCIA TI')
        .map((d) => ({
          valor: d.id,
          etiqueta: d.nombre,
        })),
      (op) => op.etiqueta,
    ),
  ]);

  const opcionesTecnicosFiltro = computed<OpcionFiltroSelect<ValorFiltroTecnico>[]>(() => {
    const idDeptoSeleccionado = mostrarFiltroDepartamento.value
      ? idDepartamentoFiltro.value !== FILTRO_DEPTO_TODAS
        ? idDepartamentoFiltro.value
        : null
      : authStore.role === 'GERENTE_AREA' && authStore.usuario?.id_departamento !== undefined
        ? Number(authStore.usuario.id_departamento)
        : null;

    const tecnicos = ticketStore.tecnicosDisponibles.filter((t) =>
      idDeptoSeleccionado ? Number(t.id_departamento) === Number(idDeptoSeleccionado) : true,
    );

    return [
      { valor: FILTRO_TECNICO_TODOS, etiqueta: 'Todos los técnicos' },
      { valor: 'SIN_ASIGNAR', etiqueta: 'Sin asignar' },
      ...ordenarPorTexto(
        tecnicos.map((t) => ({
          valor: Number(t.id),
          etiqueta: t.nombre_completo,
        })),
        (op) => op.etiqueta,
      ),
    ];
  });

  function dispararRecargaDesdePrimeraPagina(): void {
    if (!montado) return;
    if (paginaActual.value !== 1) {
      paginaActual.value = 1;
    } else {
      void recargarTickets();
    }
  }

  watch(idDepartamentoFiltro, () => {
    if (
      typeof idTecnicoFiltro.value === 'number' &&
      !opcionesTecnicosFiltro.value.some((op) => op.valor === idTecnicoFiltro.value)
    ) {
      idTecnicoFiltro.value = FILTRO_TECNICO_TODOS;
    }
  });

  function aplicarFiltroPorDefecto(): void {
    estadosFiltro.value = [];
    idDepartamentoFiltro.value = FILTRO_DEPTO_TODAS;
    idTecnicoFiltro.value = FILTRO_TECNICO_TODOS;
  }

  watch(
    () => [authStore.role, modoRuta?.value] as const,
    () => {
      aplicarFiltroPorDefecto();
    },
  );

  async function recargarTickets(): Promise<void> {
    const rango = calcularRangoMesCalendario(anioSeleccionado.value, mesSeleccionado.value);
    const textoBusqueda = (busqueda.value ?? '').trim();

    await ticketStore.cargarTickets({
      fecha_desde: rango.desde,
      fecha_hasta: rango.hasta,
      page: paginaActual.value,
      limit: filasPorPagina.value,
      ...(textoBusqueda ? { q: textoBusqueda } : {}),
      ...(estadosFiltro.value.length > 0 ? { estados: [...estadosFiltro.value] } : {}),
      ...(idDepartamentoFiltro.value !== FILTRO_DEPTO_TODAS
        ? { id_departamento_ti: idDepartamentoFiltro.value }
        : {}),
      ...(idTecnicoFiltro.value === 'SIN_ASIGNAR'
        ? { sin_asignar: true }
        : typeof idTecnicoFiltro.value === 'number'
          ? { id_tecnico: idTecnicoFiltro.value }
          : {}),
    });

    if (ticketStore.tickets.length === 0 && paginaActual.value > 1) {
      paginaActual.value -= 1;
    }
  }

  watch([estadosFiltro, idDepartamentoFiltro, idTecnicoFiltro, filasPorPagina], () => {
    dispararRecargaDesdePrimeraPagina();
  });

  watch(busqueda, () => {
    if (!montado) return;
    if (timerBusqueda) clearTimeout(timerBusqueda);
    timerBusqueda = setTimeout(() => {
      timerBusqueda = null;
      dispararRecargaDesdePrimeraPagina();
    }, 300);
  });

  watch(paginaActual, () => {
    if (!montado) return;
    void recargarTickets();
  });

  function seleccionarMesAnio(anio: number, mesIndex: number): void {
    if (
      anio > anioActualSistema ||
      (anio === anioActualSistema && mesIndex > mesActualSistema)
    ) {
      return;
    }
    anioSeleccionado.value = anio;
    mesSeleccionado.value = mesIndex;
    dispararRecargaDesdePrimeraPagina();
  }

  function desplazarMes(delta: -1 | 1): void {
    let nuevoMes = mesSeleccionado.value + delta;
    let nuevoAnio = anioSeleccionado.value;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }

    seleccionarMesAnio(nuevoAnio, nuevoMes);
  }

  function irAlMesActual(): void {
    seleccionarMesAnio(anioActualSistema, mesActualSistema);
  }

  onMounted(() => {
    montado = true;
    void recargarTickets();
    if (mostrarFiltroDepartamento.value) {
      void departmentsStore.cargarDepartamentos().catch(() => undefined);
    }
    if (mostrarFiltroTecnico.value) {
      void ticketStore.cargarTecnicosDisponibles().catch(() => []);
    }
  });

  onBeforeUnmount(() => {
    if (timerBusqueda) {
      clearTimeout(timerBusqueda);
      timerBusqueda = null;
    }
  });

  /** El backend aplica el scoping RBAC, filtrado, búsqueda y paginación real en PostgreSQL. */
  const ticketsVisibles = computed<Ticket[]>(() => ticketStore.tickets);
  const ticketsFiltrados = computed<Ticket[]>(() => ticketStore.tickets);

  const totalResultados = computed<number>(
    () => ticketStore.paginacionMeta?.total ?? ticketStore.tickets.length,
  );

  const totalPaginas = computed<number>(() =>
    Math.max(
      1,
      ticketStore.paginacionMeta?.total_pages ??
        Math.ceil(totalResultados.value / Math.max(1, filasPorPagina.value)),
    ),
  );

  const textoMostrando = computed<string>(() => {
    const total = totalResultados.value;
    if (total === 0) return 'Mostrando 0 de 0 tickets';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
    return `Mostrando ${inicio}–${fin} de ${total} tickets`;
  });

  function limpiarFiltros(): void {
    if (timerBusqueda) {
      clearTimeout(timerBusqueda);
      timerBusqueda = null;
    }
    busqueda.value = '';
    estadosFiltro.value = [];
    idDepartamentoFiltro.value = FILTRO_DEPTO_TODAS;
    idTecnicoFiltro.value = FILTRO_TECNICO_TODOS;
  }

  return {
    busqueda,
    estadosFiltro,
    idDepartamentoFiltro,
    idTecnicoFiltro,
    anioSeleccionado,
    mesSeleccionado,
    anioActualSistema,
    mesActualSistema,
    esMesActual,
    paginaActual,
    filasPorPagina,
    totalResultados,
    totalPaginas,
    textoMostrando,
    mostrarFiltroDepartamento,
    mostrarFiltroTecnico,
    opcionesDepartamentosTi,
    opcionesTecnicosFiltro,
    estadosDisponibles: ESTADOS_DISPONIBLES,
    ticketsVisibles,
    ticketsFiltrados,
    cargando: computed(() => ticketStore.cargando),
    errorCarga: computed(() => ticketStore.errorCarga),
    limpiarFiltros,
    aplicarFiltroPorDefecto,
    seleccionarMesAnio,
    desplazarMes,
    irAlMesActual,
    recargarTickets,
  };
}
