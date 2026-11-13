<template>
  <q-dialog
    :model-value="abierto"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card
      flat
      bordered
      class="dialog-card"
      :class="{ 'no-border-radius full-height': $q.screen.lt.sm }"
    >
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ tipoEditar ? 'Editar Tipo de Departamento' : 'Nuevo Tipo de Departamento' }}
          </div>
          <div class="text-caption muted">
            {{
              tipoEditar
                ? 'Actualiza la denominación del tipo de departamento.'
                : 'Registra una nueva clasificación organizacional para los departamentos.'
            }}
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

        <q-form @submit.prevent="alGuardar">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="nombre"
                label="Nombre del tipo de departamento"
                placeholder="Ej. Sub-Gerencia TI"
                outlined
                dense
                maxlength="50"
                :disable="guardando"
                lazy-rules
                :rules="[validarNombre]"
              />
            </div>

            <div class="col-12 row justify-end q-gutter-x-sm q-pt-sm">
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
                :label="tipoEditar ? 'Guardar cambios' : 'Crear tipo'"
                :loading="guardando"
                :disable="guardando"
              >
                <template #loading>
                  <q-spinner-oval size="18px" class="q-mr-sm" />
                  <span>Guardando...</span>
                </template>
              </q-btn>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type {
  TipoDepartamentoFormPayload,
  TipoDepartamentoItem,
} from '@/stores/useTipoDepartamentosStore';

const $q = useQuasar();

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  tipoEditar: TipoDepartamentoItem | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: TipoDepartamentoFormPayload];
}>();

const nombre = ref('');

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    nombre.value = props.tipoEditar ? props.tipoEditar.nombre : '';
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function validarNombre(valor: string): true | string {
  const limpio = limpiarTexto(valor ?? '');
  if (!limpio) return 'Ingresa el nombre del tipo de departamento';
  if (limpio.length > 50) return 'Máximo 50 caracteres';
  return true;
}

function alGuardar(): void {
  emit('guardar', {
    nombre: limpiarTexto(nombre.value),
  });
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 520px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header {
  border-bottom: 1px solid var(--border);
}
.muted {
  color: var(--muted);
}
.form-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
</style>
