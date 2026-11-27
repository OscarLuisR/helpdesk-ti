<!-- 🛡️ [FASE 3.6 - UI COMÚN] Selector mensual reutilizable con cuadrícula Ene-Dic y "Ir al mes actual" integrado -->
<template>
  <div class="mes-stepper shrink-0" role="group" aria-label="Selector de mes">
    <button
      type="button"
      class="mes-stepper__arrow"
      aria-label="Mes anterior"
      @click="emit('desplazarMes', -1)"
    >
      <q-icon name="chevron_left" size="18px" />
      <q-tooltip>Mes anterior</q-tooltip>
    </button>

    <button
      type="button"
      class="mes-stepper__trigger"
      aria-label="Seleccionar mes y año"
      @click="sincronizarAnioPopover"
    >
      <q-icon name="calendar_month" size="16px" color="primary" />
      <span class="tabular-nums">{{ etiquetaMesSeleccionado }}</span>

      <q-menu v-model="menuMesAbierto" anchor="bottom middle" self="top middle">
        <div class="mes-popover q-pa-sm">
          <div class="row items-center justify-between q-pb-xs q-mb-xs mes-popover__header">
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="chevron_left"
              aria-label="Año anterior"
              @click="anioPopover -= 1"
            />
            <span class="text-subtitle2 text-weight-bold text-ink tabular-nums">
              {{ anioPopover }}
            </span>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="chevron_right"
              aria-label="Año siguiente"
              :disable="anioPopover >= anioActualSistema"
              @click="anioPopover += 1"
            />
          </div>

          <div class="mes-popover__grid">
            <button
              v-for="(nombreCorto, idx) in NOMBRES_MESES_CORTOS"
              :key="nombreCorto"
              type="button"
              class="mes-popover__cell"
              :class="{
                'mes-popover__cell--activo':
                  anioPopover === anioSeleccionado && idx === mesSeleccionado,
              }"
              :disabled="esMesFuturo(anioPopover, idx)"
              @click="elegirMesEnCuadricula(idx)"
            >
              {{ nombreCorto }}
            </button>
          </div>

          <div v-if="!esMesActual" class="q-pt-xs q-mt-xs mes-popover__footer text-center">
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              label="Ir al mes actual"
              class="full-width"
              @click="volverMesActual"
            />
          </div>
        </div>
      </q-menu>
    </button>

    <button
      type="button"
      class="mes-stepper__arrow"
      aria-label="Mes siguiente"
      :disabled="esMesActual"
      @click="emit('desplazarMes', 1)"
    >
      <q-icon name="chevron_right" size="18px" />
      <q-tooltip v-if="!esMesActual">Mes siguiente</q-tooltip>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NOMBRES_MESES, NOMBRES_MESES_CORTOS } from '@/composables/useTickets';

const props = defineProps<{
  anioSeleccionado: number;
  mesSeleccionado: number;
  anioActualSistema: number;
  mesActualSistema: number;
  esMesActual: boolean;
}>();

const emit = defineEmits<{
  seleccionarMes: [anio: number, mesIndex: number];
  desplazarMes: [delta: -1 | 1];
  irMesActual: [];
}>();

const menuMesAbierto = ref(false);
const anioPopover = ref(props.anioSeleccionado);

const etiquetaMesSeleccionado = computed(
  () => `${NOMBRES_MESES[props.mesSeleccionado] ?? ''} ${props.anioSeleccionado}`,
);

function sincronizarAnioPopover(): void {
  anioPopover.value = props.anioSeleccionado;
}

function esMesFuturo(anio: number, mesIdx: number): boolean {
  return (
    anio > props.anioActualSistema ||
    (anio === props.anioActualSistema && mesIdx > props.mesActualSistema)
  );
}

function elegirMesEnCuadricula(mesIdx: number): void {
  if (esMesFuturo(anioPopover.value, mesIdx)) return;
  emit('seleccionarMes', anioPopover.value, mesIdx);
  menuMesAbierto.value = false;
}

function volverMesActual(): void {
  emit('irMesActual');
  menuMesAbierto.value = false;
}
</script>

<style scoped lang="scss">
.shrink-0 {
  flex-shrink: 0;
}

// Control Mensual Diseño 1 (altura exacta 40px y tokens Linear Inset Emerald)
.mes-stepper {
  display: inline-flex;
  align-items: stretch;
  height: 40px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  overflow: hidden;
  transition: border-color var(--transition-ui);

  &:hover {
    border-color: var(--border-strong);
  }

  &__arrow,
  &__trigger {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color var(--transition-ui),
      color var(--transition-ui),
      opacity var(--transition-ui);

    &:hover:not(:disabled) {
      background: var(--surface-hover);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__arrow {
    padding: 0 8px;
    color: var(--text-muted);

    &:hover:not(:disabled) {
      color: var(--text-primary);
    }
  }

  &__trigger {
    gap: 6px;
    padding: 0 12px;
    min-width: 148px;
    font-size: 0.82rem;
    font-weight: 600;
    border-left: 1px solid var(--border-subtle);
    border-right: 1px solid var(--border-subtle);
    white-space: nowrap;
  }
}

.mes-popover {
  width: 224px;

  &__header {
    border-bottom: 1px solid var(--border-subtle);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding-top: 4px;
  }

  &__cell {
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 6px 4px;
    cursor: pointer;
    transition:
      background-color var(--transition-ui),
      color var(--transition-ui);

    &:hover:not(:disabled):not(&--activo) {
      background: var(--surface-subtle);
    }

    &--activo {
      background: var(--brand-primary);
      color: var(--brand-on-primary);
      font-weight: 600;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  &__footer {
    border-top: 1px solid var(--border-subtle);
  }
}
</style>
