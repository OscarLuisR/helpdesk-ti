<template>
  <!-- 🛡️ [FASE 3 - UI BANDEJA] Toolbar original en 1 sola línea (40px alineados): Buscar + Selector Mensual + Filtrar -->
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
        <!-- 1. Input Buscar -->
        <q-input
          :model-value="busqueda"
          outlined
          dense
          clearable
          hide-bottom-space
          placeholder="Buscar ticket..."
          class="busqueda-input"
          :class="{ 'busqueda-input--compacto': mostrarFiltroDepartamento && mostrarFiltroTecnico }"
          @update:model-value="(val) => emit('update:busqueda', String(val ?? ''))"
        >
          <template #prepend>
            <q-icon name="search" size="18px" color="grey-6" />
          </template>
        </q-input>

        <!-- 2. Combo Sub-Gerencia TI visible en la barra (Director / Mesa Técnica / Admin) -->
        <q-select
          v-if="mostrarFiltroDepartamento"
          :model-value="idDepartamentoFiltro"
          :options="opcionesDepartamentosTi"
          option-value="valor"
          option-label="etiqueta"
          emit-value
          map-options
          outlined
          dense
          options-dense
          hide-bottom-space
          aria-label="Filtrar por Sub-Gerencia TI"
          class="select-toolbar select-toolbar--depto shrink-0"
          @update:model-value="
            (val) => emit('update:idDepartamentoFiltro', Number(val ?? FILTRO_DEPTO_TODAS))
          "
        />

        <!-- 3. Combo Técnicos visible en la barra (Gerente de Área / Director / Mesa Técnica / Admin) -->
        <q-select
          v-if="mostrarFiltroTecnico"
          :model-value="idTecnicoFiltro"
          :options="opcionesTecnicosFiltro"
          option-value="valor"
          option-label="etiqueta"
          emit-value
          map-options
          outlined
          dense
          options-dense
          hide-bottom-space
          aria-label="Filtrar por técnico"
          class="select-toolbar select-toolbar--tecnico shrink-0"
          @update:model-value="
            (val) =>
              emit(
                'update:idTecnicoFiltro',
                (val as ValorFiltroTecnico) ?? FILTRO_TECNICO_TODOS,
              )
          "
        />

        <!-- 4. Control Mensual reutilizable (Diseño 1: ‹ Mes Año › con cuadrícula desplegable) -->
        <SelectorMesCalendario
          :anio-seleccionado="anioSeleccionado"
          :mes-seleccionado="mesSeleccionado"
          :anio-actual-sistema="anioActualSistema"
          :mes-actual-sistema="mesActualSistema"
          :es-mes-actual="esMesActual"
          @seleccionar-mes="(anio, mes) => emit('seleccionarMes', anio, mes)"
          @desplazar-mes="(delta) => emit('desplazarMes', delta)"
          @ir-mes-actual="emit('irMesActual')"
        />

        <!-- 5. Botón Filtrar por Estado -->
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
            v-if="estadosFiltro.length > 0"
            floating
            rounded
            color="primary"
            text-color="white"
          >
            {{ estadosFiltro.length }}
          </q-badge>
          <q-menu anchor="bottom right" self="top right">
            <q-list dense style="min-width: 220px" class="q-py-xs">
              <q-item-label header class="text-uppercase text-caption q-pb-xs">
                Estado
              </q-item-label>
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
                :disable="cantidadFiltrosActivos === 0"
                @click="emit('limpiar')"
              >
                <q-item-section class="text-caption text-primary">
                  Limpiar filtros
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SelectorMesCalendario from '@/components/common/SelectorMesCalendario.vue';
import {
  FILTRO_DEPTO_TODAS,
  FILTRO_TECNICO_TODOS,
  type OpcionFiltroSelect,
  type ValorFiltroDepartamento,
  type ValorFiltroTecnico,
} from '@/composables/useTickets';
import type { EstadoTicket } from '@/models/types';

const props = defineProps<{
  busqueda: string;
  estadosFiltro: EstadoTicket[];
  idDepartamentoFiltro: ValorFiltroDepartamento;
  idTecnicoFiltro: ValorFiltroTecnico;
  anioSeleccionado: number;
  mesSeleccionado: number;
  anioActualSistema: number;
  mesActualSistema: number;
  esMesActual: boolean;
  mostrarFiltroDepartamento: boolean;
  mostrarFiltroTecnico: boolean;
  opcionesDepartamentosTi: readonly OpcionFiltroSelect<ValorFiltroDepartamento>[];
  opcionesTecnicosFiltro: readonly OpcionFiltroSelect<ValorFiltroTecnico>[];
  estadosDisponibles: readonly EstadoTicket[];
  totalResultados: number;
}>();

const emit = defineEmits<{
  'update:busqueda': [valor: string];
  'update:estadosFiltro': [valor: EstadoTicket[]];
  'update:idDepartamentoFiltro': [valor: ValorFiltroDepartamento];
  'update:idTecnicoFiltro': [valor: ValorFiltroTecnico];
  seleccionarMes: [anio: number, mesIndex: number];
  desplazarMes: [delta: -1 | 1];
  irMesActual: [];
  limpiar: [];
}>();

const cantidadFiltrosActivos = computed(
  () =>
    props.estadosFiltro.length +
    (props.idDepartamentoFiltro !== FILTRO_DEPTO_TODAS ? 1 : 0) +
    (props.idTecnicoFiltro !== FILTRO_TECNICO_TODOS ? 1 : 0),
);
</script>

<style scoped lang="scss">
.toolbar {
  border-bottom: 1px solid var(--border);
}

.toolbar-controles {
  width: 100%;
}

.busqueda-input {
  width: 240px;

  &--compacto {
    width: 200px;
  }

  :deep(.q-field__control) {
    height: 40px;
  }
}

.select-toolbar {
  :deep(.q-field__control),
  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 40px;
    height: 40px;
  }

  :deep(.q-field__native) {
    font-size: 0.82rem;
    font-weight: 500;

    > span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &--depto {
    width: 225px;
  }

  &--tecnico {
    width: 195px;
  }
}

.shrink-0 {
  flex-shrink: 0;
}

.btn-filtrar {
  border-color: var(--border);
  height: 40px;
}

@media (max-width: 1023px) {
  .toolbar-controles {
    flex-wrap: wrap;
  }

  .busqueda-input {
    width: auto;
    flex: 1 1 200px;
    min-width: 0;
  }
}
</style>

