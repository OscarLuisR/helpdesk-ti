<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="page-title">Departamentos</h1>
        <p class="page-subtitle">
          Catálogo de gerencias y áreas solicitantes con su ubicación y extensión telefónica.
        </p>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add_business"
        label="Nuevo Departamento"
        :ripple="false"
        @click="abrirModalCrear"
      />
    </div>

    <q-card flat bordered class="tabla-card">
      <q-card-section class="row items-center no-wrap q-pa-md toolbar">
        <div class="col">
          <div class="row items-baseline q-gutter-x-sm">
            <span class="text-subtitle1 text-weight-bold text-dark">Áreas Solicitantes</span>
            <span class="text-caption muted">
              {{ departamentosFiltrados.length }}
              {{ departamentosFiltrados.length === 1 ? 'departamento' : 'departamentos' }}
            </span>
          </div>
        </div>

        <div class="row items-center no-wrap q-gutter-x-md">
          <q-toggle
            v-model="soloActivos"
            color="primary"
            dense
            label="Solo activos"
            class="text-caption text-dark"
          />

          <q-input
            v-model="busqueda"
            outlined
            dense
            clearable
            placeholder="Buscar departamento..."
            class="busqueda-input"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-table
        flat
        class="tabla-pro-q"
        :rows="departamentosFiltrados"
        :columns="COLUMNAS_DEPARTAMENTOS"
        row-key="id"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay departamentos que mostrar"
        rows-per-page-label="Filas por página"
      >
        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="chip brand">{{ props.row.codigo }}</span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="column">
              <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
              <span class="text-caption muted">{{ props.row.ubicacion }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-responsable="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="30px"
                class="q-mr-sm avatar-iniciales"
                :style="avatarSolicitanteStyle(props.row.responsable)"
              >
                {{ inicialesSolicitante(props.row.responsable) }}
              </q-avatar>
              <span class="text-dark">{{ props.row.responsable }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-extensionTelefonica="props">
          <q-td :props="props">
            <span class="chip info">Ext. {{ props.row.extensionTelefonica }}</span>
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

    <DepartamentoFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :departamento-editar="departamentoEditando"
      @guardar="guardarDepartamento"
    />
  </q-page>
</template>

<script setup lang="ts">
import DepartamentoFormDialog from '@/components/admin/DepartamentoFormDialog.vue';
import {
  COLUMNAS_DEPARTAMENTOS,
  useDepartamentosCrud,
} from '@/composables/useDepartamentosCrud';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';

const {
  busqueda,
  soloActivos,
  modalAbierto,
  guardando,
  errorFormulario,
  departamentoEditando,
  departamentosFiltrados,
  abrirModalCrear,
  abrirModalEditar,
  guardarDepartamento,
  cambiarEstado,
} = useDepartamentosCrud();
</script>

<style scoped lang="scss">
.toolbar { border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
.busqueda-input { width: 260px; }
.avatar-iniciales { font-size: 12px; font-weight: 600; }
</style>

