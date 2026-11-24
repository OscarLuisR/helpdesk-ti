<!-- 🛡️ [FASE 3.5 - VISTAS] Reportes y SLAs con Motor SQL de Relojes Reales (/dashboard/reportes) -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg reportes-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="pie_chart_outline" size="14px" />
          Analítica · SLAs y Gobernanza
        </span>
        <h1 class="page-title">Reportes y Cumplimiento de SLAs</h1>
        <p class="page-subtitle">
          Métricas reales calculadas desde bitácora: tiempo de asignación, tiempo efectivo en progreso, pausas tipificadas y gobernanza operativa.
        </p>
      </div>
      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <q-btn
          outline
          unelevated
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
          :class="{ 'col-grow': $q.screen.xs }"
          :loading="cargando"
          @click="cargarMetricas"
        />
        <!-- 🛡️ [FASE 3.6 - EXPORTADORES] Menú de exportación CSV/Excel y PDF Ejecutivo -->
        <q-btn-dropdown
          unelevated
          no-caps
          color="primary"
          icon="download"
          label="Exportar"
          :class="{ 'col-grow': $q.screen.xs }"
          :disable="cargando"
        >
          <q-list dense style="min-width: 265px">
            <q-item clickable v-close-popup @click="descargarCasosDetallados">
              <q-item-section avatar>
                <q-icon name="table_view" color="primary" size="18px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Casos Detallados (Excel / CSV)</q-item-label>
                <q-item-label caption>Relojes, pausas, causa raíz y solución</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="descargarMatrizTecnicos">
              <q-item-section avatar>
                <q-icon name="grid_on" color="secondary" size="18px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Matriz Mensual Técnicos (CSV)</q-item-label>
                <q-item-label caption>Resueltos, tiempo efectivo y % SLA</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator class="q-my-xs" />
            <q-item clickable v-close-popup @click="generarInformePdf">
              <q-item-section avatar>
                <q-icon name="picture_as_pdf" color="negative" size="18px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Informe Ejecutivo (PDF)</q-item-label>
                <q-item-label caption>Resumen gerencial imprimible A4</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <!-- Barra de filtros por período y Sub-Gerencia TI -->
    <q-card flat bordered class="modern-card q-pa-md q-mb-lg">
      <div class="row items-center justify-between q-gutter-sm q-mb-sm">
        <div class="row items-center q-gutter-xs flex-wrap">
          <q-btn
            v-for="preset in PRESETS_PERIODO"
            :key="preset.id"
            :unelevated="presetActivo === preset.id"
            :outline="presetActivo !== preset.id"
            dense
            no-caps
            size="sm"
            color="primary"
            :label="preset.label"
            @click="aplicarPreset(preset.id)"
          />
        </div>
        <span class="text-caption muted tabular-nums">
          Evaluables: <strong class="text-ink">{{ resumen.total_evaluables }}</strong> · Cancelados excluidos:
          <strong class="text-ink">{{ resumen.total_cancelados }}</strong>
        </span>
      </div>

      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            v-model="filtros.fecha_desde"
            type="date"
            outlined
            dense
            label="Desde"
            @update:model-value="presetActivo = 'custom'"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            v-model="filtros.fecha_hasta"
            type="date"
            outlined
            dense
            label="Hasta"
            @update:model-value="presetActivo = 'custom'"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
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
            label="Filtrar por Sub-Gerencia TI"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="filter_alt"
            label="Aplicar"
            class="full-width"
            :loading="cargando"
            @click="cargarMetricas"
          />
        </div>
      </div>
    </q-card>

    <!-- Tarjetas de Relojes Reales y Cumplimiento SLA -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="modern-card q-pa-md full-height">
          <div class="text-caption muted text-uppercase text-weight-medium">SLA Asignación</div>
          <div class="text-h4 text-weight-bold text-primary tabular-nums q-mt-xs">
            {{ resumen.pct_sla_asignacion }}%
          </div>
          <div class="text-caption muted q-mt-xs">
            Prom. asignación: <strong class="text-ink">{{ formatearMinutos(resumen.promedio_asignacion_minutos) }}</strong>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="modern-card q-pa-md full-height">
          <div class="text-caption muted text-uppercase text-weight-medium">SLA Resolución Efectiva</div>
          <div class="text-h4 text-weight-bold text-positive tabular-nums q-mt-xs">
            {{ resumen.pct_sla_resolucion }}%
          </div>
          <div class="text-caption muted q-mt-xs">
            Prom. efectivo: <strong class="text-ink">{{ formatearMinutos(resumen.promedio_efectivo_minutos) }}</strong>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="modern-card q-pa-md full-height">
          <div class="text-caption muted text-uppercase text-weight-medium">Tiempo en Pausa</div>
          <div class="text-h4 text-weight-bold text-warning tabular-nums q-mt-xs">
            {{ formatearMinutos(resumen.promedio_pausa_minutos) }}
          </div>
          <div class="text-caption muted q-mt-xs">
            Promedio detenido (En Espera) por ticket
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="modern-card q-pa-md full-height">
          <div class="text-caption muted text-uppercase text-weight-medium">Gobernanza y Calidad</div>
          <div class="text-h4 text-weight-bold text-ink tabular-nums q-mt-xs">
            {{ resumen.gobernanza.pct_conformidad_usuario }}%
          </div>
          <div class="text-caption muted q-mt-xs">
            Conformidad · Reapertura: <strong class="text-ink">{{ resumen.gobernanza.tasa_reapertura_pct }}%</strong> ·
            Suplencias: <strong class="text-ink">{{ resumen.gobernanza.total_suplencias }}</strong>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Tabla 1: Cumplimiento SLA por Sub-Gerencia TI -->
    <q-card flat bordered class="modern-card overflow-hidden q-mb-lg">
      <div class="section-header q-pa-md row items-center justify-between q-gutter-xs">
        <span class="text-subtitle2 text-weight-bold text-ink">
          Cumplimiento SLA y Gobernanza por Sub-Gerencia TI
        </span>
        <span class="text-caption muted tabular-nums">
          Transferencias: {{ resumen.gobernanza.total_transferencias }} · Cierres Confirmados:
          {{ resumen.gobernanza.cierres_confirmados }} · Administrativos:
          {{ resumen.gobernanza.cierres_administrativos }}
        </span>
      </div>

      <q-table
        flat
        class="modern-table tabla-reportes"
        :rows="resumen.por_departamento"
        :columns="columnasDepartamentos"
        row-key="id_departamento"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        no-data-label="No hay tickets registrados en el período seleccionado"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="text-weight-bold text-ink texto-celda q-mb-xs">
                  {{ props.row.departamento }}
                </div>
                <div class="row items-center q-gutter-xs q-mb-sm">
                  <span class="chip tabular-nums" :class="claseChipSla(props.row.pct_sla_asignacion)">
                    SLA Asig: {{ props.row.pct_sla_asignacion }}%
                  </span>
                  <span class="chip tabular-nums" :class="claseChipSla(props.row.pct_sla_resolucion)">
                    SLA Resol: {{ props.row.pct_sla_resolucion }}%
                  </span>
                </div>
              </div>
              <div class="row q-col-gutter-xs q-pt-sm card-item-footer text-caption muted tabular-nums">
                <div class="col-6">Evaluables: <strong class="text-ink">{{ props.row.evaluables }}</strong></div>
                <div class="col-6">Res. / Cerr.: <strong class="text-ink">{{ props.row.resueltos_cerrados }}</strong></div>
                <div class="col-6">Prom. Asign.: <strong class="text-ink">{{ formatearMinutos(props.row.promedio_asignacion_minutos) }}</strong></div>
                <div class="col-6">Prom. Efect.: <strong class="text-ink">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</strong></div>
                <div class="col-6">Suplencias: <strong class="text-ink">{{ props.row.suplencias }}</strong></div>
                <div class="col-6">Reapert.: <strong class="text-ink">{{ props.row.reaperturas }}</strong></div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-departamento="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-weight-medium text-ink texto-celda">{{ props.row.departamento }}</span>
          </q-td>
        </template>
        <template #body-cell-promedio_asignacion_minutos="props">
          <q-td :props="props">
            <span class="tabular-nums texto-lineal">{{ formatearMinutos(props.row.promedio_asignacion_minutos) }}</span>
          </q-td>
        </template>
        <template #body-cell-promedio_efectivo_minutos="props">
          <q-td :props="props">
            <span class="tabular-nums texto-lineal">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</span>
          </q-td>
        </template>
        <template #body-cell-pct_sla_asignacion="props">
          <q-td :props="props">
            <span class="chip chip-tabla-compacto tabular-nums" :class="claseChipSla(props.row.pct_sla_asignacion)">
              {{ props.row.pct_sla_asignacion }}%
            </span>
          </q-td>
        </template>
        <template #body-cell-pct_sla_resolucion="props">
          <q-td :props="props">
            <span class="chip chip-tabla-compacto tabular-nums" :class="claseChipSla(props.row.pct_sla_resolucion)">
              {{ props.row.pct_sla_resolucion }}%
            </span>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Tabla 2: Rendimiento por Técnico -->
    <q-card flat bordered class="modern-card overflow-hidden q-mb-lg">
      <div class="section-header q-pa-md row items-center justify-between q-gutter-xs">
        <span class="text-subtitle2 text-weight-bold text-ink">
          Rendimiento, Tiempo Efectivo y Reapertura por Técnico
        </span>
        <span class="text-caption muted tabular-nums">{{ resumen.por_tecnico.length }} especialistas</span>
      </div>

      <q-table
        flat
        v-model:pagination="paginacionTecnicos"
        class="modern-table tabla-reportes"
        :rows="resumen.por_tecnico"
        :columns="columnasTecnicos"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_TECNICOS"
        row-key="id_tecnico"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No hay actividad técnica registrada en el período seleccionado"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="text-weight-bold text-ink texto-celda">{{ props.row.tecnico }}</div>
                <div class="text-caption muted q-mb-sm">{{ props.row.departamento }}</div>
                <div class="row items-center q-gutter-xs q-mb-sm">
                  <span class="chip tabular-nums" :class="claseChipSla(props.row.pct_sla_resolucion)">
                    SLA Resol: {{ props.row.pct_sla_resolucion }}%
                  </span>
                  <span class="chip tabular-nums" :class="props.row.pct_reapertura > 5 ? 'bad' : 'ok'">
                    Reapert: {{ props.row.pct_reapertura }}%
                  </span>
                </div>
              </div>
              <div class="row q-col-gutter-xs q-pt-sm card-item-footer text-caption muted tabular-nums">
                <div class="col-6">Asignados: <strong class="text-ink">{{ props.row.total }}</strong></div>
                <div class="col-6">Res. / Cerr.: <strong class="text-ink">{{ props.row.resueltos_cerrados }}</strong></div>
                <div class="col-6">Prom. Efect.: <strong class="text-ink">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</strong></div>
                <div class="col-6">Total Pausa: <strong class="text-ink">{{ formatearMinutos(props.row.total_pausa_minutos) }}</strong></div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-tecnico="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-weight-medium text-ink texto-celda">{{ props.row.tecnico }}</span>
          </q-td>
        </template>
        <template #body-cell-departamento="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-caption muted texto-celda">{{ props.row.departamento }}</span>
          </q-td>
        </template>
        <template #body-cell-promedio_efectivo_minutos="props">
          <q-td :props="props">
            <span class="tabular-nums texto-lineal">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</span>
          </q-td>
        </template>
        <template #body-cell-total_pausa_minutos="props">
          <q-td :props="props">
            <span class="tabular-nums texto-lineal">{{ formatearMinutos(props.row.total_pausa_minutos) }}</span>
          </q-td>
        </template>
        <template #body-cell-pct_sla_resolucion="props">
          <q-td :props="props">
            <span class="chip chip-tabla-compacto tabular-nums" :class="claseChipSla(props.row.pct_sla_resolucion)">
              {{ props.row.pct_sla_resolucion }}%
            </span>
          </q-td>
        </template>
        <template #body-cell-pct_reapertura="props">
          <q-td :props="props">
            <span class="chip chip-tabla-compacto tabular-nums" :class="props.row.pct_reapertura > 5 ? 'bad' : 'ok'">
              {{ props.row.pct_reapertura }}%
            </span>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI REPORTES] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPaginaTecnicos"
            :options="OPCIONES_FILAS_POR_PAGINA_TECNICOS"
            dense
            outlined
            options-dense
            hide-bottom-space
            aria-label="Especialistas por página"
            class="select-filas-pagina"
          />
          <span class="text-caption muted">por página</span>
        </div>

        <div class="footer-zona-centro">
          <q-pagination
            v-model="paginaActualTecnicos"
            :max="totalPaginasTecnicos"
            :max-pages="$q.screen.lt.sm ? 3 : 5"
            direction-links
            active-design="unelevated"
            active-color="primary"
            color="grey-7"
            size="sm"
          />
        </div>

        <div class="footer-zona-der text-caption muted tabular-nums">
          {{ textoMostrandoTecnicos }}
        </div>
      </div>
    </q-card>

    <!-- Fila inferior: Pausas tipificadas + Top Catálogo -->
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-5">
        <q-card flat bordered class="modern-card q-pa-md full-height">
          <div class="text-subtitle2 text-weight-bold text-ink q-mb-sm">
            Demoras por Motivo Tipificado de Pausa (En Espera)
          </div>
          <div class="q-gutter-y-sm">
            <div v-for="m in filasPausas" :key="m.motivo" class="pausa-item q-pa-sm">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-weight-medium text-ink">{{ m.motivo }}</span>
                <span class="text-weight-bold text-ink tabular-nums">
                  {{ formatearMinutos(m.minutos) }} ({{ m.porcentaje }}%)
                </span>
              </div>
              <q-linear-progress
                :value="m.porcentaje / 100"
                color="warning"
                rounded
                size="7px"
                class="pausa-progress"
              />
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-lg-7">
        <q-card flat bordered class="modern-card overflow-hidden full-height">
          <div class="section-header q-pa-md row items-center justify-between q-gutter-xs">
            <span class="text-subtitle2 text-weight-bold text-ink">
              Top 10 Incidencias del Catálogo
            </span>
            <span class="text-caption muted tabular-nums">
              {{ resumen.top_catalogo.length }} incidencias
            </span>
          </div>
          <q-table
            flat
            class="modern-table tabla-reportes"
            :rows="resumen.top_catalogo"
            :columns="columnasCatalogo"
            row-key="id_catalogo"
            :grid="$q.screen.lt.md"
            hide-pagination
            :pagination="{ rowsPerPage: 10 }"
            no-data-label="Sin incidencias en el período"
          >
            <template #item="props">
              <div class="col-12 col-sm-6 q-pa-xs">
                <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
                  <div>
                    <div class="text-weight-medium text-ink texto-celda q-mb-xs">
                      {{ props.row.catalogo_incidencia }}
                    </div>
                    <div class="text-caption muted q-mb-sm">{{ props.row.departamento }}</div>
                  </div>
                  <div class="row items-center justify-between q-pt-sm card-item-footer text-caption muted tabular-nums">
                    <span>Casos: <strong class="text-ink">{{ props.row.cantidad }}</strong></span>
                    <span>Prom.: <strong class="text-primary">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</strong></span>
                  </div>
                </q-card>
              </div>
            </template>

            <template #body-cell-catalogo_incidencia="props">
              <q-td :props="props" class="celda-wrap">
                <span class="text-weight-medium text-ink texto-celda">{{ props.row.catalogo_incidencia }}</span>
              </q-td>
            </template>
            <template #body-cell-departamento="props">
              <q-td :props="props" class="celda-wrap">
                <span class="text-caption muted texto-celda">{{ props.row.departamento }}</span>
              </q-td>
            </template>
            <template #body-cell-cantidad="props">
              <q-td :props="props">
                <span class="text-weight-bold text-ink tabular-nums">{{ props.row.cantidad }}</span>
              </q-td>
            </template>
            <template #body-cell-promedio_efectivo_minutos="props">
              <q-td :props="props">
                <span class="tabular-nums texto-lineal">{{ formatearMinutos(props.row.promedio_efectivo_minutos) }}</span>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
