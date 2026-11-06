<template>
  <q-drawer
    :model-value="abierto"
    show-if-above
    :width="256"
    class="app-sidebar"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <div class="column full-height no-wrap">
      <div class="sidebar-brand row items-center no-wrap q-px-lg">
        <div class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7L16 3L24 7V15L16 11L8 15V7Z" fill="#2dd4bf" />
            <path d="M8 15L16 19V29L8 25V15Z" fill="#0d9488" />
            <path d="M24 19L16 23V29L24 25V19Z" fill="#14b8a6" fill-opacity="0.75" />
          </svg>
        </div>
        <span class="brand-title">HelpDesk TI</span>
      </div>

      <q-list class="sidebar-nav col q-px-md q-pt-md">
        <template v-for="item in itemsMenu" :key="item.id">
          <q-item-label
            v-if="item.seccion && authStore.role === 'MESA_TECNICA'"
            header
            class="nav-section-label q-px-sm q-pt-sm q-pb-xs"
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
              <q-icon :name="item.icono" size="20px" />
            </q-item-section>
            <q-item-section class="nav-item__label">
              {{ item.titulo }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>

      <div class="sidebar-footer q-px-md q-pb-md">
        <q-item clickable :ripple="false" class="nav-item" @click="alCerrarSesion">
          <q-item-section avatar class="nav-item__icon">
            <q-icon name="logout" size="20px" />
          </q-item-section>
          <q-item-section class="nav-item__label">Cerrar sesión</q-item-section>
        </q-item>
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
const { authStore, itemsMenu, esRutaActiva, irARuta } = useNavigation();

function alHacerClicItem(item: MenuItem): void {
  irARuta(item);
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
  background: #0b192c !important;
  color: #94a3b8;
  border-right: none !important;
}
.sidebar-brand { height: 72px; gap: 12px; }
.brand-logo { width: 30px; height: 30px; display: grid; place-items: center; }
.brand-title { color: #fff; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; }
.sidebar-nav { overflow-y: auto; }
.nav-section-label {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #64748b;
}
.nav-item {
  border-radius: 10px; color: #94a3b8; min-height: 44px; padding: 0 14px; margin-bottom: 6px;
  transition: background-color 0.18s ease, color 0.18s ease;
  &:hover:not(.nav-item--active) { background: rgba(255, 255, 255, 0.05); color: #e2e8f0; }
  &__icon { min-width: 34px; padding-right: 10px; color: inherit; }
  &__label { font-size: 0.9rem; font-weight: 500; }
}
.nav-item--active {
  background: linear-gradient(90deg, #0d9488 0%, #0f766e 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.32);
  .nav-item__label { font-weight: 600; }
}
.sidebar-footer { border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 12px; }
</style>
