<!-- 🛡️ [FASE 3 - CONFIGURACIONES GENERALES] Gestión de parámetros globales (solo Administrador y Mesa Técnica) -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Configuraciones Generales</h1>
        <p class="page-subtitle">
          Parámetros operativos del sistema y políticas de almacenamiento aplicables a los tickets.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
          :loading="store.cargando"
          @click="recargar"
        />
      </div>
    </div>

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-6 col-md-5">
          <q-input
            v-model="busqueda"
            debounce="250"
            dense
            outlined
            clearable
            placeholder="Buscar parámetro por nombre, clave o descripción..."
          >
            <template #prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
        </div>
      </div>

      <q-table
        flat
        :rows="configuracionesFiltradas"
        :columns="COLUMNAS"
        row-key="id"
        :loading="store.cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron parámetros de configuración"
        class="tabla-pro-q"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <span class="chip brand">{{ props.row.clave }}</span>
                <span class="chip info">{{ props.row.valor }}</span>
              </div>
              <div class="text-weight-bold text-dark q-mb-xs">{{ props.row.nombre }}</div>
              <div class="text-caption muted q-mb-sm">{{ props.row.descripcion }}</div>
              <div class="row items-center justify-between">
                <span class="text-caption muted">
                  {{ rangoTexto(props.row) }}
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="edit"
                  label="Editar"
                  @click="abrirModalEditar(props.row)"
                />
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-parametro="props">
          <q-td :props="props">
            <div class="column">
              <div class="row items-center q-gutter-x-sm">
                <span class="text-weight-bold text-dark">{{ props.row.nombre }}</span>
                <span class="chip brand">{{ props.row.clave }}</span>
              </div>
              <span class="text-caption muted q-mt-xs">{{ props.row.descripcion }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-valor="props">
          <q-td :props="props">
            <span class="chip info text-weight-bold">{{ props.row.valor }}</span>
            <div class="text-caption muted q-mt-xs">{{ rangoTexto(props.row) }}</div>
          </q-td>
        </template>

        <template #body-cell-actualizacion="props">
          <q-td :props="props">
            <div class="column">
              <span class="text-caption text-dark">{{ formatearFecha(props.row.fecha_actualizacion) }}</span>
              <span class="text-caption muted">
                {{ props.row.usuario_actualizacion ?? 'Configuración inicial' }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              round
              dense
              icon="edit"
              size="sm"
              color="primary"
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar valor</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalAbierto" persistent :maximized="$q.screen.lt.sm">
      <q-card flat bordered class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Editar Parámetro</div>
            <div class="text-caption muted">{{ itemEditando?.nombre }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            :disable="store.guardando"
            @click="modalAbierto = false"
          />
        </q-card-section>

        <q-card-section v-if="itemEditando" class="q-pt-md">
          <q-banner v-if="errorModal" dense rounded class="form-error q-mb-md" role="alert">
            <template #avatar><q-icon name="error_outline" color="negative" size="20px" /></template>
            {{ errorModal }}
          </q-banner>

          <p class="text-caption muted q-mb-md">{{ itemEditando.descripcion }}</p>

          <q-form ref="formRef" @submit.prevent="guardarValor">
            <q-input
              v-model="valorEditado"
              outlined
              dense
              :type="itemEditando.tipo_dato === 'INTEGER' ? 'number' : 'text'"
              :min="itemEditando.valor_minimo ?? undefined"
              :max="itemEditando.valor_maximo ?? undefined"
              label="Valor del parámetro *"
              :hint="rangoTexto(itemEditando)"
              :rules="[validarValorCampo]"
            />

            <div class="row justify-end q-gutter-x-sm q-pt-md">
              <q-btn
                flat
                no-caps
                color="secondary"
                label="Cancelar"
                :disable="store.guardando"
                @click="modalAbierto = false"
              />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                label="Guardar cambios"
                :loading="store.guardando"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useQuasar, type QForm, type QTableColumn } from 'quasar';
import {
  useConfiguracionesStore,
  type ConfiguracionGeneralItem,
} from '@/stores/useConfiguracionesStore';

const COLUMNAS: QTableColumn<ConfiguracionGeneralItem>[] = [
  { name: 'parametro', label: 'Parámetro', field: 'nombre', align: 'left', sortable: true },
  { name: 'valor', label: 'Valor Vigente', field: 'valor', align: 'left' },
  {
    name: 'actualizacion',
    label: 'Última Modificación',
    field: 'fecha_actualizacion',
    align: 'left',
  },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
];

const $q = useQuasar();
const store = useConfiguracionesStore();

const busqueda = ref('');
const modalAbierto = ref(false);
const itemEditando = ref<ConfiguracionGeneralItem | null>(null);
const valorEditado = ref('');
const errorModal = ref<string | null>(null);
const formRef = ref<QForm | null>(null);

const configuracionesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return store.configuraciones;
  return store.configuraciones.filter((c) =>
    [c.nombre, c.clave, c.descripcion, c.valor].some((v) => v.toLowerCase().includes(q)),
  );
});

