<template>
  <q-dialog :model-value="abierto" persistent @update:model-value="(val) => emit('update:abierto', val)">
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">Restablecer Contraseña</div>
          <div class="text-caption muted">
            Se restablecerá la contraseña de
            <strong class="text-dark">{{ usuario?.nombre_completo }}</strong>
            ({{ usuario?.nick }}).
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

        <div class="info-box q-pa-md q-mb-md">
          <div class="row items-start no-wrap q-gutter-x-sm">
            <q-icon name="info_outline" color="primary" size="20px" class="q-mt-xs" />
            <div class="text-body2 text-dark">
              Al confirmar, la clave de acceso del usuario volverá a ser la contraseña temporal por
              defecto (<strong class="text-primary">{{ configuracionesStore.claveTemporalDefecto }}</strong>) y el sistema le exigirá cambiarla
              en su próximo inicio de sesión.
            </div>
          </div>
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
            unelevated
            no-caps
            color="primary"
            icon="lock_reset"
            label="Confirmar restablecimiento"
            :loading="guardando"
            :disable="guardando"
            @click="emit('confirmar')"
          >
            <template #loading>
              <q-spinner-oval size="18px" class="q-mr-sm" />
              <span>Aplicando...</span>
            </template>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useConfiguracionesStore } from '@/stores/useConfiguracionesStore';
import type { User } from '@/stores/useUsersStore';

const configuracionesStore = useConfiguracionesStore();

defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  usuario: User | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  confirmar: [];
}>();
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 480px;
}
.info-box {
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
</style>
