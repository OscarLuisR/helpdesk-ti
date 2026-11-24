<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Gerencia TI: escudo outlined -->
    <path
      v-if="tono === 'gerencia'"
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    />

    <!-- Sub-Gerencia TI: nodos técnicos conectados -->
    <template v-else-if="tono === 'subgerencia'">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h6" />
      <path d="M18 9v6" />
    </template>

    <!-- Área Usuaria: edificio corporativo outlined -->
    <template v-else-if="tono === 'usuaria'">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
    </template>

    <!-- Respaldo 4º+ tipo (Ciruela Seca): bloques modulares -->
    <template v-else-if="tono === 'extra1'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </template>

    <!-- Respaldo 5º+ tipo (Oliva Suave): capas -->
    <template v-else>
      <path d="m12 2 9 4.5-9 4.5-9-4.5Z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 17.5 9 4.5 9-4.5" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { TonoTipoDepartamento } from '@/utils/tipoDepartamentoEstilo';

withDefaults(
  defineProps<{
    tono: TonoTipoDepartamento;
    size?: number;
  }>(),
  {
    size: 16,
  },
);
</script>
