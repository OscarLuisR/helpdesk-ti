<template>
  <q-drawer
    :model-value="abierto"
    show-if-above
    :width="244"
    class="app-sidebar"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <div class="column full-height no-wrap q-pa-sm">
      <!-- Marca superior encastrada -->
      <div class="sidebar-brand row items-center no-wrap q-px-sm q-py-sm">
        <div class="brand-logo" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
        </div>
        <div class="column">
          <span class="brand-title">HelpDesk TI</span>
          <span class="brand-caption">Ops Workspace</span>
        </div>
      </div>

      <!-- Navegación -->
      <q-list class="sidebar-nav col q-pt-sm q-px-xs">
        <template v-for="item in itemsMenu" :key="item.id">
          <q-item-label
            v-if="item.seccion && authStore.role === 'MESA_TECNICA'"
            header
            class="nav-section-label q-px-sm q-pt-md q-pb-xs"
          >
            {{ item.seccion }}
          </q-item-label>

          <q-item
            clickable
            :ripple="false"
            :active="esRutaActiva(item.ruta)"
            active-class="nav-item--active"
            class="nav-item"
            @click="alHacerClicItem(item)"
          >
            <q-item-section avatar class="nav-item__icon">
              <q-icon :name="item.icono" size="18px" />
            </q-item-section>
            <q-item-section class="nav-item__label">
              {{ item.titulo }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>

      <!-- Tarjeta inferior de usuario + salida rápida -->
      <div class="sidebar-footer q-pt-sm q-px-xs">
        <div class="user-pill-card row items-center justify-between no-wrap q-pa-sm">
          <div class="row items-center no-wrap min-w-0">
            <q-avatar size="30px" class="user-pill-avatar q-mr-sm">
              {{ inicialesUsuario }}
            </q-avatar>
            <div class="column min-w-0">
              <span class="user-pill-name ellipsis">
                {{ authStore.usuario?.nombre ?? 'Usuario TI' }}
              </span>
              <span class="user-pill-role ellipsis">{{ etiquetaRolActual }}</span>
            </div>
          </div>

          <q-btn
            flat
            unelevated
            no-caps
            round
            dense
            icon="logout"
            size="sm"
            aria-label="Cerrar sesión"
            class="logout-icon-btn"
            @click="alCerrarSesion"
          >
            <q-tooltip>Cerrar sesión</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useNavigation, type MenuItem } from '@/composables/useNavigation';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  cerrarSesion: [];
}>();

const $q = useQuasar();
const {
  authStore,
  itemsMenu,
  inicialesUsuario,
  etiquetaRolActual,
  esRutaActiva,
  irARuta,
} = useNavigation();

function alHacerClicItem(item: MenuItem): void {
  void irARuta(item);
  if ($q.screen.lt.md) {
    emit('update:abierto', false);
  }
}

function alCerrarSesion(): void {
  if ($q.screen.lt.md) {
    emit('update:abierto', false);
  }
  emit('cerrarSesion');
}
</script>

<style scoped lang="scss">
:deep(.q-drawer),
.app-sidebar {
  background: var(--shell-outer-bg) !important;
  color: var(--sidebar-text);
  border-right: none !important;
}

.sidebar-brand {
  min-height: 52px;
  gap: 10px;
}

.brand-logo {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--brand-primary);
  border: 1px solid var(--brand-primary-border);
  color: var(--brand-on-primary);
  flex-shrink: 0;
}

.brand-title {
  color: var(--text-primary);
  font-size: 0.94rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.brand-caption {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
}

.sidebar-nav {
  overflow-y: auto;
}

.nav-section-label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.8;
}

.nav-item {
  position: relative;
  border-radius: 8px;
  border: 1px solid transparent;
  color: var(--sidebar-text);
  min-height: 38px;
  padding: 0 10px;
  margin-bottom: 3px;
  transition:
    background-color var(--transition-ui),
    border-color var(--transition-ui),
    color var(--transition-ui);

  &:hover:not(.nav-item--active) {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &__icon {
    min-width: 28px;
    padding-right: 8px;
    color: inherit;
  }

  &__label {
    font-size: 0.84rem;
    font-weight: 500;
  }
}

.nav-item--active {
  background: var(--surface-card) !important;
  border-color: var(--border-subtle);
  color: var(--sidebar-text-active) !important;
  box-shadow: none !important;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 7px;
    bottom: 7px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--brand-ink);
  }

  .nav-item__icon {
    color: var(--brand-ink);
  }

  .nav-item__label {
    font-weight: 600;
  }
}

.sidebar-footer {
  border-top: 1px solid var(--border-subtle);
}

.user-pill-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  gap: 8px;
}

.user-pill-avatar {
  background: var(--brand-primary);
  border: 1px solid var(--brand-primary-border);
  color: var(--brand-on-primary);
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-pill-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.user-pill-role {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.2;
}

.logout-icon-btn {
  color: var(--text-muted);
  flex-shrink: 0;

  &:hover {
    color: var(--danger);
    background: var(--danger-soft);
  }
}
</style>