import type {
  MetricaTicketReal,
  MetricasDepartamentoResumen,
  MetricasResumenOperativo,
  MetricasTecnicoResumen,
  MetricasTopCatalogo,
} from '@/models/types';
import { useTicketStore } from '@/stores/ticketStore';
import { useDepartmentsStore } from '@/stores/useDepartmentsStore';
import {
  exportarInformeEjecutivoPdf,
  exportarListadoDetalladoCsv,
  exportarMatrizMensualTecnicosCsv,
} from '@/utils/exportarReportes';

type PresetId = 'mes' | '30d' | '60d' | '90d' | 'todo' | 'custom';

const OPCIONES_FILAS_POR_PAGINA_TECNICOS: number[] = [3, 5, 10, 15, 20];

const PRESETS_PERIODO: ReadonlyArray<{ id: Exclude<PresetId, 'custom'>; label: string }> = [
  { id: 'mes', label: 'Mes actual' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: '60d', label: 'Últimos 60 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: 'todo', label: 'Todo el historial' },
];

const RESUMEN_VACIO: MetricasResumenOperativo = {
  total_tickets: 0,
  total_evaluables: 0,
  total_cancelados: 0,
  total_resueltos_cerrados: 0,
  pct_sla_asignacion: 0,
  pct_sla_resolucion: 0,
  promedio_asignacion_minutos: 0,
  promedio_efectivo_minutos: 0,
  promedio_pausa_minutos: 0,
  pausas_por_motivo: {
    repuesto_compra_minutos: 0,
    proveedor_externo_minutos: 0,
    usuario_no_disponible_minutos: 0,
    esperando_autorizacion_minutos: 0,
  },
  gobernanza: {
    total_suplencias: 0,
    total_reaperturas: 0,
    total_transferencias: 0,
    tasa_reapertura_pct: 0,
    cierres_confirmados: 0,
    cierres_administrativos: 0,
    pct_conformidad_usuario: 0,
  },
  por_departamento: [],
  por_tecnico: [],
  top_catalogo: [],
};

const $q = useQuasar();
const ticketStore = useTicketStore();
const departmentsStore = useDepartmentsStore();

const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const resumen = ref<MetricasResumenOperativo>(RESUMEN_VACIO);
const ticketsMetricas = ref<MetricaTicketReal[]>([]);
const presetActivo = ref<PresetId>('todo');

const filtros = reactive<{
  fecha_desde: string;
  fecha_hasta: string;
  id_departamento_ti: number | null;
}>({
  fecha_desde: '',
  fecha_hasta: '',
  id_departamento_ti: null,
});

// 🛡️ [FASE 3 - UI REPORTES] Paginación de 3 zonas reactiva para tabla Rendimiento por Técnico
const paginacionTecnicos = ref<NonNullable<QTableProps['pagination']>>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

const filasPorPaginaTecnicos = computed({
  get: () => paginacionTecnicos.value.rowsPerPage ?? 5,
  set: (val: number) => {
    paginacionTecnicos.value = { ...paginacionTecnicos.value, rowsPerPage: val, page: 1 };
  },
});

const paginaActualTecnicos = computed({
  get: () => paginacionTecnicos.value.page ?? 1,
  set: (val: number) => {
    paginacionTecnicos.value = { ...paginacionTecnicos.value, page: val };
  },
});

const totalPaginasTecnicos = computed(() =>
  Math.max(1, Math.ceil(resumen.value.por_tecnico.length / filasPorPaginaTecnicos.value)),
);

const textoMostrandoTecnicos = computed(() => {
  const total = resumen.value.por_tecnico.length;
  if (total === 0) return 'Mostrando 0 de 0 especialistas';
  const inicio = (paginaActualTecnicos.value - 1) * filasPorPaginaTecnicos.value + 1;
  const fin = Math.min(paginaActualTecnicos.value * filasPorPaginaTecnicos.value, total);
  return `Mostrando ${inicio}–${fin} de ${total} especialistas`;
});

watch(totalPaginasTecnicos, (nuevoMax) => {
  if (paginaActualTecnicos.value > nuevoMax) {
    paginaActualTecnicos.value = nuevoMax;
  }
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

function formatoFechaInput(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function aplicarPreset(preset: Exclude<PresetId, 'custom'>): void {
  presetActivo.value = preset;
  const hoy = new Date();

  if (preset === 'todo') {
    filtros.fecha_desde = '';
    filtros.fecha_hasta = '';
  } else if (preset === 'mes') {
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    filtros.fecha_desde = formatoFechaInput(inicioMes);
    filtros.fecha_hasta = formatoFechaInput(hoy);
  } else {
    const dias = preset === '30d' ? 30 : preset === '60d' ? 60 : 90;
    const inicio = new Date(hoy.getTime() - dias * 86400000);
    filtros.fecha_desde = formatoFechaInput(inicio);
    filtros.fecha_hasta = formatoFechaInput(hoy);
  }

  void cargarMetricas();
}

function formatearMinutos(minutos: number): string {
  const valor = Number(minutos ?? 0);
  if (valor < 60) return `${Math.round(valor)} min`;
  const horas = Math.floor(valor / 60);
  const resto = Math.round(valor % 60);
  return resto > 0 ? `${horas}h ${resto}m` : `${horas}h`;
}

function claseChipSla(pct: number): string {
  if (pct >= 90) return 'ok';
  if (pct >= 75) return 'warn';
  return 'bad';
}

const filasPausas = computed(() => {
  const p = resumen.value.pausas_por_motivo;
  const items = [
    { motivo: 'Esperando repuesto/compra', minutos: p.repuesto_compra_minutos },
    { motivo: 'Proveedor externo', minutos: p.proveedor_externo_minutos },
    { motivo: 'Usuario no disponible', minutos: p.usuario_no_disponible_minutos },
    { motivo: 'Esperando autorización', minutos: p.esperando_autorizacion_minutos },
  ];
  const total = items.reduce((acc, it) => acc + it.minutos, 0);
  return items.map((it) => ({
    ...it,
    porcentaje: total > 0 ? Math.round((it.minutos / total) * 100) : 0,
  }));
});

// 🛡️ [FASE 3 - UI REPORTES] Anchos fijos (100%) en las 3 tablas para eliminar scroll horizontal
const columnasDepartamentos: QTableColumn<MetricasDepartamentoResumen>[] = [
  {
    name: 'departamento',
    label: 'Sub-Gerencia TI',
    field: 'departamento',
    align: 'left',
    sortable: true,
    style: 'width: 22%;',
    headerStyle: 'width: 22%;',
  },
  {
    name: 'evaluables',
    label: 'Evaluables',
    field: 'evaluables',
    align: 'center',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'resueltos_cerrados',
    label: 'Res. / Cerr.',
    field: 'resueltos_cerrados',
    align: 'center',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'promedio_asignacion_minutos',
    label: 'Prom. Asign.',
    field: 'promedio_asignacion_minutos',
    align: 'center',
    sortable: true,
    style: 'width: 11%;',
    headerStyle: 'width: 11%;',
    format: (v: number) => formatearMinutos(v),
  },
  {
    name: 'promedio_efectivo_minutos',
    label: 'Prom. Efectivo',
    field: 'promedio_efectivo_minutos',
    align: 'center',
    sortable: true,
    style: 'width: 12%;',
    headerStyle: 'width: 12%;',
    format: (v: number) => formatearMinutos(v),
  },
  {
    name: 'suplencias',
    label: 'Suplencias',
    field: 'suplencias',
    align: 'center',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'reaperturas',
    label: 'Reapert.',
    field: 'reaperturas',
    align: 'center',
    sortable: true,
    style: 'width: 8%;',
    headerStyle: 'width: 8%;',
  },
  {
    name: 'pct_sla_asignacion',
    label: 'SLA Asig.',
    field: 'pct_sla_asignacion',
    align: 'right',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'pct_sla_resolucion',
    label: 'SLA Resol.',
    field: 'pct_sla_resolucion',
    align: 'right',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
];

const columnasTecnicos: QTableColumn<MetricasTecnicoResumen>[] = [
  {
    name: 'tecnico',
    label: 'Técnico',
    field: 'tecnico',
    align: 'left',
    sortable: true,
    style: 'width: 18%;',
    headerStyle: 'width: 18%;',
  },
  {
    name: 'departamento',
    label: 'Área TI',
    field: 'departamento',
    align: 'left',
    sortable: true,
    style: 'width: 20%;',
    headerStyle: 'width: 20%;',
  },
  {
    name: 'total',
    label: 'Asignados',
    field: 'total',
    align: 'center',
    sortable: true,
    style: 'width: 9%;',
    headerStyle: 'width: 9%;',
  },
  {
    name: 'resueltos_cerrados',
    label: 'Res. / Cerr.',
    field: 'resueltos_cerrados',
    align: 'center',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'promedio_efectivo_minutos',
    label: 'Prom. Efectivo',
    field: 'promedio_efectivo_minutos',
    align: 'center',
    sortable: true,
    style: 'width: 12%;',
    headerStyle: 'width: 12%;',
    format: (v: number) => formatearMinutos(v),
  },
  {
    name: 'total_pausa_minutos',
    label: 'Total Pausa',
    field: 'total_pausa_minutos',
    align: 'center',
    sortable: true,
    style: 'width: 11%;',
    headerStyle: 'width: 11%;',
    format: (v: number) => formatearMinutos(v),
  },
  {
    name: 'pct_reapertura',
    label: '% Reapert.',
    field: 'pct_reapertura',
    align: 'center',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'pct_sla_resolucion',
    label: 'SLA Resol.',
    field: 'pct_sla_resolucion',
    align: 'right',
    sortable: true,
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
];

const columnasCatalogo: QTableColumn<MetricasTopCatalogo>[] = [
  {
    name: 'catalogo_incidencia',
    label: 'Incidencia del Catálogo',
    field: 'catalogo_incidencia',
    align: 'left',
    style: 'width: 48%;',
    headerStyle: 'width: 48%;',
  },
  {
    name: 'departamento',
    label: 'Área TI',
    field: 'departamento',
    align: 'left',
    style: 'width: 25%;',
    headerStyle: 'width: 25%;',
  },
  {
    name: 'cantidad',
    label: 'Casos',
    field: 'cantidad',
    align: 'center',
    style: 'width: 10%;',
    headerStyle: 'width: 10%;',
  },
  {
    name: 'promedio_efectivo_minutos',
    label: 'Prom. Efectivo',
    field: 'promedio_efectivo_minutos',
    align: 'right',
    style: 'width: 17%;',
    headerStyle: 'width: 17%;',
    format: (v: number) => formatearMinutos(v),
  },
];

const textoPeriodoExportacion = computed(() => {
  if (filtros.fecha_desde || filtros.fecha_hasta) {
    return `${filtros.fecha_desde || 'Inicio'} a ${filtros.fecha_hasta || 'Hoy'}`;
  }
  return PRESETS_PERIODO.find((p) => p.id === presetActivo.value)?.label ?? 'Todo el historial';
});

const textoAreaExportacion = computed(() => {
  if (!filtros.id_departamento_ti) return 'Todas las Sub-Gerencias TI';
  return (
    areasTiActivas.value.find((d) => d.id === filtros.id_departamento_ti)?.nombre ??
    'Sub-Gerencia seleccionada'
  );
});

function descargarCasosDetallados(): void {
  if (!ticketsMetricas.value.length) {
    $q.notify({
      type: 'warning',
      message: 'No hay tickets en el período seleccionado para exportar.',
      position: 'top-right',
    });
    return;
  }
  exportarListadoDetalladoCsv(ticketsMetricas.value, textoPeriodoExportacion.value);
  $q.notify({
    type: 'positive',
    message: `Exportados ${ticketsMetricas.value.length} casos en CSV compatible con Excel.`,
    position: 'top-right',
  });
}

function descargarMatrizTecnicos(): void {
  if (!ticketsMetricas.value.length) {
    $q.notify({
      type: 'warning',
      message: 'No hay actividad técnica en el período seleccionado para exportar.',
      position: 'top-right',
    });
    return;
  }
  exportarMatrizMensualTecnicosCsv(ticketsMetricas.value, textoPeriodoExportacion.value);
  $q.notify({
    type: 'positive',
    message: 'Matriz mensual por técnico descargada en formato CSV.',
    position: 'top-right',
  });
}

function generarInformePdf(): void {
  const ok = exportarInformeEjecutivoPdf(
    resumen.value,
    textoPeriodoExportacion.value,
    textoAreaExportacion.value,
  );
  if (!ok) {
    $q.notify({
      type: 'warning',
      message: 'Permite las ventanas emergentes en tu navegador para generar el PDF.',
      position: 'top-right',
    });
  }
}

async function cargarMetricas(): Promise<void> {
  cargando.value = true;
  errorCarga.value = null;
  try {
    const resp = await ticketStore.cargarMetricas({
      ...(filtros.fecha_desde ? { fecha_desde: filtros.fecha_desde } : {}),
      ...(filtros.fecha_hasta ? { fecha_hasta: filtros.fecha_hasta } : {}),
      ...(filtros.id_departamento_ti ? { id_departamento_ti: filtros.id_departamento_ti } : {}),
    });
    resumen.value = resp.resumen;
    ticketsMetricas.value = resp.tickets;
  } catch (err: unknown) {
    errorCarga.value =
      err instanceof Error ? err.message : 'No fue posible cargar las métricas de SLA.';
  } finally {
    cargando.value = false;
  }
}

onMounted(async () => {
  await Promise.allSettled([departmentsStore.cargarDepartamentos(), cargarMetricas()]);
});
</script>

<style scoped lang="scss">
.reportes-page {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  border-bottom: 1px solid var(--border-subtle);
}

.pausa-item {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.pausa-progress {
  :deep(.q-linear-progress__track) {
    background: var(--border-subtle);
    opacity: 1;
  }
}

// 🛡️ [FASE 3 - UI REPORTES] Tablas compactas fijas sin scroll horizontal y encabezados en una línea
.tabla-reportes {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(thead tr th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
    padding: 10px 6px;
  }

  :deep(thead tr th:first-child),
  :deep(tbody tr td:first-child) {
    padding-left: 14px;
  }

  :deep(thead tr th:last-child),
  :deep(tbody tr td:last-child) {
    padding-right: 14px;
  }

  :deep(tbody td) {
    height: auto;
    white-space: normal;
    word-break: break-word;
    padding: 11px 6px;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.texto-celda {
  line-height: 1.35;
}

.texto-lineal {
  white-space: nowrap;
}

.chip-tabla-compacto {
  font-size: 0.72rem;
  padding: 2px 8px;
}

.card-item-footer {
  border-top: 1px solid var(--border-subtle);
}

// Pie de tabla de 3 zonas consistente con Configuraciones
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
