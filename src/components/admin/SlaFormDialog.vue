<template>
  <q-dialog :model-value="abierto" persistent @update:model-value="(val) => emit('update:abierto', val)">
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            Configurar SLA — Prioridad {{ slaEditar?.prioridad }}
          </div>
          <div class="text-caption muted">
            Ajusta los tiempos objetivo de asignación, resolución y umbral de suplencia.
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="guardando" @click="emit('update:abierto', false)" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner v-if="error" dense rounded class="form-error q-mb-md" role="alert">
          <template #avatar>
            <q-icon name="error_outline" color="negative" size="20px" />
          </template>
          {{ error }}
        </q-banner>

        <q-form class="q-gutter-y-md" @submit.prevent="alGuardar">
          <q-input
            v-model="criterio"
            type="textarea"
            rows="2"
            label="Criterio objetivo (Impacto × Urgencia)"
            outlined
            dense
            maxlength="220"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa el criterio objetivo']"
          />

          <q-input
            v-model="ejemploCorporativo"
            label="Ejemplo corporativo de referencia"
            outlined
            dense
            maxlength="160"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa un ejemplo corporativo']"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input
                v-model.number="minutosMetaAsignacion"
                type="number"
                min="1"
                max="1440"
                label="Asignación (min)"
                outlined
                dense
                lazy-rules
                :rules="[(v: number) => v > 0 || 'Mayor a 0']"
              />
            </div>
            <div class="col-4">
              <q-input
                v-model.number="horasResolucionMin"
                type="number"
                min="1"
                max="720"
                label="Resolución mín (h)"
                outlined
                dense
                lazy-rules
                :rules="[(v: number) => v > 0 || 'Mayor a 0']"
              />
            </div>
            <div class="col-4">
              <q-input
                v-model.number="horasResolucionMax"
                type="number"
                min="1"
                max="720"
                label="Resolución máx (h)"
                outlined
                dense
                lazy-rules
                :rules="[(v: number) => v >= horasResolucionMin || 'Debe ser >= mín']"
              />
            </div>
          </div>

          <div class="row items-center justify-between estado-row q-px-sm q-py-xs">
            <span class="text-body2 text-weight-medium text-dark">
              Habilitar asignación suplente por Mesa Técnica
            </span>
            <q-toggle v-model="activaSuplenciaMesa" color="primary" />
          </div>

          <q-input
            v-if="activaSuplenciaMesa"
            v-model.number="minutosUmbralSuplencia"
            type="number"
            min="1"
            max="480"
            label="Umbral de espera para activar suplencia (minutos)"
            outlined
            dense
            lazy-rules
            :rules="[(v: number) => v > 0 || 'Ingresa el tiempo umbral en minutos']"
          />

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
              label="Guardar SLA"
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
import type { ConfiguracionSla, PayloadConfiguracionSla } from '@/models/catalogos';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  slaEditar: ConfiguracionSla | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: PayloadConfiguracionSla];
}>();

const criterio = ref('');
const ejemploCorporativo = ref('');
const minutosMetaAsignacion = ref(15);
const horasResolucionMin = ref(1);
const horasResolucionMax = ref(4);
const activaSuplenciaMesa = ref(true);
const minutosUmbralSuplencia = ref(15);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto || !props.slaEditar) return;
    criterio.value = props.slaEditar.criterio;
    ejemploCorporativo.value = props.slaEditar.ejemploCorporativo;
    minutosMetaAsignacion.value = props.slaEditar.minutosMetaAsignacion;
    horasResolucionMin.value = props.slaEditar.horasResolucionMin;
    horasResolucionMax.value = props.slaEditar.horasResolucionMax;
    activaSuplenciaMesa.value = props.slaEditar.activaSuplenciaMesa;
    minutosUmbralSuplencia.value = props.slaEditar.minutosUmbralSuplencia;
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  emit('guardar', {
    criterio: limpiarTexto(criterio.value),
    ejemploCorporativo: limpiarTexto(ejemploCorporativo.value),
    minutosMetaAsignacion: Number(minutosMetaAsignacion.value),
    horasResolucionMin: Number(horasResolucionMin.value),
    horasResolucionMax: Number(horasResolucionMax.value),
    activaSuplenciaMesa: activaSuplenciaMesa.value,
    minutosUmbralSuplencia: Number(minutosUmbralSuplencia.value),
  });
}
</script>
