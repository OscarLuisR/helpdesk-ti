<template>
  <q-page class="q-pa-md q-pa-sm-lg dept-page">
    <!-- Encabezado de página -->
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="apartment" size="14px" />
          Administración · Estructura
        </span>
        <h1 class="page-title">Departamentos</h1>
        <p class="page-subtitle">
          Gestión de áreas corporativas solicitantes y sub-gerencias técnicas de TI.
        </p>
      </div>

      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nuevo Departamento"
          class="btn-nuevo"
          :class="{ 'full-width': $q.screen.xs }"
          @click="abrirModalCrear"
        />
      </div>
    </div>

    <!-- Contenedor principal de filtros y tabla -->
    <q-card flat bordered class="modern-card tabla-wrapper">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por código, nombre o responsable..."
            >
              <template #prepend>
                <q-icon name="search" size="18px" class="filter-icon" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              v-model="filtroTipo"
              :options="opcionesFiltroTipo"
              option-value="valor"
              option-label="etiqueta"
              emit-value
              map-options
              dense
              outlined
              options-dense
            />
          </div>
          <div class="col-12 col-sm-12 col-md-3">
            <q-select
              v-model="filtroEstado"
              :options="OPCIONES_FILTRO_ESTADO"
              dense
              outlined
              options-dense
            />
          </div>
        </div>

        <!-- Contexto descriptivo cuando hay un Tipo de Departamento filtrado -->
        <div v-if="tipoFiltroActivo" class="tipo-filtro-banner q-mt-sm">
          <div class="row items-center q-gutter-x-sm q-gutter-y-xs min-w-0">
            <TipoDepartamentoBadge
              :nombre="tipoFiltroActivo.nombre"
              :id-tipo="tipoFiltroActivo.id"
            />
            <span class="text-caption tipo-filtro-banner__desc">
              {{ tipoFiltroActivo.descripcion || 'Sin descripción registrada para este tipo.' }}
            </span>
          </div>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Ver todos"
            size="sm"
            class="shrink-0"
            @click="filtrarPorTipo('TODOS')"
          />
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="departamentosFiltrados"
        :columns="COLUMNAS_DEPARTAMENTOS"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_DEPARTAMENTOS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron departamentos con los filtros seleccionados"
        class="modern-table tabla-departamentos"
      >
        <!-- Vista móvil en tarjetas Bento -->
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-center justify-between no-wrap q-gutter-x-sm q-mb-sm">
                  <span class="chip brand chip-codigo tabular-nums">{{ props.row.codigo }}</span>
                  <span
                    class="soft-badge shrink-0"
                    :class="props.row.estado === 'Activo' ? 'soft-badge--ok' : 'soft-badge--bad'"
                  >
                    <span class="soft-badge__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>

                <div class="dept-name q-mb-xs">{{ props.row.nombre }}</div>
                <div v-if="props.row.ubicacion" class="text-caption muted q-mb-sm">
                  {{ props.row.ubicacion }}
                </div>

                <div class="row items-center justify-between q-gutter-xs q-mt-sm q-mb-sm">
                  <div class="row items-center no-wrap min-w-0">
                    <template v-if="props.row.responsable">
                      <q-avatar
                        size="26px"
                        class="q-mr-xs avatar-iniciales shrink-0"
                        :style="avatarSolicitanteStyle(props.row.responsable)"
                      >
                        {{ inicialesSolicitante(props.row.responsable) }}
                      </q-avatar>
                      <span class="text-caption dept-resp">{{ props.row.responsable }}</span>
                    </template>
                    <span v-else class="text-caption muted">Sin responsable asignado</span>
                  </div>
                  <TipoDepartamentoBadge
                    :nombre="props.row.tipo_departamento"
                    :id-tipo="props.row.id_tipo_departamento"
                    :descripcion="obtenerDescripcionTipo(props.row.id_tipo_departamento)"
                    clickable
                    class="shrink-0"
                    @click="filtrarPorTipo(props.row.id_tipo_departamento)"
                  />
                </div>
              </div>

              <div class="row items-center justify-between q-pt-sm mobile-card-divider">
                <span class="text-caption muted tabular-nums telefono-lineal">
                  <q-icon name="phone" size="14px" class="q-mr-xs" />
                  {{ props.row.telefono }}
                </span>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn
                    outline
                    unelevated
                    dense
                    color="secondary"
                    icon="edit"
                    size="sm"
                    aria-label="Editar departamento"
                    class="btn-accion-icono"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Editar departamento</q-tooltip>
                  </q-btn>
                  <q-btn
                    outline
                    unelevated
                    dense
                    :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                    :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                    size="sm"
                    :aria-label="props.row.estado === 'Activo' ? 'Desactivar departamento' : 'Activar departamento'"
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

        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="chip brand chip-codigo tabular-nums">
              {{ props.row.codigo }}
            </span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props" class="celda-wrap">
            <div class="column">
              <span class="dept-name">{{ props.row.nombre }}</span>
              <span v-if="props.row.ubicacion" class="text-caption muted q-mt-xs">
                {{ props.row.ubicacion }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-responsable="props">
          <q-td :props="props" class="celda-wrap">
            <div v-if="props.row.responsable" class="row items-center no-wrap">
              <q-avatar
                size="28px"
                class="q-mr-sm avatar-iniciales shrink-0"
                :style="avatarSolicitanteStyle(props.row.responsable)"
              >
                {{ inicialesSolicitante(props.row.responsable) }}
              </q-avatar>
              <span class="dept-resp min-w-0 col">{{ props.row.responsable }}</span>
            </div>
            <span v-else class="text-caption muted">Sin asignar</span>
          </q-td>
        </template>

        <template #body-cell-telefono="props">
          <q-td :props="props">
            <span class="text-caption dept-phone tabular-nums telefono-lineal">
              <q-icon name="phone" size="14px" class="filter-icon q-mr-xs" />
              {{ props.row.telefono }}
            </span>
          </q-td>
        </template>

        <template #body-cell-tipo="props">
          <q-td :props="props">
            <TipoDepartamentoBadge
              :nombre="props.row.tipo_departamento"
              :id-tipo="props.row.id_tipo_departamento"
              :descripcion="obtenerDescripcionTipo(props.row.id_tipo_departamento)"
              clickable
              @click="filtrarPorTipo(props.row.id_tipo_departamento)"
            />
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span
              class="soft-badge"
              :class="props.row.estado === 'Activo' ? 'soft-badge--ok' : 'soft-badge--bad'"
            >
              <span class="soft-badge__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <div class="row items-center justify-end no-wrap q-gutter-xs">
              <q-btn
                outline
                unelevated
                dense
                color="secondary"
                icon="edit"
                size="sm"
                class="btn-accion-icono"
                aria-label="Editar departamento"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Editar departamento</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                size="sm"
                class="btn-accion-icono"
                :aria-label="props.row.estado === 'Activo' ? 'Desactivar departamento' : 'Activar departamento'"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI DEPARTAMENTOS] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_DEPARTAMENTOS"
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

    <DepartmentFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :departamento-editar="departamentoEditando"
      :tipos-departamento="tiposDepartamento"
      @guardar="guardarDepartamento"
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
import DepartmentFormDialog from '@/components/admin/DepartmentFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import TipoDepartamentoBadge from '@/components/common/TipoDepartamentoBadge.vue';
import {
  COLUMNAS_DEPARTAMENTOS,
  OPCIONES_FILAS_POR_PAGINA_DEPARTAMENTOS,
  OPCIONES_FILTRO_ESTADO,
  useDepartmentsView,
} from '@/composables/useDepartmentsView';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';

