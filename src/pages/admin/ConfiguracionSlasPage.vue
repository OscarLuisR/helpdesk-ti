<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
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

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-8 col-md-9">
          <q-input
            v-model="busqueda"
            debounce="300"
            dense
            outlined
            clearable
            placeholder="Buscar por prioridad, criterio o ejemplo..."
          >
            <template #prepend><q-icon name="search" color="grey-6" /></template>
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

      <q-table
        flat
        v-model:pagination="paginacion"
        class="tabla-pro-q"
        :rows="slas"
        :columns="COLUMNAS_SLAS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No hay prioridades registradas"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="chip" :class="claseChipPrioridad(props.row.nombre)">
                  <span class="chip__dot" />
                  {{ props.row.nombre }}
                </span>
                <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">
                  {{ props.row.estado }}
                </span>
              </div>
              <div v-if="props.row.descripcion_criterio" class="text-weight-medium text-dark q-mb-xs">
                {{ props.row.descripcion_criterio }}
              </div>
              <div v-if="props.row.ejemplos_falla" class="text-caption muted q-mb-xs">
                Ej.: {{ props.row.ejemplos_falla }}
              </div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption text-secondary text-weight-bold">
                  Asignación: {{ formatearMinutos(props.row.tiempo_max_asignacion_minutos) }}
                </span>
                <span class="chip brand">
                  {{ formatearHoras(props.row.tiempo_meta_resolucion_horas) }}
                </span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <span class="chip" :class="props.row.activa_suplencia ? 'warn' : 'neutral'">
                  {{ props.row.activa_suplencia ? 'Suplencia activa' : 'Asignación normal' }}
                </span>
                <div class="row items-center">
                  <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)" />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete_outline"
                    size="sm"
                    :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'"
                    @click="alternarEstado(props.row)"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <span class="chip" :class="claseChipPrioridad(props.row.nombre)">
              <span class="chip__dot" />
              {{ props.row.nombre }}
            </span>
          </q-td>
        </template>
        <template #body-cell-criterio="props">
          <q-td :props="props" style="max-width: 380px; white-space: normal">
            <div v-if="props.row.descripcion_criterio" class="text-weight-medium text-dark">
              {{ props.row.descripcion_criterio }}
            </div>
            <div v-else class="text-caption muted">Sin descripción registrada</div>
            <div v-if="props.row.ejemplos_falla" class="text-caption muted q-mt-xs">
              Ej.: {{ props.row.ejemplos_falla }}
            </div>
          </q-td>
        </template>
        <template #body-cell-metaAsignacion="props">
          <q-td :props="props">
            <span class="text-weight-bold text-secondary">
              {{ formatearMinutos(props.row.tiempo_max_asignacion_minutos) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-metaResolucion="props">
          <q-td :props="props">
            <span class="chip brand">
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
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)">
              <q-tooltip>Configurar prioridad</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete_outline"
              size="sm"
              :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'"
              @click="alternarEstado(props.row)"
            >
              <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
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
import {
  COLUMNAS_SLAS,
  OPCIONES_FILTRO_ESTADO,
  claseChipPrioridad,
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
  slas,
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
.btn-nuevo { border-radius: 8px; padding: 6px 16px; font-weight: 600; }
</style>
