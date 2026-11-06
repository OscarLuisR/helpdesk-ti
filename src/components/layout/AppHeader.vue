<template>
  <q-header class="app-header">
    <q-toolbar class="q-px-lg header-toolbar">
      <q-btn
        flat
        dense
        round
        icon="menu"
        color="secondary"
        aria-label="Abrir o cerrar menú"
        class="q-mr-sm lt-md"
        @click="emit('alternarMenu')"
      />

      <!-- Buscador superior estilo imagen -->
      <q-input
        v-model="textoBusqueda"
        dense
        borderless
        placeholder="Buscar..."
        class="header-search"
      >
        <template #prepend>
          <q-icon name="search" size="18px" color="grey-5" class="q-ml-sm" />
        </template>
      </q-input>

      <q-space />

      <div class="row items-center no-wrap q-gutter-x-md">
        <!-- TODO: Eliminar este selector simulador de rol antes de pasar a producción -->
        <div class="row items-center no-wrap role-simulator">
          <span class="role-simulator__tag gt-sm">SIMULADOR ROL:</span>
          <q-select
            :model-value="authStore.role"
            :options="OPCIONES_ROL_SIMULADOR"
            option-value="valor"
            option-label="etiqueta"
            emit-value
            map-options
            dense
            outlined
            options-dense
            aria-label="Simulador de rol"
            class="role-select"
            @update:model-value="cambiarRolSimulado"
          />
        </div>

        <!-- Campana de notificaciones con indicador ámbar -->
        <q-btn
          flat
          round
          dense
          icon="notifications_none"
          color="blue-grey-8"
          aria-label="Notificaciones"
          class="notif-btn"
        >
          <span class="notif-dot" />
        </q-btn>

        <!-- Perfil de usuario estilo imagen -->
        <q-btn flat no-caps dense class="profile-btn q-px-xs" :ripple="false">
          <div class="row items-center no-wrap">
            <q-avatar size="34px" class="profile-avatar q-mr-sm">
              {{ inicialesUsuario }}
            </q-avatar>
            <span class="profile-name gt-xs">
              {{ authStore.usuario?.nombre ?? 'Usuario TI' }}
            </span>
            <q-icon name="expand_more" size="18px" color="grey-7" class="q-ml-xs" />
          </div>

          <q-menu anchor="bottom right" self="top right" class="profile-menu">
            <q-list dense style="min-width: 190px" class="q-py-xs">
              <q-item-label header class="text-caption text-grey-7">
                Rol activo: <strong class="text-primary">{{ etiquetaRolActual }}</strong>
              </q-item-label>
              <q-separator class="q-my-xs" />
              <q-item clickable v-close-popup @click="emit('cerrarSesion')">
                <q-item-section avatar>
                  <q-icon name="logout" size="18px" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Cerrar sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNavigation } from '@/composables/useNavigation';
import { OPCIONES_ROL_SIMULADOR } from '@/models/auth';

const emit = defineEmits<{
  alternarMenu: [];
  cerrarSesion: [];
}>();

const { authStore, inicialesUsuario, etiquetaRolActual, cambiarRolSimulado } = useNavigation();
const textoBusqueda = ref('');
</script>

<style scoped lang="scss">
.app-header { background: #fff; color: #0f172a; border-bottom: 1px solid #e8eef3; }
.header-toolbar { height: 68px; }
.header-search {
  width: 310px; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; padding-right: 12px;
  :deep(.q-field__control) { height: 38px; }
}
.role-simulator {
  gap: 8px; background: #f0fdfa; border: 1px dashed #14b8a6;
  border-radius: 10px; padding: 3px 8px;
  &__tag { font-size: 0.7rem; font-weight: 700; color: #0f766e; letter-spacing: 0.04em; }
}
.role-select {
  min-width: 165px;
  :deep(.q-field__control) { height: 32px; min-height: 32px; background: #fff; border-radius: 8px; }
  :deep(.q-field__native) { font-size: 0.82rem; font-weight: 600; color: #0f172a; padding: 0; }
}
.notif-btn { position: relative; }
.notif-dot {
  position: absolute; top: 6px; right: 6px; width: 8px; height: 8px;
  border-radius: 50%; background: #f59e0b; border: 2px solid #fff;
}
.profile-avatar {
  background: linear-gradient(135deg, #1e3a5f, #0f766e);
  color: #fff; font-size: 0.78rem; font-weight: 700;
}
.profile-name { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
</style>
