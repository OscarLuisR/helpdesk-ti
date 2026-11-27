<!-- 🛡️ [FASE 3.5 / UI - VISTAS] Balanceo de Cargas en vivo para Gerente de Área (/gerencia/asignacion) -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg balanceo-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="balance" size="14px" />
          Gerencia de Área · Asignación
        </span>
        <h1 class="page-title">Balanceo de Cargas</h1>
        <p class="page-subtitle">
          Selecciona un ticket pendiente o reasignable a la izquierda y asígnalo en un clic al
          técnico con mejor disponibilidad a la derecha.
        </p>
      </div>
      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <q-btn
          outline
          unelevated
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
          :class="{ 'col-grow': $q.screen.xs }"
          :loading="cargando"
          @click="cargarDatos"
        />
        <q-btn
          outline
          unelevated
          no-caps
          color="primary"
          icon="folder_open"
          label="Ir a Bandeja"
          :class="{ 'col-grow': $q.screen.xs }"
          to="/gerencia/bandeja"
        />
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <div class="row q-col-gutter-lg items-start">
      <!-- Columna izquierda: Cola de tickets por asignar / reasignar -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="modern-card overflow-hidden">
          <div class="q-pa-md cola-header">
            <div class="row items-center justify-between q-gutter-xs q-mb-sm">
              <span class="text-subtitle2 text-weight-bold text-ink">
                Tickets de tu Sub-Gerencia
              </span>
              <div class="modo-toggle-group">
                <button
                  type="button"
                  class="modo-toggle-btn"
                  :class="{ 'modo-toggle-btn--active': modoCola === 'pendientes' }"
                  @click="cambiarModoCola('pendientes')"
                >
                  Sin asignar ({{ ticketsSinAsignar.length }})
                </button>
                <button
                  type="button"
                  class="modo-toggle-btn"
                  :class="{ 'modo-toggle-btn--active': modoCola === 'reasignables' }"
                  @click="cambiarModoCola('reasignables')"
                >
                  Reasignables ({{ ticketsReasignables.length }})
                </button>
              </div>
            </div>

            <q-input
              v-model="busquedaTicket"
              outlined
              dense
              clearable
              placeholder="Filtrar por folio, solicitante o incidencia..."
            >
              <template #prepend>
                <q-icon name="search" size="18px" class="muted" />
              </template>
            </q-input>
          </div>

          <div class="q-pa-md">
            <div v-if="cargando && !ticketsColaVisible.length" class="text-center q-pa-lg">
              <q-spinner color="primary" size="28px" />
            </div>

            <div v-else-if="!ticketsColaVisible.length" class="empty-box q-pa-lg text-center muted">
              {{
                modoCola === 'pendientes'
                  ? 'No hay tickets Abiertos o Reabiertos pendientes de asignar en tu área.'
                  : 'No hay tickets Asignados o En Espera disponibles para reasignar.'
              }}
            </div>

            <div v-else class="q-gutter-y-sm">
              <div
                v-for="item in ticketsColaPaginados"
                :key="item.ticket.id"
                class="ticket-item q-pa-sm cursor-pointer"
                :class="{ 'ticket-item--selected': ticketSeleccionadoId === item.ticket.id }"
                @click="ticketSeleccionadoId = item.ticket.id"
              >
                <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                  <div class="row items-center q-gutter-xs min-w-0 col">
                    <strong class="text-primary tabular-nums">{{ item.ticket.folio }}</strong>
                    <PrioridadBadge :prioridad="item.ticket.prioridad" compacto />
                    <span class="chip" :class="ESTADO_CLASS[item.ticket.estado]">
                      <span class="chip__dot" />
                      {{ item.ticket.estado }}
                    </span>
                  </div>
                  <q-btn
                    outline
                    unelevated
                    dense
                    size="sm"
                    color="secondary"
                    icon="visibility"
                    class="btn-accion-icono shrink-0"
                    :aria-label="`Ver detalle de ${item.ticket.folio}`"
                    @click.stop="abrirDetalle(item.ticket)"
                  >
                    <q-tooltip>Ver detalle</q-tooltip>
                  </q-btn>
                </div>

                <div class="text-body2 text-weight-medium text-ink texto-wrap">
                  {{ item.ticket.catalogo_incidencia }}
                </div>
                <div class="text-caption muted texto-wrap q-mt-xs">
                  {{ item.ticket.solicitante }} · {{ item.ticket.departamento_solicitante }}
                </div>

                <div
                  class="row items-center justify-between q-gutter-x-sm q-mt-sm q-pt-xs ticket-meta-footer text-caption tabular-nums"
                >
                  <span :class="item.vencido ? 'text-negative text-weight-bold' : 'muted'">
                    Meta asig.: {{ item.ticket.tiempo_max_asignacion_minutos }}m · Lleva
                    {{ item.minutosTranscurridos }}m
                  </span>
                  <span v-if="item.ticket.tecnico" class="muted">
                    Actual: <strong class="text-ink">{{ item.ticket.tecnico }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 🛡️ [FASE 3 - UI BALANCEO] Pie de paginación organizado en la cola -->
          <div class="cola-footer">
            <div class="row items-center q-gutter-x-xs">
              <span class="text-caption muted">Mostrar</span>
              <q-select
                v-model="filasPorPagina"
                :options="OPCIONES_FILAS_COLA"
                dense
                outlined
                options-dense
                hide-bottom-space
                aria-label="Tickets por página"
                class="select-filas-pagina"
              />
            </div>

            <q-pagination
              v-model="paginaActual"
              :max="totalPaginas"
              :max-pages="$q.screen.lt.sm ? 3 : 4"
              direction-links
              active-design="unelevated"
              active-color="primary"
              color="grey-7"
              size="sm"
            />

            <span class="text-caption muted tabular-nums">{{ textoMostrandoCola }}</span>
          </div>
        </q-card>
      </div>

      <!-- Columna derecha: Tarjetas de técnicos con carga en vivo -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="modern-card q-pa-md">
          <div class="q-mb-sm">
            <div class="text-subtitle2 text-weight-bold text-ink">
              Plantilla Técnica Disponible ({{ tarjetasTecnicos.length }})
            </div>
            <div class="text-caption muted texto-wrap q-mt-xs">
              <template v-if="ticketSeleccionado">
                Ticket seleccionado:
                <strong class="text-primary">{{ ticketSeleccionado.folio }}</strong> —
                {{ ticketSeleccionado.catalogo_incidencia }}
              </template>
              <template v-else>
                Selecciona un ticket a la izquierda para habilitar la asignación en un clic.
              </template>
            </div>
          </div>

          <q-input
            v-if="ticketSeleccionado"
            v-model="notaAsignacion"
            outlined
            dense
            maxlength="300"
            placeholder="Observación opcional para bitácora al asignar..."
            class="q-mb-md"
          />

          <div v-if="cargando && !tarjetasTecnicos.length" class="text-center q-pa-lg">
            <q-spinner color="primary" size="28px" />
          </div>

          <div v-else-if="!tarjetasTecnicos.length" class="empty-box q-pa-lg text-center muted">
            No se encontraron técnicos activos registrados en tu sub-gerencia.
          </div>

          <div v-else class="row q-col-gutter-md">
            <div v-for="tec in tarjetasTecnicos" :key="tec.id" class="col-12 col-sm-6">
              <div
                class="tech-card q-pa-md full-height column justify-between"
                :class="{
                  'tech-card--ideal': tec.cargaActiva === 0,
                  'tech-card--actual': ticketSeleccionado?.id_tecnico === tec.id,
                }"
              >
                <div>
                  <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                    <div class="text-weight-bold text-ink texto-wrap min-w-0 col">
                      {{ tec.nombre_completo }}
                    </div>
                    <span
                      class="chip shrink-0"
                      :class="
                        tec.enProgreso > 0
                          ? 'estado-progreso'
                          : tec.cargaActiva > 0
                            ? 'estado-espera'
                            : 'estado-asignado'
                      "
                    >
                      <span class="chip__dot" />
                      {{
                        tec.enProgreso > 0
                          ? 'Atendiendo'
                          : tec.cargaActiva > 0
                            ? 'En cola'
                            : 'Disponible'
                      }}
                    </span>
                  </div>

                  <div class="text-caption muted q-mb-sm tabular-nums">
                    @{{ tec.nick }} · Carga activa:
                    <strong class="text-ink">{{ tec.cargaActiva }}</strong>
                  </div>

                  <div class="row q-gutter-xs q-mb-sm">
                    <span class="chip estado-asignado tabular-nums"
                      >Asign: {{ tec.asignados }}</span
                    >
                    <span class="chip estado-progreso tabular-nums"
                      >Progr: {{ tec.enProgreso }}</span
                    >
                    <span class="chip estado-espera tabular-nums">Espera: {{ tec.enEspera }}</span>
                    <span v-if="tec.reabiertos > 0" class="chip estado-reabierto tabular-nums">
                      Reab: {{ tec.reabiertos }}
                    </span>
                  </div>

                  <div v-if="tec.ticketActual" class="text-caption muted texto-wrap">
                    En progreso: <strong class="text-ink">{{ tec.ticketActual.folio }}</strong> ·
                    {{ tec.ticketActual.catalogo_incidencia }}
                  </div>
                </div>

                <div class="q-mt-md">
                  <q-btn
                    unelevated
                    no-caps
                    class="full-width"
                    :color="tec.cargaActiva === 0 ? 'positive' : 'primary'"
                    icon="person_add"
                    :label="etiquetaBotonTecnico(tec.id)"
                    :disable="
                      !ticketSeleccionado ||
                      asignandoTecnicoId !== null ||
                      (ticketSeleccionado.estado === 'Asignado' &&
                        ticketSeleccionado.id_tecnico === tec.id)
                    "
                    :loading="asignandoTecnicoId === tec.id"
                    @click="asignarATecnico(tec.id, tec.nombre_completo)"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <TicketDetalleDialog
      v-model="dialogoAbierto"
      :ticket="ticketDetalle"
      @actualizado="cargarDatos"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import TicketDetalleDialog from '@/components/tickets/TicketDetalleDialog.vue';
