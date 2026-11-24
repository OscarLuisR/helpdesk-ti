<template>
  <!-- 🛡️ [FASE 3 - UI BANDEJA] Toolbar responsivo sin desbordamiento horizontal en tablet y móvil -->
  <q-card-section class="row items-center justify-between q-col-gutter-sm q-pa-md toolbar">
    <div class="col-12 col-md-auto">
      <div class="row items-baseline q-gutter-x-sm">
        <span class="text-subtitle1 text-weight-bold text-ink">Tickets Activos</span>
        <span class="soft-badge soft-badge--neutral tabular-nums">
          {{ totalResultados }}
          {{ totalResultados === 1 ? 'ticket' : 'tickets' }}
        </span>
      </div>
    </div>

    <div class="col-12 col-md-auto">
      <div class="row items-center no-wrap q-gutter-x-sm toolbar-controles">
        <q-input
          :model-value="busqueda"
          outlined
          dense
          clearable
          placeholder="Buscar ticket..."
          class="busqueda-input"
          @update:model-value="(val) => emit('update:busqueda', String(val ?? ''))"
        >
          <template #prepend>
            <q-icon name="search" size="18px" color="grey-6" />
          </template>
        </q-input>

        <q-btn
          outline
          unelevated
          no-caps
          dense
          color="secondary"
          icon="filter_list"
          label="Filtrar"
          class="btn-filtrar q-px-md shrink-0"
          :ripple="false"
        >
          <q-badge
            v-if="estadosFiltro.length"
            floating
            rounded
            color="primary"
            text-color="white"
          >
            {{ estadosFiltro.length }}
          </q-badge>
          <q-menu anchor="bottom right" self="top right">
            <q-list dense style="min-width: 240px" class="q-pa-sm">
              <q-item-label header class="text-uppercase text-caption">Estado</q-item-label>
              <q-item v-for="estado in estadosDisponibles" :key="estado" tag="label" dense>
                <q-item-section avatar>
                  <q-checkbox
                    :model-value="estadosFiltro"
                    :val="estado"
                    dense
                    color="primary"
                    @update:model-value="(val) => emit('update:estadosFiltro', val)"
                  />
                </q-item-section>
                <q-item-section>{{ estado }}</q-item-section>
              </q-item>
              <q-separator class="q-my-xs" />
              <q-item
                clickable
                dense
                :disable="!estadosFiltro.length"
                @click="emit('limpiar')"
              >
                <q-item-section class="text-caption text-primary">Limpiar filtros</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
import type { EstadoTicket } from '@/models/types';

defineProps<{
  busqueda: string;
  estadosFiltro: EstadoTicket[];
  estadosDisponibles: readonly EstadoTicket[];
  totalResultados: number;
}>();

const emit = defineEmits<{
  'update:busqueda': [valor: string];
  'update:estadosFiltro': [valor: EstadoTicket[]];
  limpiar: [];
}>();
</script>

<style scoped lang="scss">
.toolbar {
  border-bottom: 1px solid var(--border);
}

.muted {
  color: var(--muted);
}

.toolbar-controles {
  width: 100%;
}

.busqueda-input {
  width: 260px;
}

.shrink-0 {
  flex-shrink: 0;
}

.btn-filtrar {
  border-color: var(--border);
}

@media (max-width: 1023px) {
  .busqueda-input {
    width: auto;
    flex: 1 1 auto;
    min-width: 0;
  }
}
</style>

