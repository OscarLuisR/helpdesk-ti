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
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron roles con los filtros seleccionados"
        loading-label="Cargando roles del sistema..."
        class="modern-table"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="chip" :class="rolCodigoChipClass(props.row.codigo)">
                  {{ props.row.codigo }}
                </span>
                <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                  <span class="chip__dot" />
                  {{ props.row.estado }}
                </span>
              </div>
              <div class="text-weight-bold text-ink q-mb-xs">{{ props.row.nombre }}</div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption muted tabular-nums">ID #{{ props.row.id }}</span>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    flat
                    unelevated
                    no-caps
                    round
                    dense
                    icon="edit"
                    size="sm"
                    class="row-action-btn"
                    :disable="cambiandoEstadoId === props.row.id"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Editar rol</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    unelevated
                    no-caps
                    round
                    dense
                    :icon="props.row.estado === 'Activo' ? 'delete_outline' : 'check_circle_outline'"
                    size="sm"
                    :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'"
                    :loading="cambiandoEstadoId === props.row.id"
                    :disable="cambiandoEstadoId !== null"
                    @click="alternarEstado(props.row)"
                  >
                    <q-tooltip>
                      {{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}
                    </q-tooltip>
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
            <span class="chip" :class="rolCodigoChipClass(props.row.codigo)">
              {{ props.row.codigo }}
            </span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <span class="text-weight-bold text-ink">{{ props.row.nombre }}</span>
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
          <q-td :props="props" auto-width>
            <q-btn
              flat
              unelevated
              no-caps
              round
              dense
              icon="edit"
              size="sm"
              class="row-action-btn"
              :disable="cambiandoEstadoId === props.row.id"
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar rol</q-tooltip>
            </q-btn>
            <q-btn
              flat
              unelevated
              no-caps
              round
              dense
              :icon="props.row.estado === 'Activo' ? 'delete_outline' : 'check_circle_outline'"
              size="sm"
              :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'"
              :loading="cambiandoEstadoId === props.row.id"
              :disable="cambiandoEstadoId !== null"
              @click="alternarEstado(props.row)"
            >
              <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer q-col-gutter-sm">
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
        <span class="text-caption muted tabular-nums">{{ textoMostrando }}</span>
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
import {
  COLUMNAS_ROLES,
  OPCIONES_FILTRO_ESTADO_ROL,
  rolCodigoChipClass,
  useRolesView,
} from '@/composables/useRolesView';

const $q = useQuasar();
const {
  cargando,
  busqueda,
  filtroEstado,
  paginacion,
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
</style>
