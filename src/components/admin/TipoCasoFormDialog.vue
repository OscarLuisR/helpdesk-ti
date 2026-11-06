<template>
  <q-dialog
    :model-value="abierto"
    persistent
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ tipoCasoEditar ? 'Editar Tipo de Caso' : 'Nuevo Tipo de Caso' }}
          </div>
          <div class="text-caption muted">
            Clasificación por naturaleza de trabajo, sub-área receptora y prioridad sugerida.
          </div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          :disable="guardando"
          @click="emit('update:abierto', false)"
        />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner v-if="error" dense rounded class="form-error q-mb-md" role="alert">
          <template #avatar>
            <q-icon name="error_outline" color="negative" size="20px" />
          </template>
          {{ error }}
        </q-banner>

        <q-form class="q-gutter-y-md" @submit.prevent="alGuardar">
          <div class="row q-col-gutter-sm">
            <div class="col-5">
              <q-input
                v-model="codigo"
                label="Código (ej. INC-RED-01)"
                outlined
                dense
                maxlength="16"
                lazy-rules
                :rules="[(v: string) => !!v?.trim() || 'Ingresa el código']"
              />
            </div>
            <div class="col-7">
              <q-select
                v-model="naturaleza"
                :options="TIPOS_TRABAJO_DISPONIBLES"
                label="Naturaleza del ticket"
                outlined
                dense
                options-dense
              />
            </div>
          </div>

          <q-input
            v-model="nombre"
            label="Nombre descriptivo del caso o actividad"
            outlined
            dense
            maxlength="100"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa el nombre del tipo de caso']"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select
                v-model="areaDestino"
                :options="AREAS_TI_DISPONIBLES"
                label="Sub-Área de TI destino"
                outlined
                dense
                options-dense
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="prioridadSugerida"
                :options="PRIORIDADES_DISPONIBLES"
                label="Prioridad sugerida"
                outlined
                dense
                options-dense
              />
            </div>
          </div>

          <div class="row items-center justify-between estado-row q-px-sm q-py-xs">
            <span class="text-body2 text-weight-medium text-dark">
              Exigir identificación de equipo afectado
            </span>
            <q-toggle v-model="requiereEquipo" color="primary" />
          </div>

          <div class="row items-center justify-between estado-row q-px-sm q-py-xs">
            <span class="text-body2 text-weight-medium text-dark">Estado en el catálogo</span>
            <q-toggle v-model="activo" color="primary" :label="activo ? 'Activo' : 'Inactivo'" />
          </div>

          <div class="row justify-end q-gutter-x-sm q-pt-sm">
            <q-btn
              flat
              no-caps
              color="secondary"
              label="Cancelar"
              :disable="guardando"
              @click="emit('update:abierto', false)"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :label="tipoCasoEditar ? 'Guardar cambios' : 'Crear tipo de caso'"
              :loading="guardando"
              :disable="guardando"
            >
              <template #loading>
                <q-spinner-oval size="18px" class="q-mr-sm" />
                <span>Guardando...</span>
              </template>
            </q-btn>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  AREAS_TI_DISPONIBLES,
  PRIORIDADES_DISPONIBLES,
  TIPOS_TRABAJO_DISPONIBLES,
} from '@/composables/useCatalogoCasosCrud';
import type { PayloadTipoCasoMaestro, TipoCasoMaestro } from '@/models/catalogos';
import type { AreaDestino, Prioridad, TipoTrabajo } from '@/models/types';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  tipoCasoEditar: TipoCasoMaestro | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: PayloadTipoCasoMaestro];
}>();

const codigo = ref('');
const nombre = ref('');
const naturaleza = ref<TipoTrabajo>('Incidencia');
const areaDestino = ref<AreaDestino>('Soporte Técnico');
const prioridadSugerida = ref<Prioridad>('Media');
const requiereEquipo = ref(true);
const activo = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    codigo.value = props.tipoCasoEditar?.codigo ?? '';
    nombre.value = props.tipoCasoEditar?.nombre ?? '';
    naturaleza.value = props.tipoCasoEditar?.naturaleza ?? 'Incidencia';
    areaDestino.value = props.tipoCasoEditar?.areaDestino ?? 'Soporte Técnico';
    prioridadSugerida.value = props.tipoCasoEditar?.prioridadSugerida ?? 'Media';
    requiereEquipo.value = props.tipoCasoEditar?.requiereEquipo ?? true;
    activo.value = props.tipoCasoEditar?.activo ?? true;
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  emit('guardar', {
    codigo: limpiarTexto(codigo.value).toUpperCase(),
    nombre: limpiarTexto(nombre.value),
    naturaleza: naturaleza.value,
    areaDestino: areaDestino.value,
    prioridadSugerida: prioridadSugerida.value,
    requiereEquipo: requiereEquipo.value,
    activo: activo.value,
  });
}
</script>