const $q = useQuasar();

const {
  cargando,
  tiposDepartamento,
  opcionesFiltroTipo,
  tipoFiltroActivo,
  obtenerDescripcionTipo,
  filtrarPorTipo,
  busqueda,
  filtroTipo,
  filtroEstado,
  paginacion,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  departamentosFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  departamentoEditando,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarDepartamento,
  alternarEstado,
} = useDepartmentsView();
</script>

<style scoped lang="scss">
.dept-page {
  max-width: 1400px;
  margin: 0 auto;
}

.btn-nuevo {
  padding: 8px 16px;
}

.chip-codigo {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  max-width: 100%;
  white-space: nowrap;
}

.tipo-filtro-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);

  &__desc {
    color: var(--text-secondary);
    line-height: 1.4;
  }
}

.tabla-wrapper {
  overflow: hidden;
}

.toolbar-section {
  border-bottom: 1px solid var(--border-subtle);
}

.filter-icon {
  color: var(--text-muted);
}

.dept-name {
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
}

.dept-resp {
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
}

.dept-phone {
  color: var(--text-secondary);
}

.avatar-iniciales {
  font-size: 0.68rem;
  font-weight: 700;
}

.mobile-card-divider {
  border-top: 1px solid var(--border-subtle);
}

// 🛡️ [FASE 3 - UI DEPARTAMENTOS] Tabla fija sin scroll horizontal y celdas adaptables
.tabla-departamentos {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(thead tr th) {
    white-space: normal;
    line-height: 1.25;
    padding: 11px 10px;
  }

  :deep(tbody td) {
    height: auto;
    white-space: normal;
    word-break: break-word;
    padding: 12px 10px;
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

.telefono-lineal {
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

// Pie de tabla de 3 zonas consistente con Configuraciones, Catálogo, SLAs y Usuarios
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
