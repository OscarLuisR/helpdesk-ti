<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="category" size="14px" />
          Administración · Catálogo
        </span>
        <h1 class="page-title">Catálogo de Servicios</h1>
        <p class="page-subtitle">Tipificación de servicios e incidentes para la Mesa Técnica y áreas operativas de TI.</p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add" label="Nuevo Servicio" unelevated no-caps class="btn-nuevo" :class="{ 'full-width': $q.screen.xs }" @click="abrirModalCrear" />
      </div>
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-4">
            <q-input v-model="busqueda" debounce="300" dense outlined clearable placeholder="Buscar por servicio, departamento o prioridad...">
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="filtroDepartamento" :options="opcionesFiltroDepartamento" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="filtroPrioridad" :options="opcionesFiltroPrioridad" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="filtroEstado" :options="OPCIONES_FILTRO_ESTADO" dense outlined options-dense />
          </div>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="serviciosFiltrados"
        :columns="COLUMNAS_CATALOGO"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_CATALOGO"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron servicios registrados con los filtros aplicados"
        class="modern-table tabla-catalogo"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                  <span class="text-weight-bold text-ink">{{ props.row.nombre }}</span>
                  <span class="chip shrink-0" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                    <span class="chip__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>
                <div class="row items-center q-gutter-xs q-mt-xs q-mb-sm">
                  <PrioridadBadge :prioridad="props.row.prioridad" />
                  <span class="text-caption muted">
                    <q-icon name="lan" size="14px" color="primary" class="q-mr-xs" />
                    {{ props.row.departamento }}
                  </span>
                </div>
              </div>
              <div class="row items-center justify-end q-gutter-xs q-pt-sm card-item-footer">
                <q-btn
                  outline
                  unelevated
                  dense
                  color="secondary"
                  icon="edit"
                  size="sm"
                  aria-label="Editar servicio"
                  class="btn-accion-icono"
                  @click="abrirModalEditar(props.row)"
                >
                  <q-tooltip>Editar servicio</q-tooltip>
                </q-btn>
                <q-btn
                  outline
                  unelevated
                  dense
                  :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                  :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                  size="sm"
                  :aria-label="props.row.estado === 'Activo' ? 'Desactivar servicio' : 'Activar servicio'"
                  class="btn-accion-icono"
                  @click="alternarEstado(props.row)"
                >
                  <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
                </q-btn>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-weight-bold text-ink nombre-servicio">{{ props.row.nombre }}</span>
          </q-td>
        </template>
        <template #body-cell-departamento="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-caption text-weight-medium text-ink">{{ props.row.departamento }}</span>
          </q-td>
        </template>
        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <PrioridadBadge :prioridad="props.row.prioridad" />
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
                aria-label="Editar servicio"
                class="btn-accion-icono"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Editar servicio</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                size="sm"
                :aria-label="props.row.estado === 'Activo' ? 'Desactivar servicio' : 'Activar servicio'"
                class="btn-accion-icono"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI CATÁLOGO] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_CATALOGO"
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

    <CatalogFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :servicio-editar="servicioEditando"
      :departamentos="departamentosCatalogo"
      :prioridades="prioridadesCatalogo"
      @guardar="guardarServicio"
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
import CatalogFormDialog from '@/components/admin/CatalogFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import {
  COLUMNAS_CATALOGO,
  OPCIONES_FILAS_POR_PAGINA_CATALOGO,
  OPCIONES_FILTRO_ESTADO,
  useCatalogView,
} from '@/composables/useCatalogView';

const $q = useQuasar();
const {
  cargando,
  departamentosCatalogo,
  prioridadesCatalogo,
  opcionesFiltroDepartamento,
  opcionesFiltroPrioridad,
  busqueda,
  filtroDepartamento,
  filtroPrioridad,
  filtroEstado,
  paginacion,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  serviciosFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  servicioEditando,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarServicio,
  alternarEstado,
} = useCatalogView();
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

// 🛡️ [FASE 3 - UI CATÁLOGO] Tabla fija sin scroll horizontal y celdas multilínea
.tabla-catalogo {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(tbody td) {
    height: auto;
    white-space: normal;
    word-break: break-word;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.nombre-servicio {
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

.card-item-footer {
  border-top: 1px solid var(--border-subtle);
}

.shrink-0 {
  flex-shrink: 0;
}

// Pie de tabla de 3 zonas consistente con ConfiguracionesPage
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
