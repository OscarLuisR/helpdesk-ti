<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="page-title">Configuración de SLAs</h1>
        <p class="page-subtitle">
          Matriz objetiva de prioridades (Impacto × Urgencia), metas de respuesta y reglas de suplencia.
        </p>
      </div>
    </div>

    <q-card flat bordered class="tabla-card">
      <q-card-section class="row items-center no-wrap q-pa-md toolbar">
        <div class="col">
          <div class="row items-baseline q-gutter-x-sm">
            <span class="text-subtitle1 text-weight-bold text-dark">
              Políticas de Nivel de Servicio (Soporte, Redes y Aplicaciones)
            </span>
            <span class="text-caption muted">{{ slas.length }} niveles configurados</span>
          </div>
        </div>
      </q-card-section>

      <q-table
        flat
        class="tabla-pro-q"
        :rows="slas"
        :columns="COLUMNAS_SLAS"
        row-key="id"
        hide-pagination
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-prioridad="props">
          <q-td :props="props">
            <span class="chip" :class="PRIORIDAD_CLASS[props.row.prioridad as Prioridad]">
              <span class="chip__dot" />
              {{ props.row.prioridad }}
            </span>
          </q-td>
        </template>
        <template #body-cell-criterio="props">
          <q-td :props="props" style="max-width: 380px; white-space: normal">
            <div class="text-weight-medium text-dark">{{ props.row.criterio }}</div>
            <div class="text-caption muted q-mt-xs">Ej.: {{ props.row.ejemploCorporativo }}</div>
          </q-td>
        </template>
        <template #body-cell-metaAsignacion="props">
          <q-td :props="props">
            <span class="text-weight-bold text-secondary">
              {{ formatearMinutos(props.row.minutosMetaAsignacion) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-metaResolucion="props">
          <q-td :props="props">
            <span class="chip brand">
              {{ props.row.horasResolucionMin }} a {{ props.row.horasResolucionMax }} horas laborales
            </span>
          </q-td>
        </template>
        <template #body-cell-suplencia="props">
          <q-td :props="props">
            <span class="chip" :class="props.row.activaSuplenciaMesa ? 'warn' : 'neutral'">
              <span class="chip__dot" />
              {{
                props.row.activaSuplenciaMesa
                  ? `Activa tras ${props.row.minutosUmbralSuplencia} min`
                  : 'Asignación normal por área'
              }}
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
              icon="tune"
              label="Configurar"
              :ripple="false"
              @click="abrirModalEditar(props.row)"
            />
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
  </q-page>
</template>

<script setup lang="ts">
import SlaFormDialog from '@/components/admin/SlaFormDialog.vue';
import { COLUMNAS_SLAS, formatearMinutos, useSlasCrud } from '@/composables/useSlasCrud';
import { PRIORIDAD_CLASS } from '@/composables/useTickets';
import type { Prioridad } from '@/models/types';

const {
  slas,
  modalAbierto,
  guardando,
  errorFormulario,
  slaEditando,
  abrirModalEditar,
  guardarSla,
} = useSlasCrud();
</script>

<style scoped lang="scss">
.toolbar { border-bottom: 1px solid var(--border); }
</style>

