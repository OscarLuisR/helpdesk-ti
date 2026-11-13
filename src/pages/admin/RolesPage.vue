<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
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

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-7 col-md-8">
          <q-input
            v-model="busqueda"
            debounce="300"
            dense
            outlined
            clearable
            placeholder="Buscar por código o nombre del rol..."
          >
            <template #prepend><q-icon name="search" color="grey-6" /></template>
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
        class="tabla-pro-q"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="chip" :class="rolCodigoChipClass(props.row.codigo)">
                  {{ props.row.codigo }}
                </span>
                <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                  {{ props.row.estado }}
                </span>
              </div>
              <div class="text-weight-bold text-dark q-mb-xs">{{ props.row.nombre }}</div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption muted">ID #{{ props.row.id }}</span>
                <div class="row items-center">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    size="sm"
                    color="grey-8"
                    :disable="cambiandoEstadoId === props.row.id"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Editar rol</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="props.row.estado === 'Activo' ? 'delete_outline' : 'check_circle_outline'"
                    size="sm"
                    :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'"
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
            <span class="text-caption muted text-weight-medium">#{{ props.row.id }}</span>
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
            <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              round
              dense
              icon="edit"
              size="sm"
              color="grey-8"
              :disable="cambiandoEstadoId === props.row.id"
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar rol</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              :icon="props.row.estado === 'Activo' ? 'delete_outline' : 'check_circle_outline'"
              size="sm"
              :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'"
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
        <span class="text-caption muted">{{ textoMostrando }}</span>
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
.btn-nuevo {
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
}
</style>
