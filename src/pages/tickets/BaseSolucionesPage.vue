<!-- 🛡️ [FASE 3.5 / UI - VISTAS] Base de Soluciones técnica sin PII (/tecnico/historial) -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg soluciones-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="menu_book" size="14px" />
          Conocimiento Técnico · Soluciones
        </span>
        <h1 class="page-title">Base de Soluciones</h1>
        <p class="page-subtitle">
          Consulta casos resueltos previamente por el equipo TI filtrando por palabra clave, servicio del catálogo o sub-gerencia.
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
          :class="{ 'full-width': $q.screen.xs }"
          :loading="cargando"
          @click="buscarSoluciones"
        />
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <!-- Barra de filtros -->
    <q-card flat bordered class="modern-card q-pa-md q-mb-lg">
      <q-form class="row q-col-gutter-md items-center" @submit.prevent="buscarSoluciones">
        <div class="col-12 col-md-5">
          <q-input
            v-model="filtros.q"
            outlined
            dense
            clearable
            maxlength="150"
            placeholder="Buscar por error, causa raíz, solución o folio..."
            @clear="buscarSoluciones"
          >
            <template #prepend>
              <q-icon name="search" size="18px" class="muted" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtros.id_departamento_ti"
            :options="areasTiActivas"
            option-value="id"
            option-label="nombre"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Sub-Gerencia TI"
            @update:model-value="buscarSoluciones"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtros.id_catalogo"
            :options="catalogoFiltradoPorArea"
            option-value="id"
            option-label="nombre"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Incidencia del Catálogo"
            @update:model-value="buscarSoluciones"
          />
        </div>

        <div class="col-12 col-md-1">
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            icon="search"
            :label="$q.screen.lt.md ? 'Buscar' : undefined"
            class="full-width"
            :loading="cargando"
            aria-label="Buscar soluciones"
          />
        </div>
      </q-form>

      <div class="row items-center justify-between q-mt-sm text-caption muted">
        <span class="tabular-nums">
          <strong class="text-ink">{{ soluciones.length }}</strong>
          {{ soluciones.length === 1 ? 'solución documentada' : 'soluciones documentadas' }}
        </span>
        <q-btn
          v-if="tieneFiltrosActivos"
          flat
          dense
          no-caps
          size="sm"
          color="primary"
          label="Limpiar filtros"
          @click="limpiarFiltros"
        />
      </div>
    </q-card>

    <div v-if="cargando && !soluciones.length" class="text-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <q-card v-else-if="!soluciones.length" flat bordered class="modern-card q-pa-xl text-center">
      <q-icon name="manage_search" size="42px" class="muted q-mb-sm" />
      <div class="text-subtitle1 text-weight-medium text-ink">
        No se encontraron soluciones con los criterios seleccionados
      </div>
      <div class="text-caption muted q-mt-xs">
        Solo aparecen casos en estado Resuelto o Cerrado que tengan documentada su Causa Raíz y Solución Aplicada.
      </div>
    </q-card>

    <q-card v-else flat bordered class="modern-card overflow-hidden">
      <div class="q-pa-md q-gutter-y-md">
        <div
          v-for="item in solucionesPaginadas"
          :key="item.id"
          class="solucion-card q-pa-md"
        >
          <div class="row items-start justify-between q-gutter-sm q-mb-sm">
            <div class="min-w-0 col-12 col-md">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <strong class="text-primary tabular-nums">{{ item.folio }}</strong>
                <span class="chip brand">{{ item.codigo_departamento }} · {{ item.departamento }}</span>
                <PrioridadBadge :prioridad="item.prioridad" compacto />
                <span class="chip" :class="ESTADO_CLASS[item.estado]">
                  <span class="chip__dot" />
                  {{ item.estado }}
                </span>
              </div>
              <div class="text-subtitle1 text-weight-bold text-ink texto-wrap">
                {{ item.catalogo_incidencia }}
              </div>
            </div>

            <div class="row items-center q-gutter-sm shrink-0">
              <span class="text-caption muted tabular-nums">
                {{ item.tecnico ?? 'Equipo TI' }} ·
                {{ formatearFecha(item.fecha_resolucion ?? item.fecha_cierre) }}
              </span>
              <q-btn
                outline
                unelevated
                dense
                size="sm"
                color="secondary"
                icon="content_copy"
                class="btn-accion-icono"
                :aria-label="`Copiar solución de ${item.folio}`"
                @click="copiarSolucion(item)"
              >
                <q-tooltip>Copiar solución</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="bloque-sintoma q-pa-sm q-mb-sm">
            <div class="text-caption muted text-uppercase text-weight-medium">Síntoma reportado</div>
            <div class="text-body2 text-ink whitespace-preline texto-wrap q-mt-xs">
              {{ item.descripcion_incidencia }}
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <div class="bloque-detalle q-pa-sm full-height">
                <div class="text-caption text-weight-bold text-uppercase text-warning">
                  Causa Raíz
                </div>
                <div class="text-body2 text-ink whitespace-preline texto-wrap q-mt-xs">
                  {{ item.causa_raiz }}
                </div>
              </div>
            </div>
            <div class="col-12 col-md-7">
              <div class="bloque-solucion q-pa-sm full-height">
                <div class="text-caption text-weight-bold text-uppercase text-positive">
                  Solución Aplicada
                </div>
                <div class="text-body2 text-ink whitespace-preline texto-wrap q-mt-xs">
                  {{ item.solucion_aplicada }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 🛡️ [FASE 3 - UI BASE SOLUCIONES] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_SOLUCIONES"
            dense
            outlined
            options-dense
            hide-bottom-space
            aria-label="Soluciones por página"
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import { ESTADO_CLASS } from '@/composables/useTickets';
import type { BaseSolucionItem } from '@/models/types';
import { useTicketStore } from '@/stores/ticketStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useDepartmentsStore } from '@/stores/useDepartmentsStore';
import { formatearFechaHora } from '@/utils/formatFecha';

const OPCIONES_FILAS_SOLUCIONES: number[] = [3, 5, 10, 15, 20];

const $q = useQuasar();
const ticketStore = useTicketStore();
const departmentsStore = useDepartmentsStore();
const catalogStore = useCatalogStore();

const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const soluciones = ref<BaseSolucionItem[]>([]);
const paginaActual = ref(1);
const filasPorPagina = ref(5);

const filtros = reactive<{
  q: string | null;
  id_departamento_ti: number | null;
  id_catalogo: number | null;
}>({
  q: '',
  id_departamento_ti: null,
  id_catalogo: null,
});

function normalizar(valor: string | null | undefined): string {
  return (valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const areasTiActivas = computed(() =>
  departmentsStore.departments.filter(
    (d) => d.is_activo && normalizar(d.tipo_departamento) === 'SUB-GERENCIA TI',
  ),
);

const catalogoFiltradoPorArea = computed(() => {
  const activos = catalogStore.serviciosActivos;
  if (!filtros.id_departamento_ti) return activos;
  return activos.filter((c) => c.id_departamento === filtros.id_departamento_ti);
});

const tieneFiltrosActivos = computed(
  () =>
    Boolean(filtros.q?.trim()) ||
    filtros.id_departamento_ti !== null ||
    filtros.id_catalogo !== null,
);

// 🛡️ [FASE 3 - UI BASE SOLUCIONES] Paginación de 3 zonas reactiva
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(soluciones.value.length / filasPorPagina.value)),
);

const solucionesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * filasPorPagina.value;
  return soluciones.value.slice(inicio, inicio + filasPorPagina.value);
});

