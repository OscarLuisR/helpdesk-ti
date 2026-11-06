<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="page-title">Catálogo de Casos (Tipos)</h1>
        <p class="page-subtitle">
          Tipificación de incidencias, requerimientos, desarrollos y actividades internas por sub-área.
        </p>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add_circle_outline"
        label="Nuevo Tipo de Caso"
        :ripple="false"
        @click="abrirModalCrear"
      />
    </div>

    <q-card flat bordered class="tabla-card">
      <q-card-section class="row items-center no-wrap q-pa-md toolbar">
        <div class="col">
          <div class="row items-baseline q-gutter-x-sm">
            <span class="text-subtitle1 text-weight-bold text-dark">Tipologías Registradas</span>
            <span class="text-caption muted">
              {{ tiposCasoFiltrados.length }}
              {{ tiposCasoFiltrados.length === 1 ? 'tipo' : 'tipos' }}
            </span>
          </div>
        </div>

        <div class="row items-center no-wrap q-gutter-x-sm">
          <q-input
            v-model="busqueda"
            outlined
            dense
            clearable
            placeholder="Buscar código, caso o área..."
            class="busqueda-input"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>

          <q-btn
            outline
            no-caps
            dense
            color="secondary"
            icon="filter_list"
            label="Naturaleza"
            class="btn-filtrar q-px-md"
            :ripple="false"
          >
            <q-badge v-if="naturalezasFiltro.length" floating rounded color="accent" text-color="dark">
              {{ naturalezasFiltro.length }}
            </q-badge>
            <q-menu anchor="bottom right" self="top right">
              <q-list dense style="min-width: 240px" class="q-pa-sm">
                <q-item-label header class="text-uppercase text-caption">Naturaleza</q-item-label>
                <q-item v-for="tipo in TIPOS_TRABAJO_DISPONIBLES" :key="tipo" tag="label" dense>
                  <q-item-section avatar>
                    <q-checkbox v-model="naturalezasFiltro" :val="tipo" dense color="primary" />
                  </q-item-section>
                  <q-item-section>{{ tipo }}</q-item-section>
                </q-item>
                <q-separator class="q-my-xs" />
                <q-item clickable dense :disable="!naturalezasFiltro.length" @click="limpiarFiltros">
                  <q-item-section class="text-caption text-primary">Limpiar filtros</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-card-section>

      <q-table
        flat
        class="tabla-pro-q"
        :rows="tiposCasoFiltrados"
        :columns="COLUMNAS_TIPOS_CASO"
        row-key="id"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay tipos de caso que mostrar"
        rows-per-page-label="Filas por página"
      >
        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="text-weight-bold text-secondary">{{ props.row.codigo }}</span>
          </q-td>
        </template>
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="column">
              <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
              <span class="text-caption muted">
                {{ props.row.requiereEquipo ? 'Exige identificar equipo afectado' : 'Sin equipo obligatorio' }}
              </span>
            </div>
          </q-td>
        </template>
        <template #body-cell-naturaleza="props">
          <q-td :props="props">
            <span class="chip" :class="NATURALEZA_CHIP_CLASS[props.row.naturaleza as TipoTrabajo]">
              <span class="chip__dot" />
              {{ props.row.naturaleza }}
            </span>
          </q-td>
        </template>
        <template #body-cell-prioridadSugerida="props">
          <q-td :props="props">
            <span class="chip" :class="PRIORIDAD_CLASS[props.row.prioridadSugerida as Prioridad]">
              <span class="chip__dot" />
              {{ props.row.prioridadSugerida }}
            </span>
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <span class="chip" :class="props.row.activo ? 'ok' : 'neutral'">
              <span class="chip__dot" />
              {{ props.row.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="edit"
              label="Editar"
              :ripple="false"
              class="q-mr-xs"
              @click="abrirModalEditar(props.row)"
            />
            <q-btn
              flat
              dense
              no-caps
              :color="props.row.activo ? 'negative' : 'positive'"
              :label="props.row.activo ? 'Desactivar' : 'Activar'"
              :ripple="false"
              @click="cambiarEstado(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <TipoCasoFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :tipo-caso-editar="tipoCasoEditando"
      @guardar="guardarTipoCaso"
    />
  </q-page>
</template>

<script setup lang="ts">
import TipoCasoFormDialog from '@/components/admin/TipoCasoFormDialog.vue';
import {
  COLUMNAS_TIPOS_CASO,
  NATURALEZA_CHIP_CLASS,
  TIPOS_TRABAJO_DISPONIBLES,
  useCatalogoCasosCrud,
} from '@/composables/useCatalogoCasosCrud';
import { PRIORIDAD_CLASS } from '@/composables/useTickets';
import type { Prioridad, TipoTrabajo } from '@/models/types';

const {
  busqueda,
  naturalezasFiltro,
  modalAbierto,
  guardando,
  errorFormulario,
  tipoCasoEditando,
  tiposCasoFiltrados,
  limpiarFiltros,
  abrirModalCrear,
  abrirModalEditar,
  guardarTipoCaso,
  cambiarEstado,
} = useCatalogoCasosCrud();
</script>

<style scoped lang="scss">
.toolbar { border-bottom: 1px solid var(--border); }
.busqueda-input { width: 260px; }
.btn-filtrar { border-color: var(--border); }
</style>
