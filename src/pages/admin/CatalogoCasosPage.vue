<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-start sm:items-center justify-between q-col-gutter-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Catálogo de Servicios</h1>
        <p class="page-subtitle">Tipificación de servicios e incidentes para la Mesa Técnica y áreas operativas de TI.</p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add" label="Nuevo Servicio" unelevated no-caps class="btn-nuevo full-width sm:auto" @click="abrirModalCrear" />
      </div>
    </div>

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-input v-model="busqueda" dense outlined clearable placeholder="Buscar por servicio...">
            <template #prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select v-model="filtroNaturaleza" :options="OPCIONES_FILTRO_NATURALEZA" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select v-model="filtroSubgerencia" :options="OPCIONES_FILTRO_SUBGERENCIA" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select v-model="filtroEstado" :options="OPCIONES_FILTRO_ESTADO" dense outlined options-dense />
        </div>
      </div>

      <q-table
        flat
        :rows="serviciosPaginados"
        :columns="COLUMNAS_CATALOGO"
        row-key="id"
        :grid="$q.screen.lt.md"
        hide-pagination
        :pagination="{ rowsPerPage: filasPorPagina }"
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
                <span class="chip" :class="NATURALEZA_CHIP_CLASS[props.row.naturaleza as NaturalezaTrabajo]">{{ props.row.naturaleza }}</span>
                <span class="chip" :class="PRIORIDAD_CHIP_CLASS[props.row.prioridadSugerida as PrioridadSugerida]">{{ props.row.prioridadSugerida }}</span>
              </div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption text-dark"><q-icon name="lan" size="14px" color="primary" class="q-mr-xs" />{{ props.row.subgerenciaDestino }}</span>
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
        <template #body-cell-naturaleza="props">
          <q-td :props="props"><span class="chip" :class="NATURALEZA_CHIP_CLASS[props.row.naturaleza as NaturalezaTrabajo]">{{ props.row.naturaleza }}</span></q-td>
        </template>
        <template #body-cell-subgerenciaDestino="props">
          <q-td :props="props"><span class="text-caption text-weight-medium text-dark"><q-icon name="lan" size="14px" color="primary" class="q-mr-xs" />{{ props.row.subgerenciaDestino }}</span></q-td>
        </template>
        <template #body-cell-prioridadSugerida="props">
          <q-td :props="props"><span class="chip" :class="PRIORIDAD_CHIP_CLASS[props.row.prioridadSugerida as PrioridadSugerida]">{{ props.row.prioridadSugerida }}</span></q-td>
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

    <CatalogFormDialog v-model:abierto="modalAbierto" :guardando="guardando" :error="errorFormulario" :servicio-editar="servicioEditando" @guardar="guardarServicio" />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import CatalogFormDialog from '@/components/admin/CatalogFormDialog.vue';
import {
  COLUMNAS_CATALOGO,
  NATURALEZA_CHIP_CLASS,
  OPCIONES_FILTRO_ESTADO,
  OPCIONES_FILTRO_NATURALEZA,
  OPCIONES_FILTRO_SUBGERENCIA,
  PRIORIDAD_CHIP_CLASS,
  useCatalogView,
} from '@/composables/useCatalogView';
import type { NaturalezaTrabajo, PrioridadSugerida } from '@/stores/useCatalogStore';

const $q = useQuasar();
const {
  busqueda,
  filtroNaturaleza,
  filtroSubgerencia,
  filtroEstado,
  paginaActual,
  filasPorPagina,
  totalPaginas,
  serviciosPaginados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  servicioEditando,
  abrirModalCrear,
  abrirModalEditar,
  guardarServicio,
  alternarEstado,
} = useCatalogView();
</script>

<style scoped lang="scss">
.btn-nuevo { border-radius: 8px; padding: 6px 16px; font-weight: 600; }
</style>
