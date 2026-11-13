<!-- 🛡️ [FASE 2.3 - TICKETS] Bandeja unificada con filtros por defecto según el rol en sesión -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">{{ tituloBandeja }}</h1>
        <p class="page-subtitle">{{ subtituloBandeja }}</p>
      </div>

      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
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
          to="/tickets/nuevo"
        />
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <q-card flat bordered class="tabla-card">
      <TicketsToolbar
        v-model:busqueda="busqueda"
        v-model:estados-filtro="estadosFiltro"
        :estados-disponibles="estadosDisponibles"
        :total-resultados="ticketsFiltrados.length"
        @limpiar="limpiarFiltros"
      />

      <q-table
        flat
        class="tabla-pro-q"
        :rows="ticketsFiltrados"
        :columns="columns"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay tickets que mostrar con los filtros aplicados"
        rows-per-page-label="Filas por página"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-center justify-between no-wrap q-mb-xs">
                <span class="text-weight-bold text-primary">{{ props.row.folio }}</span>
                <span class="chip" :class="ESTADO_CLASS[props.row.estado as EstadoTicket]">
                  <span class="chip__dot" />
                  {{ props.row.estado }}
                </span>
              </div>
              <div class="text-weight-medium text-dark q-mb-xs">
                {{ props.row.catalogo_incidencia }}
              </div>
              <div class="text-caption muted q-mb-sm">
                {{ props.row.solicitante }} · {{ props.row.departamento_solicitante }}
              </div>
              <div class="row items-center justify-between">
                <span class="chip" :class="claseChipPrioridad(props.row.prioridad)">
                  <span class="chip__dot" />
                  {{ props.row.prioridad }}
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon-right="chevron_right"
                  label="Gestionar"
                  @click="abrirDetalle(props.row)"
                />
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-folio="props">
          <q-td :props="props">
            <span class="text-weight-bold text-primary">{{ props.row.folio }}</span>
          </q-td>
        </template>

        <template #body-cell-solicitante="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="32px"
                class="q-mr-sm avatar-iniciales"
                :style="avatarSolicitanteStyle(props.row.solicitante)"
              >
                {{ inicialesSolicitante(props.row.solicitante) }}
              </q-avatar>
              <div class="column">
                <span class="text-weight-bold text-dark">{{ props.row.solicitante }}</span>
                <span class="text-caption muted">{{ props.row.departamento_solicitante }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-catalogo="props">
          <q-td :props="props">
            <div class="column">
              <span class="text-weight-medium text-dark">{{ props.row.catalogo_incidencia }}</span>
              <span class="text-caption muted">{{ props.row.departamento }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <span class="chip" :class="claseChipPrioridad(props.row.prioridad)">
              <span class="chip__dot" />
              {{ props.row.prioridad }}
            </span>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="ESTADO_CLASS[props.row.estado as EstadoTicket]">
              <span class="chip__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-tecnico="props">
          <q-td :props="props">
            <span :class="props.row.tecnico ? 'text-dark' : 'muted'">
              {{ props.row.tecnico ?? 'Sin asignar' }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon-right="chevron_right"
              label="Ver detalle"
              :ripple="false"
              :aria-label="`Ver detalle de ${props.row.folio}`"
              @click="abrirDetalle(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <TicketDetalleDialog
      v-model="dialogoAbierto"
      :ticket="ticketSeleccionado"
      @actualizado="recargarTickets"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { useRoute } from 'vue-router';
import TicketDetalleDialog from '@/components/tickets/TicketDetalleDialog.vue';
import TicketsToolbar from '@/components/tickets/TicketsToolbar.vue';
import {
  ESTADO_CLASS,
  avatarSolicitanteStyle,
  claseChipPrioridad,
  inicialesSolicitante,
  useTickets,
} from '@/composables/useTickets';
import type { EstadoTicket, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const authStore = useAuthStore();

const modoRuta = computed(() => route.meta.modoBandeja as string | undefined);

const {
  busqueda,
  estadosFiltro,
  estadosDisponibles,
  ticketsFiltrados,
  cargando,
  errorCarga,
  limpiarFiltros,
  recargarTickets,
} = useTickets(modoRuta);

const ticketSeleccionado = ref<Ticket | null>(null);
const dialogoAbierto = ref(false);

const puedeCrearTicket = computed(
  () => authStore.role === 'ADMINISTRADOR' || authStore.role === 'MESA_TECNICA',
);

const tituloBandeja = computed(() => {
  if (modoRuta.value === 'cierre') return 'Verificación y Cierre de Tickets';
  switch (authStore.role) {
    case 'TECNICO':
      return 'Mi Cola de Trabajo';
    case 'GERENTE_AREA':
      return 'Bandeja de Área';
    case 'MESA_TECNICA':
      return 'Recepción Global de Tickets';
    case 'USUARIO':
      return 'Mis Solicitudes de Soporte';
    default:
      return 'Gestión Global de Tickets';
  }
});

const subtituloBandeja = computed(() => {
  if (modoRuta.value === 'cierre') {
    return 'Tickets resueltos por los especialistas pendientes de validación y cierre definitivo.';
  }
  switch (authStore.role) {
    case 'TECNICO':
      return 'Incidencias asignadas a tu bandeja con su prioridad SLA y estado actual.';
    case 'GERENTE_AREA':
      return 'Incidencias pertenecientes a tu departamento técnico listas para asignación y seguimiento.';
    case 'MESA_TECNICA':
      return 'Control centralizado de incidencias, asignación en suplencia y cierre con usuario.';
    case 'USUARIO':
      return 'Seguimiento en tiempo real del estado de tus incidencias reportadas.';
    default:
      return 'Visión general de incidencias registradas en el sistema HelpDesk TI.';
  }
});

function abrirDetalle(ticket: Ticket): void {
  ticketSeleccionado.value = ticket;
  dialogoAbierto.value = true;
}

const columns: QTableColumn<Ticket>[] = [
  { name: 'folio', label: 'Folio', field: 'folio', align: 'left', sortable: true },
  {
    name: 'solicitante',
    label: 'Solicitante',
    field: 'solicitante',
    align: 'left',
    sortable: true,
  },
  {
    name: 'catalogo',
    label: 'Incidencia / Área TI',
    field: 'catalogo_incidencia',
    align: 'left',
    sortable: true,
  },
  { name: 'prioridad', label: 'Prioridad', field: 'prioridad', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'tecnico', label: 'Técnico', field: 'tecnico', align: 'left', sortable: true },
  {
    name: 'fecha_creacion',
    label: 'Creado',
    field: 'fecha_creacion',
    align: 'left',
    sortable: true,
    format: (val: string) =>
      new Date(val).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }),
  },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
];
</script>

<style scoped lang="scss">
.avatar-iniciales {
  font-size: 12px;
  font-weight: 600;
}
</style>
