<template>
  <q-dialog :model-value="abierto" persistent @update:model-value="(val) => emit('update:abierto', val)">
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">Restablecer Contraseña</div>
          <div class="text-caption muted">
            Asigna una nueva clave temporal a
            <strong class="text-dark">{{ usuario?.nombre }}</strong>
            (@{{ usuario?.username }}).
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

        <q-form class="q-gutter-y-md" @submit.prevent="alConfirmar">
          <div class="row items-center justify-between estado-row q-px-sm q-py-xs">
            <span class="text-caption muted">¿Necesitas una clave temporal rápida?</span>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="autorenew"
              label="Generar clave"
              :disable="guardando"
              @click="generarClaveTemporal"
            />
          </div>

          <q-input
            v-model="nuevaPassword"
            :type="mostrarPassword ? 'text' : 'password'"
            label="Nueva contraseña temporal"
            placeholder="Mínimo 8 caracteres"
            outlined
            dense
            maxlength="64"
            lazy-rules
            :rules="[(v: string) => (v && v.trim().length >= 8) || 'Debe tener al menos 8 caracteres']"
          >
            <template #append>
              <q-icon
                :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-6"
                @click="mostrarPassword = !mostrarPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="confirmacionPassword"
            :type="mostrarPassword ? 'text' : 'password'"
            label="Confirmar contraseña"
            outlined
            dense
            maxlength="64"
            lazy-rules
            :rules="[(v: string) => v === nuevaPassword || 'Las contraseñas no coinciden']"
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
              icon="lock_reset"
              label="Restablecer contraseña"
              :loading="guardando"
              :disable="guardando"
            >
              <template #loading>
                <q-spinner-oval size="18px" class="q-mr-sm" />
                <span>Aplicando...</span>
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
import type { User } from '@/stores/useUsersStore';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  usuario: User | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  confirmar: [nuevaPassword: string];
}>();

const nuevaPassword = ref('');
const confirmacionPassword = ref('');
const mostrarPassword = ref(false);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    nuevaPassword.value = '';
    confirmacionPassword.value = '';
    mostrarPassword.value = false;
  },
);

function generarClaveTemporal(): void {
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  const generada = `Ti#${sufijo}HD`;
  nuevaPassword.value = generada;
  confirmacionPassword.value = generada;
  mostrarPassword.value = true;
}

function alConfirmar(): void {
  emit('confirmar', nuevaPassword.value.trim());
}
</script>

