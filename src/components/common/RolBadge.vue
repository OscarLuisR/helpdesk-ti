<!-- 🛡️ [FASE 3 - UI ROLES] Insignia unificada Diseño 1 (paleta de autoridad + ícono de perfil) -->
<template>
  <span class="rol-badge" :class="[claseRol, { 'rol-badge--mono': mono }]">
    <svg
      v-if="clave === 'adm'"
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
    <svg
      v-else-if="clave === 'dir'"
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
    <svg
      v-else-if="clave === 'ger'"
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
    <svg
      v-else-if="clave === 'mes'"
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
    <svg
      v-else-if="clave === 'tec'"
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
    <svg
      v-else
      class="rol-badge__icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
    <span>{{ etiqueta || codigo }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ClaveRol = 'adm' | 'dir' | 'ger' | 'mes' | 'tec' | 'usr';

const props = withDefaults(
  defineProps<{
    codigo: string;
    etiqueta?: string;
    mono?: boolean;
  }>(),
  {
    etiqueta: '',
    mono: false,
  },
);

const clave = computed<ClaveRol>(() => {
  const c = (props.codigo ?? '').trim().toUpperCase();
  if (c === 'ADMINISTRADOR' || c.includes('ADMIN')) return 'adm';
  if (c === 'DIRECTOR' || c.includes('DIREC')) return 'dir';
  if (c === 'GERENTE_AREA' || c.includes('GERENT')) return 'ger';
  if (c === 'MESA_TECNICA' || c.includes('MESA')) return 'mes';
  if (c === 'TECNICO' || c.includes('TECNIC')) return 'tec';
  return 'usr';
});

const claseRol = computed(() => `rol-badge--${clave.value}`);
</script>
