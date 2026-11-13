<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Catálogo de Servicios</h1>
        <p class="page-subtitle">Tipificación de servicios e incidentes para la Mesa Técnica y áreas operativas de TI.</p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add" label="Nuevo Servicio" unelevated no-caps class="btn-nuevo" :class="{ 'full-width': $q.screen.xs }" @click="abrirModalCrear" />
      </div>
    </div>

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input v-model="busqueda" debounce="300" dense outlined clearable placeholder="Buscar por servicio, departamento o prioridad...">
            <template #prepend><q-icon name="search" color="grey-6" /></template>
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

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="serviciosFiltrados"
        :columns="COLUMNAS_CATALOGO"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron servicios registrados con los filtros aplicados"
        class="tabla-pro-q"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
                <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">{{ props.row.estado }}</span>
              </div>
              <div class="row items-center q-gutter-x-xs q-mb-xs">
                <span v-if="props.row.codigo_departamento" class="chip brand">{{ props.row.codigo_departamento }}</span>
                <span class="chip" :class="claseChipPrioridad(props.row.prioridad)">{{ props.row.prioridad }}</span>
              </div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption text-dark"><q-icon name="lan" size="14px" color="primary" class="q-mr-xs" />{{ props.row.departamento }}</span>
                <div class="row items-center">
                  <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)" />
                  <q-btn flat round dense icon="delete_outline" size="sm" :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'" @click="alternarEstado(props.row)" />
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props"><span class="text-weight-bold text-dark">{{ props.row.nombre }}</span></q-td>
        </template>
        <template #body-cell-departamento="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-x-xs">
              <span v-if="props.row.codigo_departamento" class="chip brand">{{ props.row.codigo_departamento }}</span>
              <span class="text-caption text-weight-medium text-dark">{{ props.row.departamento }}</span>
            </div>
          </q-td>
        </template>
        <template #body-cell-prioridad="props">
          <q-td :props="props"><span class="chip" :class="claseChipPrioridad(props.row.prioridad)">{{ props.row.prioridad }}</span></q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props"><span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">{{ props.row.estado }}</span></q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)"><q-tooltip>Editar servicio</q-tooltip></q-btn>
            <q-btn flat round dense icon="delete_outline" size="sm" :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'" @click="alternarEstado(props.row)"><q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip></q-btn>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer q-col-gutter-sm">
        <q-pagination v-model="paginaActual" :max="totalPaginas" :max-pages="$q.screen.lt.sm ? 3 : 5" direction-links active-design="unelevated" active-color="primary" color="grey-7" size="sm" />
        <span class="text-caption muted">{{ textoMostrando }}</span>
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
import {
  COLUMNAS_CATALOGO,
  OPCIONES_FILTRO_ESTADO,
  claseChipPrioridad,
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
.btn-nuevo { border-radius: 8px; padding: 6px 16px; font-weight: 600; }
</style>