import { ESTADO_CLASS } from '@/composables/useTickets';
import type { TecnicoDisponible, Ticket } from '@/models/types';
import { useTicketStore } from '@/stores/ticketStore';

const OPCIONES_FILAS_COLA: number[] = [3, 5, 10, 15];

const ORDEN_PRIORIDAD: Record<string, number> = {
  crítica: 1,
  critica: 1,
  alta: 2,
  media: 3,
  baja: 4,
};

const $q = useQuasar();
const ticketStore = useTicketStore();

const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const tecnicos = ref<TecnicoDisponible[]>([]);
const modoCola = ref<'pendientes' | 'reasignables'>('pendientes');
const busquedaTicket = ref('');
const ticketSeleccionadoId = ref<number | null>(null);
const notaAsignacion = ref('');
const asignandoTecnicoId = ref<number | null>(null);
const paginaActual = ref(1);
const filasPorPagina = ref(5);

const dialogoAbierto = ref(false);
const ticketDetalle = ref<Ticket | null>(null);

function ordenarTicketsPorUrgencia(lista: Ticket[]) {
  const ahora = Date.now();
  return lista
    .map((ticket) => {
      const creacionMs = new Date(ticket.fecha_creacion).getTime();
      const minutosTranscurridos = Number.isFinite(creacionMs)
        ? Math.max(0, Math.floor((ahora - creacionMs) / 60000))
        : 0;
      const vencido = minutosTranscurridos > ticket.tiempo_max_asignacion_minutos;
      const pesoPrio = ORDEN_PRIORIDAD[ticket.prioridad.trim().toLowerCase()] ?? 5;
      return { ticket, minutosTranscurridos, vencido, pesoPrio };
    })
    .sort((a, b) => a.pesoPrio - b.pesoPrio || b.minutosTranscurridos - a.minutosTranscurridos);
}

