<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Departamentos</h1>
        <p class="page-subtitle">Gestión de áreas corporativas solicitantes y sub-gerencias técnicas de TI.</p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add" label="Nuevo Departamento" unelevated no-caps class="btn-nuevo" :class="{ 'full-width': $q.screen.xs }" @click="abrirModalCrear" />
      </div>
    </div>

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input v-model="busqueda" dense outlined clearable placeholder="Buscar por código, nombre o responsable...">
            <template #prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <q-select v-model="filtroTipo" :options="OPCIONES_FILTRO_TIPO" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
        </div>
        <div class="col-12 col-sm-12 col-md-4">
          <q-select v-model="filtroEstado" :options="OPCIONES_FILTRO_ESTADO" dense outlined options-dense />
        </div>
      </div>

      <q-table
        flat
        :rows="departamentosPaginados"
        :columns="COLUMNAS_DEPARTAMENTOS"
        row-key="id"
        :grid="$q.screen.lt.md"
        hide-pagination
        :pagination="{ rowsPerPage: filasPorPagina }"
        no-data-label="No se encontraron departamentos con los filtros seleccionados"
        class="tabla-pro-q"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="chip" :class="props.row.esSubgerenciaTI ? 'brand' : 'neutral'">{{ props.row.codigo }}</span>
                <span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">{{ props.row.estado }}</span>
              </div>
              <div class="text-weight-bold text-dark q-mb-xs">{{ props.row.nombre }}</div>
              <div v-if="props.row.ubicacion" class="text-caption muted q-mb-xs">{{ props.row.ubicacion }}</div>
              <div class="row items-center justify-between q-mt-sm">
                <div class="row items-center no-wrap">
                  <q-avatar size="24px" class="q-mr-xs avatar-iniciales" :style="avatarSolicitanteStyle(props.row.responsable)">
                    {{ inicialesSolicitante(props.row.responsable) }}
                  </q-avatar>
                  <span class="text-caption text-dark text-weight-medium">{{ props.row.responsable }}</span>
                </div>
                <div class="row items-center">
                  <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)" />
                  <q-btn flat round dense icon="delete_outline" size="sm" :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'" @click="alternarEstado(props.row)" />
                </div>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <span class="text-caption text-dark"><q-icon name="phone" size="14px" color="grey-7" class="q-mr-xs" />{{ props.row.telefono }}</span>
                <span class="chip" :class="props.row.esSubgerenciaTI ? 'brand' : 'info'">{{ props.row.esSubgerenciaTI ? 'Sub-Gerencia TI' : 'Área Usuaria' }}</span>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-codigo="props">
          <q-td :props="props"><span class="chip" :class="props.row.esSubgerenciaTI ? 'brand' : 'neutral'">{{ props.row.codigo }}</span></q-td>
        </template>
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="column">
              <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
              <span v-if="props.row.ubicacion" class="text-caption muted">{{ props.row.ubicacion }}</span>
            </div>
          </q-td>
        </template>
        <template #body-cell-responsable="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar size="30px" class="q-mr-sm avatar-iniciales" :style="avatarSolicitanteStyle(props.row.responsable)">
                {{ inicialesSolicitante(props.row.responsable) }}
              </q-avatar>
              <span class="text-weight-medium text-dark">{{ props.row.responsable }}</span>
            </div>
          </q-td>
        </template>
        <template #body-cell-telefono="props">
          <q-td :props="props"><span class="text-caption text-dark text-weight-medium"><q-icon name="phone" size="14px" color="grey-7" class="q-mr-xs" />{{ props.row.telefono }}</span></q-td>
        </template>
        <template #body-cell-tipo="props">
          <q-td :props="props"><span class="chip" :class="props.row.esSubgerenciaTI ? 'brand' : 'info'">{{ props.row.esSubgerenciaTI ? 'Sub-Gerencia TI' : 'Área Usuaria' }}</span></q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props"><span class="chip" :class="props.row.estado === 'Activo' ? 'ok' : 'bad'">{{ props.row.estado }}</span></q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)"><q-tooltip>Editar departamento</q-tooltip></q-btn>
            <q-btn flat round dense icon="delete_outline" size="sm" :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'" @click="alternarEstado(props.row)"><q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip></q-btn>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer q-col-gutter-sm">
        <q-pagination v-model="paginaActual" :max="totalPaginas" :max-pages="$q.screen.lt.sm ? 3 : 5" direction-links active-design="unelevated" active-color="primary" color="grey-7" size="sm" />
        <span class="text-caption muted">{{ textoMostrando }}</span>
      </div>
    </q-card>

    <DepartmentFormDialog v-model:abierto="modalAbierto" :guardando="guardando" :error="errorFormulario" :departamento-editar="departamentoEditando" @guardar="guardarDepartamento" />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DepartmentFormDialog from '@/components/admin/DepartmentFormDialog.vue';
import {
  COLUMNAS_DEPARTAMENTOS,
  OPCIONES_FILTRO_ESTADO,
  OPCIONES_FILTRO_TIPO,
  useDepartmentsView,
} from '@/composables/useDepartmentsView';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';

const $q = useQuasar();
const {
  busqueda,
  filtroTipo,
  filtroEstado,
  paginaActual,
  filasPorPagina,
  totalPaginas,
  departamentosPaginados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  departamentoEditando,
  abrirModalCrear,
  abrirModalEditar,
  guardarDepartamento,
  alternarEstado,
} = useDepartmentsView();
</script>

<style scoped lang="scss">
.btn-nuevo { border-radius: 8px; padding: 6px 16px; font-weight: 600; }
.avatar-iniciales { font-size: 11px; font-weight: 600; }
</style>
