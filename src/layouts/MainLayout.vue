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

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useAuth } from '@/composables/useAuth';

const { cerrarSesion } = useAuth();
const menuLateralAbierto = ref(false);

function alternarMenuLateral(): void {
  menuLateralAbierto.value = !menuLateralAbierto.value;
}

function alCerrarSesion(): void {
  void cerrarSesion();
}
</script>

<style scoped lang="scss">
.app-layout {
  background: var(--bg);
}
</style>