const ticketsSinAsignar = computed(() =>
  ordenarTicketsPorUrgencia(
    ticketStore.tickets.filter((t) => t.estado === 'Abierto' || t.estado === 'Reabierto'),
  ),
);

const ticketsReasignables = computed(() =>
  ordenarTicketsPorUrgencia(
    ticketStore.tickets.filter((t) => t.estado === 'Asignado' || t.estado === 'En Espera'),
  ),
);

const ticketsColaVisible = computed(() => {
  const fuente =
    modoCola.value === 'pendientes' ? ticketsSinAsignar.value : ticketsReasignables.value;
  const q = (busquedaTicket.value ?? '').trim().toLowerCase();
  if (!q) return fuente;
  return fuente.filter(({ ticket: t }) =>
    [
      t.folio,
      t.solicitante,
      t.departamento_solicitante,
      t.catalogo_incidencia,
      t.tecnico ?? '',
    ].some((v) => v.toLowerCase().includes(q)),
  );
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(ticketsColaVisible.value.length / filasPorPagina.value)),
);

const ticketsColaPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * filasPorPagina.value;
  return ticketsColaVisible.value.slice(inicio, inicio + filasPorPagina.value);
});

const textoMostrandoCola = computed(() => {
  const total = ticketsColaVisible.value.length;
  if (total === 0) return '0 de 0';
  const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
  const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
  return `${inicio}–${fin} de ${total}`;
});