const textoMostrando = computed(() => {
  const total = soluciones.value.length;
  if (total === 0) return 'Mostrando 0 de 0 soluciones';
  const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
  const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
  return `Mostrando ${inicio}–${fin} de ${total} soluciones`;
});

watch(filasPorPagina, () => {
  paginaActual.value = 1;
});

watch(totalPaginas, (nuevoMax) => {
  if (paginaActual.value > nuevoMax) {
    paginaActual.value = nuevoMax;
  }
});

async function buscarSoluciones(): Promise<void> {
  cargando.value = true;
  errorCarga.value = null;
  paginaActual.value = 1;
  try {
    soluciones.value = await ticketStore.cargarBaseSoluciones({
      ...(filtros.q?.trim() ? { q: filtros.q.trim() } : {}),
      ...(filtros.id_departamento_ti ? { id_departamento_ti: filtros.id_departamento_ti } : {}),
      ...(filtros.id_catalogo ? { id_catalogo: filtros.id_catalogo } : {}),
      limite: 100,
    });
  } catch (err: unknown) {
    errorCarga.value =
      err instanceof Error ? err.message : 'No fue posible consultar la Base de Soluciones.';
  } finally {
    cargando.value = false;
  }
}

function limpiarFiltros(): void {
  filtros.q = '';
  filtros.id_departamento_ti = null;
  filtros.id_catalogo = null;
  void buscarSoluciones();
}

async function copiarSolucion(item: BaseSolucionItem): Promise<void> {
  const texto = `Causa raíz: ${item.causa_raiz}\nSolución aplicada: ${item.solucion_aplicada}`;
  try {
    await copyToClipboard(texto);
    $q.notify({
      type: 'positive',
      message: `Solución de ${item.folio} copiada al portapapeles.`,
      position: 'top-right',
      timeout: 2200,
    });
  } catch {
    $q.notify({
      type: 'warning',
      message: 'No fue posible copiar al portapapeles.',
      position: 'top-right',
    });
  }
}

function formatearFecha(fecha: string | null): string {
  return formatearFechaHora(fecha) || 'Sin fecha';
}

onMounted(async () => {
  await Promise.allSettled([
    departmentsStore.cargarDepartamentos(),
    catalogStore.cargarCatalogo(),
    buscarSoluciones(),
  ]);
});
</script>

<style scoped lang="scss">
.soluciones-page {
  max-width: 1400px;
  margin: 0 auto;
}

.solucion-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.bloque-sintoma,
.bloque-detalle {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.bloque-solucion {
  background: var(--success-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.whitespace-preline {
  white-space: pre-line;
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}

.texto-wrap {
  white-space: normal;
  word-break: break-word;
  line-height: 1.45;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

// Pie de paginación de 3 zonas consistente con Configuraciones
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
