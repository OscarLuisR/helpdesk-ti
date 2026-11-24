<!-- 🛡️ [FASE 3 - UI PRIORIDAD] Etiqueta unificada Opción 1 (borde técnico + barras de señal 4/3/2/1) -->
<template>
  <span class="prio-badge" :class="[claseNivel, { 'prio-badge--compacto': compacto }]">
    <svg
      class="prio-badge__bars"
      :width="compacto ? 12 : 14"
      :height="compacto ? 11 : 13"
      viewBox="0 0 16 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="1" y="9" width="2.3" height="4" rx="0.8" :opacity="nivel >= 1 ? 1 : 0.24" />
      <rect x="5" y="6.5" width="2.3" height="6.5" rx="0.8" :opacity="nivel >= 2 ? 1 : 0.24" />
      <rect x="9" y="4" width="2.3" height="9" rx="0.8" :opacity="nivel >= 3 ? 1 : 0.24" />
      <rect x="13" y="1.5" width="2.3" height="11.5" rx="0.8" :opacity="nivel >= 4 ? 1 : 0.24" />
    </svg>
    <span>{{ prioridad }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    prioridad: string;
    compacto?: boolean;
  }>(),
  {
    compacto: false,
  },
);

const nivel = computed<1 | 2 | 3 | 4>(() => {
  const n = (props.prioridad ?? '').trim().toLowerCase();
  if (n.includes('crít') || n.includes('crit')) return 4;
  if (n.includes('alta')) return 3;
  if (n.includes('media')) return 2;
  return 1;
});

const claseNivel = computed(() => {
  if (nivel.value === 4) return 'prio-badge--critica';
  if (nivel.value === 3) return 'prio-badge--alta';
  if (nivel.value === 2) return 'prio-badge--media';
  return 'prio-badge--baja';
});
</script>