watch([busquedaTicket, filasPorPagina], () => {
  paginaActual.value = 1;
});

watch(totalPaginas, (nuevoMax) => {
  if (paginaActual.value > nuevoMax) {
    paginaActual.value = nuevoMax;
  }
});

function cambiarModoCola(nuevoModo: 'pendientes' | 'reasignables'): void {
  modoCola.value = nuevoModo;
  paginaActual.value = 1;
  const lista = nuevoModo === 'pendientes' ? ticketsSinAsignar.value : ticketsReasignables.value;
  ticketSeleccionadoId.value = lista[0]?.ticket.id ?? null;
}

const ticketSeleccionado = computed<Ticket | null>(() => {
  if (!ticketSeleccionadoId.value) return null;
  return ticketStore.tickets.find((t) => t.id === ticketSeleccionadoId.value) ?? null;
});

const tarjetasTecnicos = computed(() =>
  tecnicos.value
    .map((tec) => {
      const delTec = ticketStore.tickets.filter((t) => Number(t.id_tecnico) === Number(tec.id));
      const asignados = delTec.filter((t) => t.estado === 'Asignado').length;
      const enProgreso = delTec.filter((t) => t.estado === 'En Progreso').length;
      const enEspera = delTec.filter((t) => t.estado === 'En Espera').length;
      const reabiertos = delTec.filter((t) => t.estado === 'Reabierto').length;
      const cargaActiva = asignados + enProgreso + enEspera + reabiertos;
      const ticketActual = delTec.find((t) => t.estado === 'En Progreso') ?? null;

      return {
        ...tec,
        asignados,
        enProgreso,
        enEspera,
        reabiertos,
        cargaActiva,
        ticketActual,
      };
    })
    .sort(
      (a, b) => a.cargaActiva - b.cargaActiva || a.nombre_completo.localeCompare(b.nombre_completo),
    ),
);

function etiquetaBotonTecnico(idTec: number): string {
  if (!ticketSeleccionado.value) return 'Selecciona un ticket';
  if (
    ticketSeleccionado.value.estado === 'Asignado' &&
    ticketSeleccionado.value.id_tecnico === idTec
  ) {
    return 'Asignado actualmente';
  }
  return ticketSeleccionado.value.id_tecnico ? 'Reasignar aquí' : 'Asignar aquí';
}

