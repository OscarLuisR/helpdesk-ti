<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <AppHeader
      @alternar-menu="alternarMenuLateral"
      @cerrar-sesion="alCerrarSesion"
    />

    <AppSidebar
      v-model:abierto="menuLateralAbierto"
      @cerrar-sesion="alCerrarSesion"
    />

    <q-page-container class="app-page-container">
      <div class="inset-workspace">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useAuth } from '@/composables/useAuth';

const $q = useQuasar();
const { cerrarSesion } = useAuth();
const menuLateralAbierto = ref(false);

onMounted(() => {
  const savedTheme = localStorage.getItem('helpdesk-theme');
  if (savedTheme === 'dark') {
    $q.dark.set(true);
  }
});

function alternarMenuLateral(): void {
  menuLateralAbierto.value = !menuLateralAbierto.value;
}

function alCerrarSesion(): void {
  void cerrarSesion();
}
</script>

<style scoped lang="scss">
.app-layout {
  background: var(--shell-outer-bg);
  min-height: 100vh;
}

.inset-workspace {
  background: var(--surface-bg);
  min-height: calc(100vh - 58px);
}

@media (min-width: 1024px) {
  .app-layout::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: var(--shell-outer-bg);
    z-index: 2001;
    pointer-events: none;
  }

  .app-page-container {
    padding-right: 10px !important;
    padding-bottom: 10px !important;
  }

  .inset-workspace {
    border: 1px solid var(--border-subtle);
    border-top: none;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    min-height: calc(100vh - 78px);
    overflow-x: clip;
  }
}
</style>
