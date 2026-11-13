<template>
  <q-dialog
    :model-value="abierto"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card flat bordered class="dialog-card" :class="{ 'no-border-radius full-height': $q.screen.lt.sm }">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ slaEditar ? `Configurar SLA — ${slaEditar.nombre}` : 'Nueva Prioridad SLA' }}
          </div>
          <div class="text-caption muted">
            {{
              slaEditar
                ? 'Ajusta los criterios, tiempos objetivo de asignación, resolución y regla de suplencia.'
                : 'Define un nuevo nivel de prioridad para los tiempos objetivo de atención.'
            }}
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
            v-model="nombre"
            label="Nombre de la prioridad"
            placeholder="Ej. Crítica"
            outlined
            dense
            maxlength="20"
            lazy-rules
            :rules="[
              (v: string) => !!v?.trim() || 'Ingresa el nombre de la prioridad',
              (v: string) => (v?.trim().length ?? 0) <= 20 || 'Máximo 20 caracteres',
            ]"
          />

          <q-input
            v-model="descripcionCriterio"
            type="textarea"
            rows="2"
            label="Criterio objetivo (Impacto × Urgencia) (Opcional)"
            placeholder="Describe el criterio de impacto y urgencia para esta prioridad..."
            outlined
            dense
          />

          <q-input
            v-model="ejemplosFalla"
            label="Ejemplos de falla de referencia (Opcional)"
            placeholder="Ej. Caída de servidor administrativo o corte de red principal."
            outlined
            dense
          />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="tiempoMaxAsignacionMinutos"
                type="number"
                min="1"
                max="10080"
                label="Meta máx. asignación (minutos)"
                outlined
                dense
                lazy-rules
                :rules="[(v: number) => (Number.isInteger(v) && v > 0) || 'Entero mayor a 0']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="tiempoMetaResolucionHoras"
                type="number"
                min="1"
                max="720"
                label="Meta resolución (horas)"
                outlined
                dense
                lazy-rules
                :rules="[(v: number) => (Number.isInteger(v) && v > 0) || 'Entero mayor a 0']"
              />
            </div>
          </div>

          <div class="row items-center justify-between estado-row q-px-md q-py-xs">
            <div>
              <div class="text-body2 text-weight-medium text-dark">
                Habilitar asignación suplente por Mesa Técnica
              </div>
              <div class="text-caption muted">
                Permite escalamiento automático cuando vence el tiempo máximo de asignación
              </div>
            </div>
            <q-toggle v-model="activaSuplencia" color="primary" />
          </div>

          <div v-if="slaEditar" class="row items-center justify-between estado-row q-px-md q-py-xs">
            <div>
              <div class="text-body2 text-weight-medium text-dark">Estado de la prioridad</div>
              <div class="text-caption muted">{{ isActivo ? 'Activo' : 'Inactivo' }}</div>
            </div>
            <q-toggle v-model="isActivo" color="primary" />
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
              :label="slaEditar ? 'Guardar cambios' : 'Crear prioridad'"
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
import { useQuasar } from 'quasar';
import type { PrioridadFormPayload, PrioridadItem } from '@/stores/usePrioridadesStore';

const $q = useQuasar();
const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  slaEditar: PrioridadItem | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: PrioridadFormPayload];
}>();

const nombre = ref('');
const descripcionCriterio = ref('');
const ejemplosFalla = ref('');
const tiempoMaxAsignacionMinutos = ref(15);
const tiempoMetaResolucionHoras = ref(4);
const activaSuplencia = ref(true);
const isActivo = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.slaEditar) {
      nombre.value = props.slaEditar.nombre;
      descripcionCriterio.value = props.slaEditar.descripcion_criterio ?? '';
      ejemplosFalla.value = props.slaEditar.ejemplos_falla ?? '';
      tiempoMaxAsignacionMinutos.value = props.slaEditar.tiempo_max_asignacion_minutos;
      tiempoMetaResolucionHoras.value = props.slaEditar.tiempo_meta_resolucion_horas;
      activaSuplencia.value = props.slaEditar.activa_suplencia;
      isActivo.value = props.slaEditar.is_activo;
    } else {
      nombre.value = '';
      descripcionCriterio.value = '';
      ejemplosFalla.value = '';
      tiempoMaxAsignacionMinutos.value = 15;
      tiempoMetaResolucionHoras.value = 4;
      activaSuplencia.value = true;
      isActivo.value = true;
    }
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  const criterioLimpio = limpiarTexto(descripcionCriterio.value);
  const ejemploLimpio = limpiarTexto(ejemplosFalla.value);

  const payload: PrioridadFormPayload = {
    nombre: limpiarTexto(nombre.value),
    tiempo_max_asignacion_minutos: Number(tiempoMaxAsignacionMinutos.value),
    tiempo_meta_resolucion_horas: Number(tiempoMetaResolucionHoras.value),
    descripcion_criterio: criterioLimpio.length > 0 ? criterioLimpio : null,
    ejemplos_falla: ejemploLimpio.length > 0 ? ejemploLimpio : null,
    activa_suplencia: activaSuplencia.value,
  };

  if (props.slaEditar) {
    payload.is_activo = isActivo.value;
  }

  emit('guardar', payload);
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 680px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header { border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
.estado-row { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; }
.form-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
</style>
