<template>
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    class="tipo-depto-tag"
    :class="[
      estilo.claseTono,
      { 'tipo-depto-tag--compacto': compacto, 'tipo-depto-tag--clickable': clickable },
    ]"
    @click="alClick"
  >
    <TipoDepartamentoIcono
      v-if="!sinIcono"
      :tono="estilo.tono"
      :size="compacto ? 11 : 12"
      class="tipo-depto-tag__icon"
    />
    <span>{{ etiquetaVisible }}</span>
    <q-tooltip v-if="tooltipTexto" max-width="290px">
      <div class="text-weight-bold q-mb-xs">{{ nombre }}</div>
      <div>{{ tooltipTexto }}</div>
    </q-tooltip>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TipoDepartamentoIcono from '@/components/common/TipoDepartamentoIcono.vue';
import { resolverEstiloTipoDepartamento } from '@/utils/tipoDepartamentoEstilo';

const props = withDefaults(
  defineProps<{
    nombre: string;
    idTipo?: number | null;
    etiqueta?: string;
    descripcion?: string | null;
    compacto?: boolean;
    clickable?: boolean;
    sinIcono?: boolean;
  }>(),
  {
    idTipo: null,
    etiqueta: '',
    descripcion: '',
    compacto: false,
    clickable: false,
    sinIcono: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const estilo = computed(() => resolverEstiloTipoDepartamento(props.nombre, props.idTipo));
const etiquetaVisible = computed(() => props.etiqueta?.trim() || props.nombre);
const tooltipTexto = computed(() => (props.descripcion ?? '').trim());

function alClick(): void {
  if (props.clickable) {
    emit('click');
  }
}
</script>
