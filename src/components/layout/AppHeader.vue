<template>
  <q-header class="modern-header app-header">
    <q-toolbar class="q-px-md q-px-sm-lg header-toolbar">
      <q-btn
        flat
        unelevated
        no-caps
        round
        dense
        icon="menu"
        aria-label="Abrir o cerrar menú"
        class="header-icon-btn q-mr-sm lt-md"
        @click="emit('alternarMenu')"
      />

      <q-input
        v-model="textoBusqueda"
        outlined
        dense
        placeholder="Buscar tickets, áreas o usuarios..."
        class="header-search"
      >
        <template #prepend>
          <q-icon name="search" size="17px" class="search-icon" />
        </template>
        <template #append>
          <span class="kbd-hint gt-sm">⌘K</span>
        </template>
      </q-input>

      <q-space />

      <div class="row items-center no-wrap q-gutter-x-sm">
        <!-- TODO: Eliminar este selector simulador de rol antes de pasar a producción -->
        <div class="row items-center no-wrap role-simulator">
          <span class="role-simulator__tag gt-sm">ROL DEMO</span>
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

        <q-btn
          flat
          unelevated
          no-caps
          round
          dense
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          class="header-icon-btn"
          @click="alternarTema"
        >
          <q-tooltip>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
        </q-btn>

        <q-btn
          flat
          unelevated
          no-caps
          round
          dense
          icon="notifications_none"
          aria-label="Notificaciones"
          class="header-icon-btn notif-btn"
        >
          <span class="notif-dot" />
        </q-btn>

        <q-btn
          flat
          unelevated
          no-caps
          dense
          class="profile-btn q-px-xs"
          :ripple="false"
        >
          <div class="row items-center no-wrap">
            <q-avatar size="30px" class="profile-avatar q-mr-sm">
              {{ inicialesUsuario }}
            </q-avatar>
            <div class="column items-start gt-xs q-mr-xs">
              <span class="profile-name">
                {{ authStore.usuario?.nombre ?? 'Usuario TI' }}
              </span>
              <span class="profile-role">{{ etiquetaRolActual }}</span>
            </div>
            <q-icon name="expand_more" size="17px" class="profile-chevron" />
          </div>

          <q-menu anchor="bottom right" self="top right" class="profile-menu">
            <q-list dense style="min-width: 210px" class="q-py-xs">
              <q-item-label header class="text-caption muted q-py-xs">
                Rol activo:
                <strong class="profile-menu__role">{{ etiquetaRolActual }}</strong>
              </q-item-label>
              <q-separator class="q-my-xs" />
              <q-item clickable v-close-popup @click="emit('cerrarSesion')">
                <q-item-section avatar>
                  <q-icon name="logout" size="18px" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative text-weight-medium">
                  Cerrar sesión
                </q-item-section>
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
import { useQuasar } from 'quasar';
import { useNavigation } from '@/composables/useNavigation';
import { OPCIONES_ROL_SIMULADOR } from '@/models/auth';

const emit = defineEmits<{
  alternarMenu: [];
  cerrarSesion: [];
}>();

const $q = useQuasar();
const { authStore, inicialesUsuario, etiquetaRolActual, cambiarRolSimulado } = useNavigation();
const textoBusqueda = ref('');

function alternarTema(): void {
  $q.dark.toggle();
  localStorage.setItem('helpdesk-theme', $q.dark.isActive ? 'dark' : 'light');
}
</script>

<style scoped lang="scss">
.app-header {
  box-shadow: none !important;
}

@media (min-width: 1024px) {
  .app-header {
    top: 10px !important;
    right: 10px !important;
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
  }
}

.header-toolbar {
  height: 58px;
  min-height: 58px;
}

.header-search {
  width: 270px;
  max-width: 40vw;

  :deep(.q-field__control) {
    height: 34px;
    min-height: 34px;
    background: var(--surface-card);
  }

  :deep(.q-field__native) {
    font-size: 0.82rem;
    color: var(--text-primary);
  }
}

.search-icon {
  color: var(--text-muted);
}

.kbd-hint {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 2px 6px;
  line-height: 1.2;
}

.role-simulator {
  gap: 8px;
  background: var(--brand-primary-soft);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 2px 8px;

  &__tag {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--brand-ink);
    letter-spacing: 0.06em;
  }
}

.role-select {
  min-width: 154px;

  :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
    background: var(--surface-card);
  }

  :deep(.q-field__native) {
    font-size: 0.79rem;
    font-weight: 600;
    color: var(--text-primary);
    padding: 0;
  }
}

.header-icon-btn {
  color: var(--text-muted);
  border: 1px solid transparent;

  &:hover {
    color: var(--text-primary);
    background: var(--surface-card);
    border-color: var(--border-subtle);
  }
}

.notif-btn {
  position: relative;
}

.notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6.5px;
  height: 6.5px;
  border-radius: 50%;
  background: var(--brand-ink);
  border: 1.5px solid var(--surface-card);
}

.profile-btn {
  border-radius: 8px !important;
  padding: 3px 6px;

  &:hover {
    background: var(--surface-card);
  }
}

.profile-avatar {
  background: var(--brand-primary);
  color: var(--brand-on-primary);
  border: 1px solid var(--brand-primary-border);
  font-size: 0.72rem;
  font-weight: 700;
}

.profile-name {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--text-primary);
}

.profile-role {
  font-size: 0.68rem;
  line-height: 1.15;
  color: var(--text-muted);
}

.profile-chevron {
  color: var(--text-muted);
}

.profile-menu__role {
  color: var(--brand-ink);
}
</style>
