<template>
  <q-dialog :model-value="abierto" persistent @update:model-value="alCambiarVisibilidad">
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <q-icon :name="icono" :color="color" size="22px" />
          <div class="text-subtitle1 text-weight-bold text-dark">{{ titulo }}</div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="emit('responder', false)" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="text-body2 text-dark">{{ mensaje }}</div>
        <div v-if="detalle" class="text-caption muted q-mt-sm">{{ detalle }}</div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps color="secondary" label="Cancelar" @click="emit('responder', false)" />
        <q-btn unelevated no-caps :color="color" :icon="icono" :label="textoConfirmar" @click="emit('responder', true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    abierto: boolean;
    titulo: string;
    mensaje: string;
    detalle?: string;
    textoConfirmar?: string;
    color?: string;
    icono?: string;
  }>(),
  {
    detalle: '',
    textoConfirmar: 'Confirmar',
    color: 'primary',
    icono: 'help_outline',
  },
);

const emit = defineEmits<{
  responder: [confirmado: boolean];
}>();

function alCambiarVisibilidad(visible: boolean): void {
  if (!visible) emit('responder', false);
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 440px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header { border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
</style>