async function cargarDatos(): Promise<void> {
  cargando.value = true;
  errorCarga.value = null;
  try {
    // 🛡️ [FASE 4.1 - ESCALABILIDAD] Consulta únicamente tickets activos (índice parcial SQL), evitando traer históricos cerrados
    const [, listaTecnicos] = await Promise.all([
      ticketStore.cargarTickets({ solo_activos: true }),
      ticketStore.cargarTecnicosDisponibles(),
    ]);
    tecnicos.value = listaTecnicos;

    // Seleccionar automáticamente el primer pendiente si el actual dejó de ser asignable
    if (
      !ticketSeleccionado.value ||
      !['Abierto', 'Reabierto', 'Asignado', 'En Espera'].includes(ticketSeleccionado.value.estado)
    ) {
      ticketSeleccionadoId.value = ticketsSinAsignar.value[0]?.ticket.id ?? null;
    }
  } catch (err: unknown) {
    errorCarga.value =
      err instanceof Error ? err.message : 'No fue posible cargar la información de balanceo.';
  } finally {
    cargando.value = false;
  }
}

async function asignarATecnico(idTecnico: number, nombreTecnico: string): Promise<void> {
  if (!ticketSeleccionado.value) return;
  asignandoTecnicoId.value = idTecnico;
  errorCarga.value = null;

  try {
    const res = await ticketStore.cambiarEstadoTicket(ticketSeleccionado.value.id, {
      estado_nuevo: 'Asignado',
      id_tecnico: idTecnico,
      ...(notaAsignacion.value.trim() ? { comentario: notaAsignacion.value.trim() } : {}),
    });
    notaAsignacion.value = '';
    $q.notify({
      type: 'positive',
      message: `Ticket ${res.folio} asignado a ${nombreTecnico}.`,
      position: 'top-right',
    });
    ticketSeleccionadoId.value = ticketsSinAsignar.value[0]?.ticket.id ?? null;
  } catch (err: unknown) {
    errorCarga.value =
      err instanceof Error ? err.message : 'No fue posible completar la asignación.';
  } finally {
    asignandoTecnicoId.value = null;
  }
}

function abrirDetalle(ticket: Ticket): void {
  ticketDetalle.value = ticket;
  dialogoAbierto.value = true;
}

onMounted(() => {
  void cargarDatos();
});
</script>

<style scoped lang="scss">
.balanceo-page {
  max-width: 1400px;
  margin: 0 auto;
}

.cola-header {
  border-bottom: 1px solid var(--border-subtle);
}

.modo-toggle-group {
  display: inline-flex;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.modo-toggle-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--transition-ui),
    color var(--transition-ui);

  &--active {
    background: var(--brand-primary);
    color: var(--brand-on-primary);
  }
}

.ticket-item {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition:
    border-color var(--transition-ui),
    background-color var(--transition-ui);

  &:hover {
    border-color: var(--border-strong);
  }

  &--selected {
    background: var(--brand-primary-soft);
    border-color: var(--brand-ink);
  }
}

.ticket-meta-footer {
  border-top: 1px solid var(--border-subtle);
}

.tech-card {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);

  &--ideal {
    border-color: var(--brand-primary-border);
  }

  &--actual {
    border-style: dashed;
    opacity: 0.88;
  }
}

.empty-box {
  background: var(--surface-bg);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}

.texto-wrap {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

.cola-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  padding: 10px 14px;
}

.select-filas-pagina {
  width: 64px;

  :deep(.q-field__control) {
    min-height: 28px;
    height: 28px;
  }

  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 28px;
    height: 28px;
    font-size: 0.76rem;
  }
}

@media (max-width: 639px) {
  .cola-footer {
    justify-content: center;
  }
}
</style>
