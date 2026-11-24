<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="timer" size="14px" />
          Administración · Acuerdos SLA
        </span>
        <h1 class="page-title">Prioridades y Configuración de SLAs</h1>
        <p class="page-subtitle">
          Matriz objetiva de prioridades (Impacto × Urgencia), metas de respuesta y reglas de suplencia.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Prioridad"
          unelevated
          no-caps
          class="btn-nuevo"
          :class="{ 'full-width': $q.screen.xs }"
          @click="abrirModalCrear"
        />
      </div>
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-8 col-md-9">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por prioridad, criterio o ejemplo..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4 col-md-3">
            <q-select
              v-model="filtroEstado"
              :options="OPCIONES_FILTRO_ESTADO"
              dense
              outlined
              options-dense
            />
          </div>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        class="modern-table tabla-slas"
        :rows="slas"
        :columns="COLUMNAS_SLAS"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_SLAS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No hay prioridades registradas"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-start justify-between no-wrap q-mb-xs">
                  <PrioridadBadge :prioridad="props.row.nombre" />
                  <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                    <span class="chip__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>
                <div v-if="props.row.descripcion_criterio" class="text-weight-medium text-ink q-mb-xs">
                  {{ props.row.descripcion_criterio }}
                </div>
                <div v-if="props.row.ejemplos_falla" class="text-caption muted q-mb-xs">
                  Ej.: {{ props.row.ejemplos_falla }}
                </div>
                <div class="row items-center justify-between q-mt-sm q-mb-sm">
                  <span class="text-caption text-secondary text-weight-bold tabular-nums">
                    Asignación: {{ formatearMinutos(props.row.tiempo_max_asignacion_minutos) }}
                  </span>
                  <span class="chip brand tabular-nums">
                    {{ formatearHoras(props.row.tiempo_meta_resolucion_horas) }}
                  </span>
                </div>
              </div>
              <div class="row items-center justify-between q-pt-sm card-item-footer">
                <span class="chip" :class="props.row.activa_suplencia ? 'warn' : 'neutral'">
                  {{ props.row.activa_suplencia ? 'Suplencia activa' : 'Asignación normal' }}
                </span>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    outline
                    unelevated
                    dense
                    color="secondary"
                    icon="edit"
                    size="sm"
                    aria-label="Configurar prioridad"
                    class="btn-accion-icono"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Configurar prioridad</q-tooltip>
                  </q-btn>
                  <q-btn
                    outline
                    unelevated
                    dense
                    :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                    :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                    size="sm"
                    :aria-label="props.row.estado === 'Activo' ? 'Desactivar prioridad' : 'Activar prioridad'"
                    class="btn-accion-icono"
                    @click="alternarEstado(props.row)"
                  >
                    <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <PrioridadBadge :prioridad="props.row.nombre" />
          </q-td>
        </template>
        <template #body-cell-criterio="props">
          <q-td :props="props" class="celda-wrap">
            <div v-if="props.row.descripcion_criterio" class="text-weight-medium text-ink criterio-texto">
              {{ props.row.descripcion_criterio }}
            </div>
            <div v-else class="text-caption muted">Sin descripción registrada</div>
            <div v-if="props.row.ejemplos_falla" class="text-caption muted q-mt-xs criterio-texto">
              Ej.: {{ props.row.ejemplos_falla }}
            </div>
          </q-td>
        </template>
        <template #body-cell-metaAsignacion="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-weight-bold text-secondary tabular-nums">
              {{ formatearMinutos(props.row.tiempo_max_asignacion_minutos) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-metaResolucion="props">
          <q-td :props="props">
            <span class="chip brand tabular-nums">
              {{ formatearHoras(props.row.tiempo_meta_resolucion_horas) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-suplencia="props">
          <q-td :props="props">
            <span class="chip" :class="props.row.activa_suplencia ? 'warn' : 'neutral'">
              <span class="chip__dot" />
              {{ props.row.activa_suplencia ? 'Activa al vencer asignación' : 'Asignación normal por área' }}
            </span>
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
              <span class="chip__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <div class="row items-center justify-end q-gutter-xs no-wrap">
              <q-btn
                outline
                unelevated
                dense
                color="secondary"
                icon="edit"
                size="sm"
                aria-label="Configurar prioridad"
                class="btn-accion-icono"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Configurar prioridad</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                size="sm"
                :aria-label="props.row.estado === 'Activo' ? 'Desactivar prioridad' : 'Activar prioridad'"
                class="btn-accion-icono"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI SLAs] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_SLAS"
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

    <SlaFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :sla-editar="slaEditando"
      @guardar="guardarSla"
    />
    <ConfirmarAccionDialog
      :abierto="confirmacionAbierta"
      v-bind="confirmacionOpciones"
      @responder="responderConfirmacion"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import SlaFormDialog from '@/components/admin/SlaFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import {
  COLUMNAS_SLAS,
  OPCIONES_FILAS_POR_PAGINA_SLAS,
  OPCIONES_FILTRO_ESTADO,
  formatearHoras,
  formatearMinutos,
  useSlasCrud,
} from '@/composables/useSlasCrud';

const $q = useQuasar();
const {
  cargando,
  busqueda,
  filtroEstado,
  paginacion,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  slas,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  slaEditando,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarSla,
  alternarEstado,
} = useSlasCrud();
</script>

<style scoped lang="scss">
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}
.toolbar-section {
  border-bottom: 1px solid var(--border-subtle);
}
.btn-nuevo {
  padding: 8px 16px;
}

// 🛡️ [FASE 3 - UI SLAs] Tabla fija sin scroll horizontal y cabeceras/celdas adaptables
.tabla-slas {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  // Encabezados en una sola línea (altura uniforme de cabecera)
  :deep(thead tr th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
  }

  :deep(tbody td) {
    vertical-align: top;
    height: auto;
    white-space: normal;
    word-break: break-word;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.criterio-texto {
  line-height: 1.45;
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

// Pie de tabla de 3 zonas consistente con Configuraciones y Catálogo
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
