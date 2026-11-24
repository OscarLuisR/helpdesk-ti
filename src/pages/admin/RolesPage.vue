<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="admin_panel_settings" size="14px" />
          Administración · Seguridad
        </span>
        <h1 class="page-title">Roles</h1>
        <p class="page-subtitle">
          Catálogo de perfiles y niveles de autorización para el control de acceso al sistema.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Rol"
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
          <div class="col-12 col-sm-7 col-md-8">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por código o nombre del rol..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-5 col-md-4">
            <q-select
              v-model="filtroEstado"
              :options="OPCIONES_FILTRO_ESTADO_ROL"
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
        :rows="rolesFiltrados"
        :columns="COLUMNAS_ROLES"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_ROLES"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron roles con los filtros seleccionados"
        loading-label="Cargando roles del sistema..."
        class="modern-table tabla-roles"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-center justify-between no-wrap q-gutter-x-sm q-mb-sm">
                  <RolBadge :codigo="props.row.codigo" mono />
                  <span class="chip shrink-0" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                    <span class="chip__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>
                <div class="text-weight-bold text-ink rol-nombre">{{ props.row.nombre }}</div>
              </div>
              <div class="row items-center justify-between q-pt-sm q-mt-sm card-item-footer">
                <span class="text-caption muted tabular-nums">ID #{{ props.row.id }}</span>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn
                    outline
                    unelevated
                    dense
                    color="secondary"
                    icon="edit"
                    size="sm"
                    aria-label="Editar rol"
                    class="btn-accion-icono"
                    :disable="cambiandoEstadoId === props.row.id"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Editar rol</q-tooltip>
                  </q-btn>
                  <q-btn
                    outline
                    unelevated
                    dense
                    :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                    :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                    size="sm"
                    :aria-label="props.row.estado === 'Activo' ? 'Desactivar rol' : 'Activar rol'"
                    class="btn-accion-icono"
                    :loading="cambiandoEstadoId === props.row.id"
                    :disable="cambiandoEstadoId !== null"
                    @click="alternarEstado(props.row)"
                  >
                    <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-id="props">
          <q-td :props="props">
            <span class="text-caption muted text-weight-medium tabular-nums">#{{ props.row.id }}</span>
          </q-td>
        </template>

        <template #body-cell-codigo="props">
          <q-td :props="props">
            <RolBadge :codigo="props.row.codigo" mono />
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-weight-bold text-ink rol-nombre">{{ props.row.nombre }}</span>
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
                aria-label="Editar rol"
                class="btn-accion-icono"
                :disable="cambiandoEstadoId === props.row.id"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Editar rol</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                size="sm"
                :aria-label="props.row.estado === 'Activo' ? 'Desactivar rol' : 'Activar rol'"
                class="btn-accion-icono"
                :loading="cambiandoEstadoId === props.row.id"
                :disable="cambiandoEstadoId !== null"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI ROLES] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_ROLES"
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

    <RolFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :rol-editar="rolEditando"
      @guardar="guardarRol"
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
import RolFormDialog from '@/components/admin/RolFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import RolBadge from '@/components/common/RolBadge.vue';
import {
  COLUMNAS_ROLES,
  OPCIONES_FILAS_POR_PAGINA_ROLES,
  OPCIONES_FILTRO_ESTADO_ROL,
  useRolesView,
} from '@/composables/useRolesView';

const $q = useQuasar();
const {
  cargando,
  busqueda,
  filtroEstado,
  paginacion,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  rolesFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  cambiandoEstadoId,
  errorFormulario,
  rolEditando,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarRol,
  alternarEstado,
} = useRolesView();
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

// 🛡️ [FASE 3 - UI ROLES] Tabla fija sin scroll horizontal; encabezados en una sola línea
.tabla-roles {
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

.rol-nombre {
  line-height: 1.4;
}

.shrink-0 {
  flex-shrink: 0;
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

// Pie de tabla de 3 zonas consistente con el estándar aprobado
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
