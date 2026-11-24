<!-- 🛡️ [FASE 3 - CONFIGURACIONES GENERALES] Gestión de parámetros globales (solo Administrador y Mesa Técnica) -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="tune" size="14px" />
          Administración · Sistema
        </span>
        <h1 class="page-title">Configuraciones Generales</h1>
        <p class="page-subtitle">
          Parámetros operativos del sistema y políticas de almacenamiento aplicables a los tickets.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          unelevated
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
          :loading="store.cargando"
          @click="recargar"
        />
      </div>
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="busqueda"
              debounce="250"
              dense
              outlined
              clearable
              placeholder="Buscar parámetro por nombre, clave o descripción..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="configuracionesFiltradas"
        :columns="COLUMNAS"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA"
        row-key="id"
        :loading="store.cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron parámetros de configuración"
        class="modern-table tabla-configuraciones"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                  <div class="text-weight-bold text-ink">{{ props.row.nombre }}</div>
                  <span class="chip info text-weight-bold tabular-nums shrink-0">{{ props.row.valor }}</span>
                </div>
                <div class="text-caption muted q-mb-sm">{{ props.row.descripcion }}</div>
                <div class="q-mb-sm">
                  <span class="chip brand chip-clave">{{ props.row.clave }}</span>
                </div>
              </div>
              <div class="row items-center justify-between q-pt-sm card-item-footer">
                <div class="column">
                  <span class="text-caption muted">{{ rangoTexto(props.row) }}</span>
                  <span class="text-caption muted tabular-nums">
                    {{ formatearFecha(props.row.fecha_actualizacion) }} ·
                    {{ props.row.usuario_actualizacion ?? 'Configuración inicial' }}
                  </span>
                </div>
                <q-btn
                  outline
                  unelevated
                  dense
                  color="secondary"
                  icon="edit"
                  size="sm"
                  aria-label="Editar valor"
                  class="btn-accion-icono"
                  @click="abrirModalEditar(props.row)"
                >
                  <q-tooltip>Editar valor</q-tooltip>
                </q-btn>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-parametro="props">
          <q-td :props="props" class="celda-wrap">
            <div class="column items-start">
              <span class="text-weight-bold text-ink">{{ props.row.nombre }}</span>
              <span class="text-caption muted q-mt-xs descripcion-param">
                {{ props.row.descripcion }}
              </span>
              <span class="chip brand chip-clave q-mt-sm">{{ props.row.clave }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-valor="props">
          <q-td :props="props" class="celda-wrap">
            <span class="chip info text-weight-bold tabular-nums">{{ props.row.valor }}</span>
            <div class="text-caption muted q-mt-xs">{{ rangoTexto(props.row) }}</div>
          </q-td>
        </template>

        <template #body-cell-actualizacion="props">
          <q-td :props="props" class="celda-wrap">
            <div class="column">
              <span class="text-caption text-ink tabular-nums">{{ formatearFecha(props.row.fecha_actualizacion) }}</span>
              <span class="text-caption muted">
                {{ props.row.usuario_actualizacion ?? 'Configuración inicial' }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn
              outline
              unelevated
              dense
              color="secondary"
              icon="edit"
              size="sm"
              aria-label="Editar valor"
              class="btn-accion-icono"
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar valor</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI CONFIGURACIONES] Pie de paginación en 3 zonas: filas/página izq, paginación centro, total der -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA"
            dense
            outlined
            options-dense
            hide-bottom-space
            aria-label="Registros por página"
            class="select-filas-pagina"
          />
          <span class="text-caption muted">por página</span>
        </div>

        <div class="footer-zona-centro">
          <q-pagination
            v-model="paginaActual"
            :max="totalPaginas"
            :max-pages="$q.screen.lt.sm ? 3 : 5"
            direction-links
            active-design="unelevated"
            active-color="primary"
            color="grey-7"
            size="sm"
          />
        </div>

        <div class="footer-zona-der text-caption muted tabular-nums">
          {{ textoMostrando }}
        </div>
      </div>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useQuasar, type QForm, type QTableColumn, type QTableProps } from 'quasar';
import {
  useConfiguracionesStore,
  type ConfiguracionGeneralItem,
} from '@/stores/useConfiguracionesStore';
import { formatearFechaHora } from '@/utils/formatFecha';

const OPCIONES_FILAS_POR_PAGINA = [3, 5, 10, 15, 20];

