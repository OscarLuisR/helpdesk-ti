<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="account_tree" size="14px" />
          Administración · Clasificación
        </span>
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

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-8 col-md-6">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por ID o nombre del tipo de departamento..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
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
        class="modern-table"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="text-caption muted text-weight-medium tabular-nums">ID #{{ props.row.id }}</span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <div class="text-weight-bold text-ink">{{ props.row.nombre }}</div>
                <q-btn
                  flat
                  unelevated
                  no-caps
                  round
                  dense
                  icon="edit"
                  size="sm"
                  class="row-action-btn"
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
            <span class="text-caption muted text-weight-medium tabular-nums">#{{ props.row.id }}</span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <span class="text-weight-bold text-ink">{{ props.row.nombre }}</span>
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
        <span class="text-caption muted tabular-nums">{{ textoMostrando }}</span>
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