function rangoTexto(item: ConfiguracionGeneralItem): string {
  if (item.tipo_dato === 'TEXT') {
    if (item.valor_minimo !== null && item.valor_maximo !== null) {
      return `Longitud permitida: ${item.valor_minimo} a ${item.valor_maximo} caracteres (sin espacios)`;
    }
    return 'Texto sin espacios';
  }
  if (item.tipo_dato !== 'INTEGER') return `Tipo: ${item.tipo_dato}`;
  if (item.valor_minimo !== null && item.valor_maximo !== null) {
    return `Rango permitido: ${item.valor_minimo} a ${item.valor_maximo}`;
  }
  return 'Entero positivo';
}

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}

function validarValorCampo(v: string): true | string {
  const limpio = String(v ?? '').trim();
  if (!limpio) return 'Ingresa un valor para el parámetro.';

  const item = itemEditando.value;
  if (!item) return true;

  if (item.tipo_dato === 'TEXT') {
    if (/\s/.test(limpio)) {
      return 'El valor no debe contener espacios.';
    }
    if (item.valor_minimo !== null && limpio.length < item.valor_minimo) {
      return `Debe tener al menos ${item.valor_minimo} caracteres.`;
    }
    if (item.valor_maximo !== null && limpio.length > item.valor_maximo) {
      return `Debe tener máximo ${item.valor_maximo} caracteres.`;
    }
    return true;
  }

  if (item.tipo_dato !== 'INTEGER') return true;

  if (!/^-?\d+$/.test(limpio)) {
    return 'Debe ser un número entero válido.';
  }
  const num = Number(limpio);
  if (item.valor_minimo !== null && num < item.valor_minimo) {
    return `El valor mínimo permitido es ${item.valor_minimo}.`;
  }
  if (item.valor_maximo !== null && num > item.valor_maximo) {
    return `El valor máximo permitido es ${item.valor_maximo}.`;
  }
  return true;
}

function abrirModalEditar(item: ConfiguracionGeneralItem): void {
  itemEditando.value = item;
  valorEditado.value = item.valor;
  errorModal.value = null;
  modalAbierto.value = true;
  void nextTick(() => formRef.value?.resetValidation());
}

async function guardarValor(): Promise<void> {
  if (!itemEditando.value) return;
  errorModal.value = null;

  try {
    await store.actualizarConfiguracion(itemEditando.value.id, String(valorEditado.value));
    modalAbierto.value = false;
    $q.notify({
      type: 'positive',
      message: 'Parámetro actualizado correctamente.',
      position: 'top-right',
    });
  } catch (err: unknown) {
    errorModal.value =
      err instanceof Error ? err.message : 'No fue posible guardar la configuración.';
  }
}

async function recargar(): Promise<void> {
  try {
    await store.cargarConfiguraciones();
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Error cargando configuraciones.',
      position: 'top-right',
    });
  }
}

onMounted(() => {
  void recargar();
});
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 520px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header {
  border-bottom: 1px solid var(--border);
}
.muted {
  color: var(--muted);
}
</style>