const COLUMNAS: QTableColumn<ConfiguracionGeneralItem>[] = [
  {
    name: 'parametro',
    label: 'Parámetro',
    field: 'nombre',
    align: 'left',
    sortable: true,
    headerStyle: 'width: 48%',
    style: 'width: 48%',
  },
  {
    name: 'valor',
    label: 'Valor Vigente',
    field: 'valor',
    align: 'left',
    headerStyle: 'width: 22%',
    style: 'width: 22%',
  },
  {
    name: 'actualizacion',
    label: 'Última Modificación',
    field: 'fecha_actualizacion',
    align: 'left',
    headerStyle: 'width: 21%',
    style: 'width: 21%',
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'right',
    headerStyle: 'width: 9%',
    style: 'width: 9%',
  },
];

const $q = useQuasar();
const store = useConfiguracionesStore();

const busqueda = ref('');
const modalAbierto = ref(false);
const itemEditando = ref<ConfiguracionGeneralItem | null>(null);
const valorEditado = ref('');
const errorModal = ref<string | null>(null);
const formRef = ref<QForm | null>(null);

const paginacion = ref<NonNullable<QTableProps['pagination']>>({
  page: 1,
  rowsPerPage: 3,
  sortBy: null,
  descending: false,
});

const configuracionesFiltradas = computed(() => {
  const q = (busqueda.value ?? '').trim().toLowerCase();
  if (!q) return store.configuraciones;
  return store.configuraciones.filter((c) =>
    [c.nombre, c.clave, c.descripcion, c.valor].some((v) => v.toLowerCase().includes(q)),
  );
});

const filasPorPagina = computed<number>({
  get: () => paginacion.value.rowsPerPage ?? 3,
  set: (val: number) => {
    const cantidad = Number(val) > 0 ? Number(val) : 3;
    paginacion.value = { ...paginacion.value, rowsPerPage: cantidad, page: 1 };
  },
});

const totalPaginas = computed(() => {
  const porPagina = Math.max(1, filasPorPagina.value);
  return Math.max(1, Math.ceil(configuracionesFiltradas.value.length / porPagina));
});

const paginaActual = computed<number>({
  get: () => paginacion.value.page ?? 1,
  set: (val: number) => {
    paginacion.value = { ...paginacion.value, page: val };
  },
});

const textoMostrando = computed(() => {
  const total = configuracionesFiltradas.value.length;
  if (total === 0) return 'Mostrando 0 de 0 registros';
  const porPagina = Math.max(1, filasPorPagina.value);
  const inicio = (paginaActual.value - 1) * porPagina + 1;
  const fin = Math.min(paginaActual.value * porPagina, total);
  return `Mostrando ${inicio}–${fin} de ${total} registros`;
});

watch(busqueda, () => {
  paginaActual.value = 1;
});

watch(totalPaginas, (max) => {
  if (paginaActual.value > max) {
    paginaActual.value = max;
  }
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
  return formatearFechaHora(fechaIso);
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
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}
.toolbar-section {
  border-bottom: 1px solid var(--border-subtle);
}
.dialog-card {
  width: 100vw;
  max-width: 520px;
}

// 🛡️ [FASE 3 - UI CONFIGURACIONES] Tabla fija sin scroll horizontal y celdas multilínea
.tabla-configuraciones {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(tbody td) {
    vertical-align: top;
    height: auto;
    white-space: normal;
    word-break: break-word;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.descripcion-param {
  line-height: 1.45;
}

.chip-clave {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  max-width: 100%;
  white-space: normal;
  word-break: break-all;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

.card-item-footer {
  border-top: 1px solid var(--border-subtle);
}

.shrink-0 {
  flex-shrink: 0;
}

// Pie de tabla de 3 zonas (Izquierda: filas/página · Centro: paginación · Derecha: contador)
.tabla-footer-3zonas {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  padding: 12px 16px;
}

.footer-zona-izq {
  justify-self: start;
}

.footer-zona-centro {
  justify-self: center;
}

.footer-zona-der {
  justify-self: end;
}

.select-filas-pagina {
  width: 68px;

  :deep(.q-field__control) {
    min-height: 30px;
    height: 30px;
  }

  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 30px;
    height: 30px;
    font-size: 0.78rem;
  }
}

@media (max-width: 639px) {
  .tabla-footer-3zonas {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .footer-zona-izq,
  .footer-zona-centro,
  .footer-zona-der {
    justify-self: center;
  }
}
</style>
