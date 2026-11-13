<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Tipo Departamentos</h1>
        <p class="page-subtitle">
          Clasificación organizacional de gerencias de TI, sub-gerencias técnicas y áreas usuarias.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Tipo"
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
        <div class="col-12 col-sm-8 col-md-6">
          <q-input
            v-model="busqueda"
            debounce="300"
            dense
            outlined
            clearable
            placeholder="Buscar por ID o nombre del tipo de departamento..."
          >
            <template #prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="tiposFiltrados"
        :columns="COLUMNAS_TIPO_DEPARTAMENTOS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron tipos de departamento registrados"
        loading-label="Cargando tipos de departamento..."
        class="tabla-pro-q"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="text-caption muted text-weight-medium">ID #{{ props.row.id }}</span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <div class="text-weight-bold text-dark">{{ props.row.nombre }}</div>
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  size="sm"
                  color="grey-8"
                  @click="abrirModalEditar(props.row)"
                >
                  <q-tooltip>Editar tipo de departamento</q-tooltip>
                </q-btn>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-id="props">
          <q-td :props="props">
            <span class="text-caption muted text-weight-medium">#{{ props.row.id }}</span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
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
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar tipo de departamento</q-tooltip>
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

    <TipoDepartamentoFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :tipo-editar="tipoEditando"
      @guardar="guardarTipoDepartamento"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import TipoDepartamentoFormDialog from '@/components/admin/TipoDepartamentoFormDialog.vue';
import {
  COLUMNAS_TIPO_DEPARTAMENTOS,
  useTipoDepartamentosView,
} from '@/composables/useTipoDepartamentosView';

const $q = useQuasar();
const {
  cargando,
  busqueda,
  paginacion,
  paginaActual,
  totalPaginas,
  tiposFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  tipoEditando,
  abrirModalCrear,
  abrirModalEditar,
  guardarTipoDepartamento,
} = useTipoDepartamentosView();
</script>

<style scoped lang="scss">
.btn-nuevo {
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
}
</style>
