<!-- 🛡️ [FASE 2.3 - TICKETS] Bandeja unificada con filtros por defecto según el rol en sesión -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg bandeja-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="inbox" size="14px" />
          Operación · Tickets
        </span>
        <h1 class="page-title">{{ tituloBandeja }}</h1>
        <p class="page-subtitle">{{ subtituloBandeja }}</p>
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
          @click="recargarTickets"
        />
        <q-btn
          v-if="puedeCrearTicket"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nuevo Ticket"
          :class="{ 'col-grow': $q.screen.xs }"
          to="/tickets/nuevo"
        />
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <TicketsToolbar
        v-model:busqueda="busqueda"
        v-model:estados-filtro="estadosFiltro"
        v-model:id-departamento-filtro="idDepartamentoFiltro"
        v-model:id-tecnico-filtro="idTecnicoFiltro"
        :anio-seleccionado="anioSeleccionado"
        :mes-seleccionado="mesSeleccionado"
        :anio-actual-sistema="anioActualSistema"
        :mes-actual-sistema="mesActualSistema"
        :es-mes-actual="esMesActual"
        :mostrar-filtro-departamento="mostrarFiltroDepartamento"
        :mostrar-filtro-tecnico="mostrarFiltroTecnico"
        :opciones-departamentos-ti="opcionesDepartamentosTi"
        :opciones-tecnicos-filtro="opcionesTecnicosFiltro"
        :estados-disponibles="estadosDisponibles"
        :total-resultados="totalResultados"
        @seleccionar-mes="seleccionarMesAnio"
        @desplazar-mes="desplazarMes"
        @ir-mes-actual="irAlMesActual"
        @limpiar="limpiarFiltros"
      />

      <q-table
        flat
        v-model:pagination="paginacionTabla"
        class="modern-table tabla-bandeja"
        :rows="ticketsFiltrados"
        :columns="columns"
        :rows-per-page-options="[0]"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No hay tickets que mostrar con los filtros aplicados"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                  <span class="text-weight-bold text-primary tabular-nums">{{ props.row.folio }}</span>
                  <span class="chip shrink-0" :class="ESTADO_CLASS[props.row.estado as EstadoTicket]">
                    <span class="chip__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>
                <div class="text-weight-medium text-ink incidencia-titulo q-mb-xs">
                  {{ props.row.catalogo_incidencia }}
                </div>
                <div class="text-caption text-secondary text-weight-medium q-mb-xs">
                  {{ props.row.departamento }}
                </div>
                <div class="text-caption muted q-mb-xs">
                  <span class="text-ink text-weight-medium">{{ props.row.solicitante }}</span>
                  · {{ props.row.departamento_solicitante }}
                </div>
                <div class="row items-center justify-between q-gutter-x-sm text-caption muted q-mb-sm">
                  <span>
                    Técnico:
                    <span :class="props.row.tecnico ? 'text-ink' : 'muted'">
                      {{ props.row.tecnico ?? 'Sin asignar' }}
                    </span>
                  </span>
                  <span class="tabular-nums">
                    {{ formatearFechaCorta(props.row.fecha_creacion) }} ·
                    {{ formatearHoraCorta(props.row.fecha_creacion) }}
                  </span>
                </div>
              </div>
              <div class="row items-center justify-between q-pt-sm card-item-footer">
                <PrioridadBadge :prioridad="props.row.prioridad" />
                <q-btn
                  outline
                  unelevated
                  dense
                  color="secondary"
                  icon="visibility"
                  size="sm"
                  class="btn-accion-icono"
                  :aria-label="`Ver detalle de ${props.row.folio}`"
                  @click="abrirDetalle(props.row)"
                >
                  <q-tooltip>Ver detalle</q-tooltip>
                </q-btn>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-folio="props">
          <q-td :props="props">
            <span class="text-weight-bold text-primary tabular-nums folio-lineal">
              {{ props.row.folio }}
            </span>
          </q-td>
        </template>

        <template #body-cell-solicitante="props">
          <q-td :props="props" class="celda-wrap">
            <div class="row items-start no-wrap">
              <q-avatar
                size="28px"
                class="q-mr-sm avatar-iniciales shrink-0"
                :style="avatarSolicitanteStyle(props.row.solicitante)"
              >
                {{ inicialesSolicitante(props.row.solicitante) }}
              </q-avatar>
              <div class="column min-w-0 col">
                <span class="text-weight-bold text-ink texto-celda">{{ props.row.solicitante }}</span>
                <span class="text-caption muted texto-subcelda">{{ props.row.departamento_solicitante }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-catalogo="props">
          <q-td :props="props" class="celda-wrap">
            <div class="column">
              <span class="text-weight-medium text-ink incidencia-titulo">{{ props.row.catalogo_incidencia }}</span>
              <span class="text-caption muted texto-subcelda">{{ props.row.departamento }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <PrioridadBadge :prioridad="props.row.prioridad" compacto />
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span
              class="chip chip-tabla-compacto chip-estado-lineal"
              :class="ESTADO_CLASS[props.row.estado as EstadoTicket]"
            >
              <span class="chip__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-tecnico="props">
          <q-td :props="props" class="celda-wrap">
            <span class="texto-celda" :class="props.row.tecnico ? 'text-ink' : 'muted'">
              {{ props.row.tecnico ?? 'Sin asignar' }}
            </span>
          </q-td>
        </template>

        <template #body-cell-fecha_creacion="props">
          <q-td :props="props">
            <div class="column tabular-nums">
              <span class="text-caption text-ink text-weight-medium fecha-lineal">
                {{ formatearFechaCorta(props.row.fecha_creacion) }}
              </span>
              <span class="text-caption muted fecha-lineal">
                {{ formatearHoraCorta(props.row.fecha_creacion) }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <q-btn
              outline
              unelevated
              dense
              color="secondary"
              icon="visibility"
              size="sm"
              class="btn-accion-icono"
              :aria-label="`Ver detalle de ${props.row.folio}`"
              @click="abrirDetalle(props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI BANDEJA] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_TICKETS"
            dense
            outlined
            options-dense
            hide-bottom-space
            aria-label="Registros por página"
            class="select-filas-pagina"
          />
          <span class="text-caption muted">por página</span>
        </div>

        <div class="footer-zona-centro">
          <q-pagination
            v-model="paginaActual"
            :max="totalPaginas"
            :max-pages="$q.screen.lt.sm ? 3 : 5"
            direction-links
            active-design="unelevated"
            active-color="primary"
            color="grey-7"
            size="sm"
          />
        </div>

        <div class="footer-zona-der text-caption muted tabular-nums">
          {{ textoMostrando }}
        </div>
      </div>
    </q-card>

    <TicketDetalleDialog
      v-model="dialogoAbierto"
      :ticket="ticketSeleccionado"
      :tab-inicial="tabInicialDialogo"
      @actualizado="recargarTickets"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import TicketDetalleDialog from '@/components/tickets/TicketDetalleDialog.vue';
import TicketsToolbar from '@/components/tickets/TicketsToolbar.vue';
import {
  ESTADO_CLASS,
  avatarSolicitanteStyle,
  inicialesSolicitante,
  useTickets,
} from '@/composables/useTickets';
import type { EstadoTicket, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';
import {
  formatearFechaCorta as formatFechaCorta,
  formatearHora12,
} from '@/utils/formatFecha';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const ticketStore = useTicketStore();

const OPCIONES_FILAS_POR_PAGINA_TICKETS: number[] = [3, 5, 10, 15, 20];

const modoRuta = computed(() => route.meta.modoBandeja as string | undefined);

const {
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
  estadosDisponibles,
  ticketsFiltrados,
  cargando,
  errorCarga,
  limpiarFiltros,
  seleccionarMesAnio,
  desplazarMes,
  irAlMesActual,
  recargarTickets,
} = useTickets(modoRuta);

const ticketSeleccionado = ref<Ticket | null>(null);
const dialogoAbierto = ref(false);
const tabInicialDialogo = ref<'resumen' | 'comentarios' | 'adjuntos' | 'bitacora'>('resumen');
const folioQueryProcesado = ref<string | null>(null);

const puedeCrearTicket = computed(
  () => authStore.role === 'ADMINISTRADOR' || authStore.role === 'MESA_TECNICA',
);

const tituloBandeja = computed(() => {
  switch (authStore.role) {
    case 'TECNICO':
      return 'Mi Cola de Trabajo';
    case 'GERENTE_AREA':
      return 'Bandeja de Área';
    case 'MESA_TECNICA':
      return 'Recepción Global de Tickets';
    default:
      return 'Gestión Global de Tickets';
  }
});

const subtituloBandeja = computed(() => {
  switch (authStore.role) {
    case 'TECNICO':
      return 'Incidencias asignadas a tu bandeja con su prioridad SLA y estado actual.';
    case 'GERENTE_AREA':
      return 'Incidencias pertenecientes a tu departamento técnico listas para asignación y seguimiento.';
    case 'MESA_TECNICA':
      return 'Control centralizado de incidencias, asignación en suplencia y cierre con usuario.';
    default:
      return 'Visión general de incidencias registradas en el sistema HelpDesk TI.';
  }
});

function abrirDetalle(
  ticket: Ticket,
  tab: 'resumen' | 'comentarios' | 'adjuntos' | 'bitacora' = 'resumen',
): void {
  tabInicialDialogo.value = tab;
  ticketSeleccionado.value = ticket;
  dialogoAbierto.value = true;
}

// 🛡️ [FIX REACTIVIDAD / FASE 3.6] Consume query params de filtro (`estado`, `busqueda`, `anio`, `mes`)
// separados del deep-link por `folio` para sincronizar el mes elegido en Dashboard sin bucles reactivos.
watch(
  [
    () => route.query.estado,
    () => route.query.busqueda,
    () => route.query.anio,
    () => route.query.mes,
  ],
  ([estadoParam, busquedaParam, anioParam, mesParam]) => {
    let consumioQuery = false;

    if (typeof anioParam === 'string' && typeof mesParam === 'string') {
      const anioNum = Number(anioParam);
      const mesNum = Number(mesParam);
      if (
        Number.isInteger(anioNum) &&
        Number.isInteger(mesNum) &&
        mesNum >= 0 &&
        mesNum <= 11
      ) {
        if (anioNum !== anioSeleccionado.value || mesNum !== mesSeleccionado.value) {
          seleccionarMesAnio(anioNum, mesNum);
        }
        consumioQuery = true;
      }
    }

    if (typeof estadoParam === 'string' && estadoParam.trim()) {
      const est = estadoParam.trim() as EstadoTicket;
      if (estadosDisponibles.includes(est)) {
        estadosFiltro.value = [est];
      }
      consumioQuery = true;
    } else if (typeof busquedaParam === 'string' && busquedaParam.trim()) {
      busqueda.value = busquedaParam.trim();
      estadosFiltro.value = [];
      consumioQuery = true;
    }

    if (consumioQuery) {
      void router.replace({ path: route.path });
    }
  },
  { immediate: true },
);

watch(
  () => route.query.folio,
  async (folioParam) => {
    const folioBuscado = typeof folioParam === 'string' ? folioParam.trim().toUpperCase() : '';
    if (!folioBuscado) {
      folioQueryProcesado.value = null;
      return;
    }
    if (folioQueryProcesado.value === folioBuscado) return;

    folioQueryProcesado.value = folioBuscado;
    const matchLocal = ticketsFiltrados.value.find(
      (t) => t.folio.trim().toUpperCase() === folioBuscado,
    );
    const match = matchLocal ?? (await ticketStore.buscarTicketPorFolio(folioBuscado));
    if (!match) return;

    busqueda.value = folioBuscado;
    const tab = route.query.tab === 'adjuntos' ? 'adjuntos' : 'resumen';
    abrirDetalle(match, tab);
    void router.replace({ path: route.path });
  },
  { immediate: true },
);

// 🛡️ [FASE 4.2 - ESCALABILIDAD] La paginación corre en PostgreSQL; q-table muestra completa la página recibida
const paginacionTabla = ref<NonNullable<QTableProps['pagination']>>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 0,
});

function formatearFechaCorta(iso: string): string {
  return formatFechaCorta(iso);
}

function formatearHoraCorta(iso: string): string {
  return formatearHora12(iso);
}

// 🛡️ [FASE 3 - UI BANDEJA] Anchos fijos (100%) sin scroll horizontal y Estado lineal
const columns: QTableColumn<Ticket>[] = [
  {
    name: 'folio',
    label: 'Folio',
    field: 'folio',
    align: 'left',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'solicitante',
    label: 'Solicitante',
    field: 'solicitante',
    align: 'left',
    sortable: true,
    style: 'width: 14%;',
    headerStyle: 'width: 14%;',
  },
  {
    name: 'catalogo',
    label: 'Incidencia / Área TI',
    field: 'catalogo_incidencia',
    align: 'left',
    sortable: true,
    style: 'width: 24%;',
    headerStyle: 'width: 24%;',
  },
  {
    name: 'prioridad',
    label: 'Prioridad',
    field: 'prioridad',
    align: 'left',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'left',
    sortable: true,
    style: 'width: 18%;',
    headerStyle: 'width: 18%;',
  },
  {
    name: 'tecnico',
    label: 'Técnico',
    field: 'tecnico',
    align: 'left',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'fecha_creacion',
    label: 'Creado',
    field: 'fecha_creacion',
    align: 'left',
    sortable: true,
    style: 'width: 8%;',
    headerStyle: 'width: 8%;',
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'center',
    style: 'width: 7%;',
    headerStyle: 'width: 7%;',
  },
];
</script>

<style scoped lang="scss">
.bandeja-page {
  max-width: 1400px;
  margin: 0 auto;
}

.avatar-iniciales {
  font-size: 11px;
  font-weight: 700;
}

// 🛡️ [FASE 3 - UI BANDEJA] Tabla fija sin scroll horizontal; encabezados en una sola línea
.tabla-bandeja {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(thead tr th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
    padding: 11px 6px;
  }

  :deep(thead tr th:first-child),
  :deep(tbody tr td:first-child) {
    padding-left: 12px;
  }

  :deep(thead tr th:last-child),
  :deep(tbody tr td:last-child) {
    padding-right: 10px;
  }

  :deep(tbody td) {
    height: auto;
    white-space: normal;
    word-break: break-word;
    padding: 12px 6px;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}

.folio-lineal,
.fecha-lineal {
  white-space: nowrap;
}

.incidencia-titulo,
.texto-celda {
  line-height: 1.35;
}

.texto-subcelda {
  line-height: 1.3;
}

.chip-tabla-compacto {
  font-size: 0.7rem;
  padding: 2px 7px;
  gap: 4px;
}

.chip-estado-lineal {
  white-space: nowrap;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

.card-item-footer {
  border-top: 1px solid var(--border-subtle);
}

// Pie de tabla de 3 zonas consistente con Configuraciones y vistas administrativas
.tabla-footer-3zonas {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  padding: 12px 16px;
}

.footer-zona-izq {
  justify-self: start;
}

.footer-zona-centro {
  justify-self: center;
}

.footer-zona-der {
  justify-self: end;
}

.select-filas-pagina {
  width: 68px;

  :deep(.q-field__control) {
    min-height: 30px;
    height: 30px;
  }

  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 30px;
    height: 30px;
    font-size: 0.78rem;
  }
}

@media (max-width: 639px) {
  .tabla-footer-3zonas {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .footer-zona-izq,
  .footer-zona-centro,
  .footer-zona-der {
    justify-self: center;
  }
}
</style>
