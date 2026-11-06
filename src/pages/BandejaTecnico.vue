<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-lg">
      <h1 class="page-title">Mi Bandeja de Trabajo</h1>
      <p class="page-subtitle">
        Tickets asignados a tu bandeja con su prioridad y estado actual.
      </p>
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
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay tickets que mostrar"
        rows-per-page-label="Filas por página"
      >
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
                <span class="text-caption muted">{{ props.row.departamento }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <span class="chip" :class="PRIORIDAD_CLASS[props.row.prioridad as Prioridad]">
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
            <div v-if="props.row.motivoPausa" class="text-caption muted q-mt-xs">
              {{ props.row.motivoPausa }}
            </div>
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
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import TicketsToolbar from '@/components/tickets/TicketsToolbar.vue';
import {
  ESTADO_CLASS,
  PRIORIDAD_CLASS,
  avatarSolicitanteStyle,
  inicialesSolicitante,
  useTickets,
} from '@/composables/useTickets';
import type { EstadoTicket, Prioridad, Ticket } from '@/models/types';

const {
  busqueda,
  estadosFiltro,
  estadosDisponibles,
  ticketsFiltrados,
  limpiarFiltros,
} = useTickets();

const columns: QTableColumn<Ticket>[] = [
  { name: 'folio', label: 'Folio', field: 'folio', align: 'left', sortable: true },
  { name: 'solicitante', label: 'Solicitante', field: 'solicitante', align: 'left', sortable: true },
  { name: 'tipoTrabajo', label: 'Tipo', field: 'tipoTrabajo', align: 'left' },
  { name: 'prioridad', label: 'Prioridad', field: 'prioridad', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  {
    name: 'fechaCreacion',
    label: 'Creado',
    field: 'fechaCreacion',
    align: 'left',
    sortable: true,
    format: (val: string) =>
      new Date(val).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }),
  },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
];
</script>

<style scoped lang="scss">
.tabla-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.muted {
  color: var(--muted);
}

.tabla-pro-q {
  :deep(thead tr th) {
    background: var(--bg);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
    padding-top: 12px;
    padding-bottom: 12px;
  }

  :deep(tbody td) {
    border-bottom: 1px solid var(--border);
    height: 64px;
    transition: background-color 0.15s ease;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: none;
  }

  :deep(tbody tr:hover td) {
    background-color: var(--primary-soft);
  }

  :deep(tbody td:after) {
    background: transparent !important;
  }
}

.avatar-iniciales {
  font-size: 12px;
  font-weight: 600;
}
</style>
