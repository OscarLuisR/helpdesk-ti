<!-- 🛡️ [FASE 3.6 - DASHBOARD OPERATIVO] Relojes reales desde ticket_bitacora, filtros de período, comparativa de pares y UI responsiva -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg dashboard-page">
    <!-- Cabecera de página alineada con Recepción Global y Verificación -->
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-lg min-w-0">
        <span class="page-eyebrow">
          <q-icon name="space_dashboard" size="14px" />
          Operación · Monitoreo
        </span>
        <div class="dashboard-title-row">
          <h1 class="page-title">{{ tituloDashboard }}</h1>
          <span
            class="calidad-badge"
            :class="tasaReaperturaPct < metaMaxReaperturaPct ? 'calidad-badge--ok' : 'calidad-badge--bad'"
          >
            {{ textoCalidadBadge }}
          </span>
        </div>
        <p class="page-subtitle">{{ hintRolActual }}</p>
      </div>

      <div class="col-12 col-lg-auto row items-center q-gutter-sm shrink-0">
        <q-btn
          outline
          unelevated
          no-caps
          color="secondary"
          icon="refresh"
          label="Actualizar"
          :class="{ 'col-grow': $q.screen.xs }"
          :loading="cargando"
          @click="recargarDatos"
        />
        <q-btn
          outline
          unelevated
          no-caps
          color="primary"
          icon="inbox"
          :label="etiquetaBotonBandeja"
          :class="{ 'col-grow': $q.screen.xs }"
          :to="rutaBandejaRol"
        />
        <q-btn
          v-if="puedeCrearTicket"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nuevo Ticket"
          :class="{ 'col-grow': $q.screen.xs }"
          to="/tickets/nuevo"
        />
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

    <!-- 🛡️ [FASE 3.6 - DASHBOARD] Filtro por período y franja de relojes reales desde ticket_bitacora -->
    <q-card flat bordered class="modern-card q-pa-md q-mb-md">
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
            @click="aplicarPresetPeriodo(preset.id)"
          />
        </div>
        <span class="text-caption muted tabular-nums">
          {{ alcanceTexto }} · Evaluables:
          <strong class="text-ink">{{ resumenMetricas.total_evaluables }}</strong>
        </span>
      </div>

      <div class="row q-col-gutter-sm items-center">
        <div class="col-12 col-sm-4 col-md-3">
          <q-input
            v-model="filtrosPeriodo.fecha_desde"
            type="date"
            outlined
            dense
            label="Desde"
            @update:model-value="presetActivo = 'custom'"
          />
        </div>
        <div class="col-12 col-sm-4 col-md-3">
          <q-input
            v-model="filtrosPeriodo.fecha_hasta"
            type="date"
            outlined
            dense
            label="Hasta"
            @update:model-value="presetActivo = 'custom'"
          />
        </div>
        <div class="col-12 col-sm-4 col-md-2">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="filter_alt"
            label="Aplicar"
            class="full-width"
            :loading="cargandoMetricas"
            @click="recargarDatos"
          />
        </div>
        <div class="col-12 col-md-4">
          <div class="relojes-resumen">
            <div class="reloj-item">
              <span class="reloj-item__label">SLA Asig.</span>
              <strong class="reloj-item__val text-primary tabular-nums">
                {{ resumenMetricas.pct_sla_asignacion }}%
              </strong>
              <span class="reloj-item__sub tabular-nums">
                {{ formatearMinutos(resumenMetricas.promedio_asignacion_minutos) }}
              </span>
            </div>
            <div class="reloj-item">
              <span class="reloj-item__label">SLA Resol.</span>
              <strong class="reloj-item__val text-positive tabular-nums">
                {{ resumenMetricas.pct_sla_resolucion }}%
              </strong>
              <span class="reloj-item__sub tabular-nums">
                {{ formatearMinutos(resumenMetricas.promedio_efectivo_minutos) }}
              </span>
            </div>
            <div class="reloj-item">
              <span class="reloj-item__label">Pausa Prom.</span>
              <strong class="reloj-item__val text-warning tabular-nums">
                {{ formatearMinutos(resumenMetricas.promedio_pausa_minutos) }}
              </strong>
              <span class="reloj-item__sub tabular-nums">
                Supl.: {{ resumenMetricas.gobernanza.total_suplencias }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Franja de 8 KPIs con color específico e inconfundible por cada estado -->
    <div class="kpi-strip q-mb-md">
      <div
        v-for="(kpi, idx) in tarjetasKpi"
        :key="kpi.id"
        class="kpi-box"
        :class="[kpi.claseColor, { 'kpi-box--active': kpiSeleccionadoIdx === idx }]"
        @click="alClickKpi(idx, kpi.estadoFiltro)"
      >
        <div class="row items-center justify-between no-wrap">
          <span class="kpi-box__label ellipsis">{{ kpi.titulo }}</span>
          <span class="kpi-box__dot" :style="{ backgroundColor: kpi.color }" />
        </div>
        <div class="row items-baseline justify-between q-mt-xs">
          <span class="kpi-box__val" :style="{ color: kpi.color }">{{ kpi.valor }}</span>
          <span class="kpi-box__pill" :class="kpi.clasePill">{{ kpi.subtitulo }}</span>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- ROL 1: TÉCNICO (Vista exclusiva de trabajo técnico personal)           -->
    <!-- ====================================================================== -->
    <template v-if="rol === 'TECNICO'">
      <div class="grid-two-cols">
        <!-- Panel Izquierdo: Mis Tickets por Prioridad SLA con colores por estado -->
        <div class="panel-card">
          <div class="panel-card__header row items-center justify-between">
            <span class="panel-card__title">
              MIS TICKETS POR PRIORIDAD SLA (ORDEN SUGERIDO DE ATENCIÓN)
            </span>
            <span class="panel-card__hint">{{ alcanceTexto }}</span>
          </div>

          <div v-if="$q.screen.lt.md" class="q-pa-sm q-gutter-y-sm">
            <div
              v-for="p in filasPrioridadTecnico"
              :key="p.prioridad"
              class="mobile-matriz-card cursor-pointer"
              @click="irABandejaConTexto(p.prioridad)"
            >
              <div class="row items-center justify-between q-mb-xs">
                <PrioridadBadge :prioridad="p.prioridad" />
                <strong class="text-ink tabular-nums">Total: {{ p.total }}</strong>
              </div>
              <div class="row q-gutter-xs text-caption tabular-nums">
                <span class="cell-pill" :class="p.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'">Asig: {{ p.asignados }}</span>
                <span class="cell-pill" :class="p.en_progreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'">Prog: {{ p.en_progreso }}</span>
                <span class="cell-pill" :class="p.en_espera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'">Esp: {{ p.en_espera }}</span>
                <span class="cell-pill" :class="p.por_verificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'">Verif: {{ p.por_verificar }}</span>
                <span class="cell-pill" :class="p.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'">Reab: {{ p.reabiertos }}</span>
                <span class="cell-pill" :class="p.cerrados > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'">Cerr: {{ p.cerrados }}</span>
              </div>
            </div>
          </div>

          <div v-else class="table-fixed-wrap">
            <table class="matriz-table matriz-table--tecnico">
              <thead>
                <tr>
                  <th style="width: 19%">Prioridad</th>
                  <th style="width: 10%" class="text-center" title="Asignados">Asig.</th>
                  <th style="width: 10%" class="text-center" title="En Progreso">Prog.</th>
                  <th style="width: 10%" class="text-center" title="En Espera">Esp.</th>
                  <th style="width: 10%" class="text-center" title="Por Verificar">Verif.</th>
                  <th style="width: 10%" class="text-center" title="Reabiertos">Reab.</th>
                  <th style="width: 10%" class="text-center" title="Cerrados">Cerr.</th>
                  <th style="width: 11%" class="text-center" title="No Resueltos">No Res.</th>
                  <th style="width: 10%" class="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in filasPrioridadTecnico"
                  :key="p.prioridad"
                  class="matriz-row"
                  @click="irABandejaConTexto(p.prioridad)"
                >
                  <td>
                    <PrioridadBadge :prioridad="p.prioridad" compacto />
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'">
                      {{ p.asignados }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.en_progreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'">
                      {{ p.en_progreso }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.en_espera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'">
                      {{ p.en_espera }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.por_verificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'">
                      {{ p.por_verificar }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'">
                      {{ p.reabiertos }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.cerrados > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'">
                      {{ p.cerrados }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="cell-pill" :class="p.no_resueltos > 0 ? 'cell-pill--no-resuelto' : 'cell-pill--zero'">
                      {{ p.no_resueltos }}
                    </span>
                  </td>
                  <td class="text-center font-bold text-ink tabular-nums">{{ p.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Panel Derecho: Mi Próxima Acción Técnica -->
        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm no-wrap">
            <span class="section-heading section-heading--teal">
              MI PRÓXIMA ACCIÓN TÉCNICA (COLA ACTIVA)
            </span>
            <span class="count-pill count-pill--teal">
              {{ misTicketsActivosTecnico.length }} en mi bandeja
            </span>
          </div>

          <div v-if="!misTicketsActivosTecnico.length" class="empty-row">
            No tienes tickets pendientes en tu cola activa en este momento.
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="t in misTicketsActivosTecnico.slice(0, 6)"
              :key="t.id"
              class="action-row"
            >
              <div class="action-row__info">
                <div class="row items-center q-gutter-x-xs">
                  <strong class="text-ink">{{ t.folio }}</strong>
                  <span class="chip" :class="ESTADO_CLASS[t.estado]">
                    <span class="chip__dot" />
                    {{ t.estado }}
                  </span>
                  <PrioridadBadge :prioridad="t.prioridad" compacto />
                </div>
                <div class="action-row__title q-mt-xs ellipsis">
                  {{ t.catalogo_incidencia }}
                </div>
                <div class="action-row__sub ellipsis">
                  {{ t.departamento_solicitante }} · {{ t.solicitante }} (Tel:
                  <strong class="text-ink">{{ t.solicitante_telefono }}</strong>)
                </div>
              </div>
              <button
                type="button"
                class="cta-btn"
                :class="
                  t.estado === 'En Progreso'
                    ? 'cta-btn--green'
                    : t.estado === 'En Espera'
                      ? 'cta-btn--amber'
                      : 'cta-btn--teal'
                "
                @click="abrirDetalleTicket(t)"
              >
                {{
                  t.estado === 'En Progreso'
                    ? 'Resolver / Pausar'
                    : t.estado === 'En Espera'
                      ? 'Reanudar'
                      : 'Iniciar Atención'
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ====================================================================== -->
    <!-- ROL 2: GERENTE DE ÁREA (Sub-Gerencia TI: su equipo y su bandeja)       -->
    <!-- ====================================================================== -->
    <template v-else-if="rol === 'GERENTE_AREA'">
      <div class="view-tabs-bar row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-x-xs flex-wrap">
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabGerenteArea === 'equipo' }"
            @click="tabGerenteArea = 'equipo'"
          >
            1. Carga y Estados por Técnico de mi Área
          </button>
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabGerenteArea === 'pendientes' }"
            @click="tabGerenteArea = 'pendientes'"
          >
            2. Pendientes de Asignar y Pausados en mi Área
          </button>
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabGerenteArea === 'pares' }"
            @click="tabGerenteArea = 'pares'"
          >
            3. Comparativa entre Pares
          </button>
        </div>
        <span class="role-hint gt-sm">{{ alcanceTexto }}</span>
      </div>

      <!-- Pestaña 1 Gerente de Área: Tabla de técnicos de su sub-gerencia por estado -->
      <div v-if="tabGerenteArea === 'equipo'" class="panel-card">
        <div class="panel-card__header row items-center justify-between q-gutter-xs">
          <span class="panel-card__title">
            DISTRIBUCIÓN DE TICKETS POR TÉCNICO DE MI SUB-GERENCIA
          </span>
          <span class="panel-card__hint">Clic en un técnico filtra la bandeja de área</span>
        </div>

        <div v-if="$q.screen.lt.md" class="q-pa-sm q-gutter-y-sm">
          <div
            v-for="t in resumenPlantilla"
            :key="t.id"
            class="mobile-matriz-card cursor-pointer"
            @click="irABandejaConTexto(t.nombre_completo)"
          >
            <div class="row items-start justify-between q-gutter-xs q-mb-xs">
              <div class="font-semibold text-ink">{{ t.nombre_completo }}</div>
              <span
                class="tech-badge shrink-0"
                :class="
                  t.estadoOperativo === 'EN_PROGRESO'
                    ? 'tech-badge--green'
                    : t.estadoOperativo === 'EN_COLA'
                      ? 'tech-badge--amber'
                      : 'tech-badge--blue'
                "
              >
                <span class="chip__dot" />
                {{
                  t.estadoOperativo === 'EN_PROGRESO'
                    ? 'Atendiendo'
                    : t.estadoOperativo === 'EN_COLA'
                      ? 'En cola'
                      : 'Disponible'
                }}
              </span>
            </div>
            <div class="text-caption muted q-mb-xs">
              {{
                t.ticketActual
                  ? `Atendiendo ${t.ticketActual.folio} (${t.ticketActual.departamento_solicitante})`
                  : 'Sin ticket En Progreso en este instante'
              }}
            </div>
            <div class="row q-gutter-xs text-caption tabular-nums">
              <span class="cell-pill" :class="t.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'">Asig: {{ t.asignados }}</span>
              <span class="cell-pill" :class="t.enProgreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'">Prog: {{ t.enProgreso }}</span>
              <span class="cell-pill" :class="t.enEspera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'">Esp: {{ t.enEspera }}</span>
              <span class="cell-pill" :class="t.porVerificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'">Verif: {{ t.porVerificar }}</span>
              <span class="cell-pill" :class="t.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'">Reab: {{ t.reabiertos }}</span>
              <span class="cell-pill" :class="t.cerradosSolo > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'">Cerr: {{ t.cerradosSolo }}</span>
            </div>
          </div>
        </div>

        <div v-else class="table-fixed-wrap">
          <table class="matriz-table">
            <thead>
              <tr>
                <th style="width: 28%">Técnico Especialista</th>
                <th style="width: 9%" class="text-center" title="Asignados">Asig.</th>
                <th style="width: 9%" class="text-center" title="En Progreso">Prog.</th>
                <th style="width: 9%" class="text-center" title="En Espera">Esp.</th>
                <th style="width: 9%" class="text-center" title="Por Verificar">Verif.</th>
                <th style="width: 9%" class="text-center" title="Reabiertos">Reab.</th>
                <th style="width: 9%" class="text-center" title="Cerrados">Cerr.</th>
                <th style="width: 18%" class="text-right">Estado en Vivo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in resumenPlantilla"
                :key="t.id"
                class="matriz-row"
                @click="irABandejaConTexto(t.nombre_completo)"
              >
                <td class="celda-wrap">
                  <div class="font-semibold text-ink">{{ t.nombre_completo }}</div>
                  <div class="text-caption muted">
                    {{
                      t.ticketActual
                        ? `Atendiendo ${t.ticketActual.folio} (${t.ticketActual.departamento_solicitante})`
                        : 'Sin ticket En Progreso en este instante'
                    }}
                  </div>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'">
                    {{ t.asignados }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.enProgreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'">
                    {{ t.enProgreso }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.enEspera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'">
                    {{ t.enEspera }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.porVerificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'">
                    {{ t.porVerificar }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'">
                    {{ t.reabiertos }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="cell-pill" :class="t.cerradosSolo > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'">
                    {{ t.cerradosSolo }}
                  </span>
                </td>
                <td class="text-right">
                  <span
                    class="tech-badge"
                    :class="
                      t.estadoOperativo === 'EN_PROGRESO'
                        ? 'tech-badge--green'
                        : t.estadoOperativo === 'EN_COLA'
                          ? 'tech-badge--amber'
                          : 'tech-badge--blue'
                    "
                  >
                    <span class="chip__dot" />
                    {{
                      t.estadoOperativo === 'EN_PROGRESO'
                        ? 'Atendiendo ahora'
                        : t.estadoOperativo === 'EN_COLA'
                          ? 'En cola'
                          : 'Disponible'
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pestaña 2 Gerente de Área: Sin asignar + En Espera de su sub-gerencia -->
      <div v-else-if="tabGerenteArea === 'pendientes'" class="grid-two-cols">
        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm no-wrap">
            <span class="section-heading section-heading--red">
              PENDIENTES DE ASIGNAR EN MI SUB-GERENCIA
            </span>
            <span class="count-pill count-pill--red">
              {{ ticketsPorAsignar.length }} sin técnico
            </span>
          </div>

          <div v-if="!ticketsPorAsignar.length" class="empty-row">
            Todos los tickets de tu sub-gerencia ya tienen técnico asignado.
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="item in ticketsPorAsignar.slice(0, 6)"
              :key="item.ticket.id"
              class="action-row"
            >
              <div class="action-row__info">
                <div class="action-row__title">
                  <strong>{{ item.ticket.folio }}</strong> ·
                  <span :class="item.vencido ? 'text-red' : 'text-amber'">
                    {{ item.ticket.prioridad }} (Meta {{ item.ticket.tiempo_max_asignacion_minutos }}m
                    · Lleva {{ item.minutosTranscurridos }}m)
                  </span>
                </div>
                <div class="action-row__sub ellipsis">
                  {{ item.ticket.catalogo_incidencia }} · Solicitante:
                  {{ item.ticket.departamento_solicitante }} ({{ item.ticket.solicitante }})
                </div>
              </div>
              <button
                type="button"
                class="cta-btn cta-btn--teal"
                @click="abrirDetalleTicket(item.ticket)"
              >
                Asignar Técnico
              </button>
            </div>
          </div>
        </div>

        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm no-wrap">
            <span class="section-heading section-heading--amber">
              TICKETS DE MI ÁREA EN PAUSA (EN ESPERA)
            </span>
            <span class="panel-card__hint">{{ ticketsEnEspera.length }} pausados</span>
          </div>

          <div v-if="!ticketsEnEspera.length" class="empty-row">
            No hay tickets detenidos en En Espera en tu sub-gerencia.
          </div>

          <div v-else class="q-gutter-y-xs">
            <div
              v-for="t in ticketsEnEspera.slice(0, 6)"
              :key="t.id"
              class="pause-row cursor-pointer"
              @click="abrirDetalleTicket(t)"
            >
              <div class="pause-row__text ellipsis">
                <strong>{{ t.folio }}</strong> · {{ t.catalogo_incidencia }} ({{
                  t.tecnico ?? 'Sin técnico'
                }})
              </div>
              <span class="pause-row__tag">
                {{ textoPausaReal(t) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pestaña 3 Gerente de Área: Comparativa de Tiempos entre Técnicos Pares -->
      <div v-else class="panel-card">
        <div class="panel-card__header row items-center justify-between q-gutter-xs">
          <span class="panel-card__title">
            COMPARATIVA DE TIEMPO EFECTIVO ENTRE TÉCNICOS PARES (POR SERVICIO)
          </span>
          <span class="panel-card__hint">Calculado desde reloj real en progreso</span>
        </div>

        <div v-if="!comparativaPares.length" class="q-pa-md">
          <div class="empty-row">
            Aún no hay suficientes casos con tiempo efectivo registrado para comparar técnicos pares en este período.
          </div>
        </div>

        <div v-else-if="$q.screen.lt.md" class="q-pa-sm q-gutter-y-sm">
          <div v-for="row in comparativaPares" :key="row.clave" class="mobile-matriz-card">
            <div class="font-semibold text-ink q-mb-xs">{{ row.catalogo_incidencia }}</div>
            <div class="text-caption muted q-mb-xs">
              {{ row.tecnico }} · {{ row.departamento }} ({{ row.casos }} {{ row.casos === 1 ? 'caso' : 'casos' }})
            </div>
            <div class="row items-center justify-between text-caption tabular-nums">
              <span>Téc.: <strong class="text-ink">{{ formatearMinutos(row.promTecnicoMin) }}</strong> · Área: <strong class="text-ink">{{ formatearMinutos(row.promAreaMin) }}</strong></span>
              <span class="chip" :class="row.claseDesvio">{{ row.etiquetaDesvio }}</span>
            </div>
          </div>
        </div>

        <div v-else class="table-fixed-wrap">
          <table class="matriz-table">
            <thead>
              <tr>
                <th style="width: 31%">Servicio del Catálogo</th>
                <th style="width: 19%">Técnico</th>
                <th style="width: 9%" class="text-center">Casos</th>
                <th style="width: 13%" class="text-center">Prom. Téc.</th>
                <th style="width: 13%" class="text-center">Prom. Área</th>
                <th style="width: 15%" class="text-right">Desvío</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparativaPares" :key="row.clave" class="matriz-row">
                <td class="celda-wrap font-medium text-ink">{{ row.catalogo_incidencia }}</td>
                <td class="celda-wrap text-ink">{{ row.tecnico }}</td>
                <td class="text-center tabular-nums">{{ row.casos }}</td>
                <td class="text-center font-semibold text-ink tabular-nums">{{ formatearMinutos(row.promTecnicoMin) }}</td>
                <td class="text-center muted tabular-nums">{{ formatearMinutos(row.promAreaMin) }}</td>
                <td class="text-right">
                  <span class="chip" :class="row.claseDesvio">{{ row.etiquetaDesvio }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ====================================================================== -->
    <!-- ROL 3 y 4: MESA TÉCNICA / ADMIN y DIRECTOR (Vista Global TI)           -->
    <!-- ====================================================================== -->
    <template v-else>
      <div class="view-tabs-bar row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-x-xs flex-wrap">
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabActiva === 'matriz' }"
            @click="tabActiva = 'matriz'"
          >
            1. Matriz por Gerencia TI
          </button>
          <button
            v-if="rol !== 'DIRECTOR'"
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabActiva === 'suplencia' }"
            @click="tabActiva = 'suplencia'"
          >
            2. Suplencia SLA y Cierre Tel.
          </button>
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabActiva === 'plantilla' }"
            @click="tabActiva = 'plantilla'"
          >
            {{ rol === 'DIRECTOR' ? '2. Plantilla Técnica en Vivo' : '3. Plantilla Técnica en Vivo' }}
          </button>
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabActiva === 'demanda' }"
            @click="tabActiva = 'demanda'"
          >
            {{
              rol === 'DIRECTOR'
                ? '3. Demanda y Pausas (En Espera)'
                : '4. Demanda y Pausas (En Espera)'
            }}
          </button>
          <button
            type="button"
            class="view-tab-btn"
            :class="{ 'view-tab-btn--active': tabActiva === 'pares' }"
            @click="tabActiva = 'pares'"
          >
            {{ rol === 'DIRECTOR' ? '4. Comparativa entre Pares' : '5. Comparativa entre Pares' }}
          </button>
        </div>
        <span class="role-hint gt-sm">{{ alcanceTexto }}</span>
      </div>

      <!-- VISTA 1: Matriz por Gerencia TI con colores específicos por cada estado -->
      <div v-if="tabActiva === 'matriz'" class="panel-card">
        <div class="panel-card__header row items-center justify-between q-gutter-xs">
          <span class="panel-card__title">
            DESGLOSE OPERATIVO POR SUB-GERENCIA DE TECNOLOGÍA
          </span>
          <span class="panel-card__hint">Clic en cualquier fila filtra la bandeja por área</span>
        </div>

        <div v-if="$q.screen.lt.md" class="q-pa-sm q-gutter-y-sm">
          <div
            v-for="r in filasMatrizGerencias"
            :key="r.id_departamento"
            class="mobile-matriz-card cursor-pointer"
            @click="irABandejaConTexto(r.nombre)"
          >
            <div class="row items-center justify-between q-gutter-xs q-mb-xs">
              <span class="font-semibold text-ink">{{ r.nombre }}</span>
              <span class="font-semibold text-teal tabular-nums">SLA {{ r.sla }}% · Total {{ r.total }}</span>
            </div>
            <div class="row q-gutter-xs text-caption tabular-nums">
              <span class="cell-pill" :class="r.abiertos > 0 ? 'cell-pill--abierto' : 'cell-pill--zero'">Abier: {{ r.abiertos }}</span>
              <span class="cell-pill" :class="r.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'">Asig: {{ r.asignados }}</span>
              <span class="cell-pill" :class="r.en_progreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'">Prog: {{ r.en_progreso }}</span>
              <span class="cell-pill" :class="r.en_espera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'">Esp: {{ r.en_espera }}</span>
              <span class="cell-pill" :class="r.por_verificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'">Verif: {{ r.por_verificar }}</span>
              <span class="cell-pill" :class="r.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'">Reab: {{ r.reabiertos }}</span>
              <span class="cell-pill" :class="r.cerrados > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'">Cerr: {{ r.cerrados }}</span>
            </div>
          </div>
        </div>

        <div v-else class="table-fixed-wrap">
          <table class="matriz-table matriz-table--global">
            <thead>
              <tr>
                <th style="width: 24%">Gerencia / Área TI</th>
                <th style="width: 7%" class="text-center" title="Abiertos">Abier.</th>
                <th style="width: 7%" class="text-center" title="Asignados">Asign.</th>
                <th style="width: 7%" class="text-center" title="En Progreso">Progr.</th>
                <th style="width: 7%" class="text-center" title="En Espera">Espera</th>
                <th style="width: 7%" class="text-center" title="Resuelto - Por Verificar">Verif.</th>
                <th style="width: 7%" class="text-center" title="Reabiertos">Reab.</th>
                <th style="width: 7%" class="text-center" title="Cerrados">Cerr.</th>
                <th style="width: 7%" class="text-center" title="No Resueltos">No Res.</th>
                <th style="width: 6%" class="text-center" title="Cancelados">Canc.</th>
                <th style="width: 6%" class="text-center">Total</th>
                <th style="width: 8%" class="text-right" title="Cumplimiento SLA real desde bitácora">SLA</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in filasMatrizGerencias"
                :key="r.id_departamento"
                class="matriz-row"
                @click="irABandejaConTexto(r.nombre)"
              >
                <td class="celda-wrap font-semibold text-ink">{{ r.nombre }}</td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.abiertos > 0 ? 'cell-pill--abierto' : 'cell-pill--zero'"
                  >
                    {{ r.abiertos }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.asignados > 0 ? 'cell-pill--asignado' : 'cell-pill--zero'"
                  >
                    {{ r.asignados }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.en_progreso > 0 ? 'cell-pill--progreso' : 'cell-pill--zero'"
                  >
                    {{ r.en_progreso }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.en_espera > 0 ? 'cell-pill--espera' : 'cell-pill--zero'"
                  >
                    {{ r.en_espera }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.por_verificar > 0 ? 'cell-pill--verificar' : 'cell-pill--zero'"
                  >
                    {{ r.por_verificar }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.reabiertos > 0 ? 'cell-pill--reabierto' : 'cell-pill--zero'"
                  >
                    {{ r.reabiertos }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.cerrados > 0 ? 'cell-pill--cerrado' : 'cell-pill--zero'"
                  >
                    {{ r.cerrados }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.no_resueltos > 0 ? 'cell-pill--no-resuelto' : 'cell-pill--zero'"
                  >
                    {{ r.no_resueltos }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="cell-pill"
                    :class="r.cancelados > 0 ? 'cell-pill--cancelado' : 'cell-pill--zero'"
                  >
                    {{ r.cancelados }}
                  </span>
                </td>
                <td class="text-center font-bold text-ink tabular-nums">{{ r.total }}</td>
                <td class="text-right font-semibold text-teal tabular-nums">{{ r.sla }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- VISTA 2: Suplencia SLA y Cierre Telefónico -->
      <div v-else-if="tabActiva === 'suplencia'" class="grid-two-cols">
        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm no-wrap">
            <span class="section-heading section-heading--red">
              SUPLENCIA DE ASIGNACIÓN (SLA VENCIDO)
            </span>
            <span class="count-pill count-pill--red">
              {{ ticketsPorAsignar.length }}
              {{
                ticketsPorAsignar.length === 1
                  ? 'caso requiere asignar'
                  : 'casos requieren asignar'
              }}
            </span>
          </div>

          <div v-if="!ticketsPorAsignar.length" class="empty-row">
            No hay tickets abiertos pendientes de asignación en este momento.
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="item in ticketsPorAsignar.slice(0, 6)"
              :key="item.ticket.id"
              class="action-row"
            >
              <div class="action-row__info">
                <div class="action-row__title">
                  <strong>{{ item.ticket.folio }}</strong> ·
                  <span :class="item.vencido ? 'text-red' : 'text-amber'">
                    {{ item.ticket.prioridad }} (Meta
                    {{ item.ticket.tiempo_max_asignacion_minutos }}m · Lleva
                    {{ item.minutosTranscurridos }}m)
                  </span>
                </div>
                <div class="action-row__sub ellipsis">
                  Área: {{ item.ticket.departamento }} · Solicitante:
                  {{ item.ticket.departamento_solicitante }} ({{ item.ticket.solicitante }})
                </div>
              </div>
              <button
                type="button"
                class="cta-btn cta-btn--teal"
                @click="abrirDetalleTicket(item.ticket)"
              >
                Asignar Suplente
              </button>
            </div>
          </div>
        </div>

        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm no-wrap">
            <span class="section-heading section-heading--green">
              LISTOS PARA VERIFICACIÓN Y CIERRE TELEFÓNICO
            </span>
            <span class="count-pill count-pill--green">
              {{ ticketsPorVerificar.length }} por llamar
            </span>
          </div>

          <div v-if="!ticketsPorVerificar.length" class="empty-row">
            No hay tickets en estado Resuelto - Por Verificar pendientes de llamada.
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="t in ticketsPorVerificar.slice(0, 6)"
              :key="t.id"
              class="action-row"
            >
              <div class="action-row__info">
                <div class="action-row__title">
                  <strong>{{ t.folio }}</strong> · {{ t.departamento_solicitante }} ({{
                    t.solicitante
                  }})
                </div>
                <div class="action-row__sub ellipsis">
                  Tel: <strong class="text-ink">{{ t.solicitante_telefono }}</strong> · Resuelto
                  por: {{ t.tecnico ?? 'Mesa Técnica' }}
                </div>
              </div>
              <button
                type="button"
                class="cta-btn cta-btn--green"
                @click="abrirDetalleTicket(t)"
              >
                Verificar / Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA 3: Plantilla Técnica en Vivo -->
      <div v-else-if="tabActiva === 'plantilla'" class="panel-card q-pa-md">
        <div class="row items-center justify-between q-mb-sm q-gutter-y-xs">
          <span class="panel-card__title">
            ESTADO EN TIEMPO REAL DE TÉCNICOS (CONTROL DE JORNADA Y BALANCEO)
          </span>
          <div class="row items-center q-gutter-x-md text-caption">
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--st-progreso)" />
              En Progreso (Activo)
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--st-espera)" />
              Solo en Cola
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--st-asignado)" />
              Disponible (0 activos)
            </span>
          </div>
        </div>

        <div v-if="!resumenPlantilla.length" class="empty-row">
          No se encontraron técnicos registrados para este alcance.
        </div>

        <div v-else class="q-gutter-y-xs">
          <div
            v-for="t in resumenPlantilla"
            :key="t.id"
            class="tech-row"
          >
            <div class="tech-row__left">
              <div class="tech-row__name">
                <strong>{{ t.nombre_completo }}</strong>
                <span class="muted"> · {{ t.departamento }}</span>
              </div>
              <div
                v-if="t.ticketActual"
                class="tech-row__desc cursor-pointer"
                @click="abrirDetalleTicket(t.ticketActual)"
              >
                {{ t.ticketActual.folio }} · {{ t.ticketActual.catalogo_incidencia }} —
                {{ t.ticketActual.departamento_solicitante }}
                <span v-if="t.horaInicioTexto"> (desde {{ t.horaInicioTexto }})</span>
              </div>
              <div v-else class="tech-row__desc">
                {{
                  t.enCola > 0
                    ? `Sin ticket En Progreso (${t.enCola} Asignado/En Espera pendiente de iniciar)`
                    : 'Disponible · 0 tickets activos en este momento (Candidato ideal)'
                }}
              </div>
            </div>

            <div class="tech-row__right">
              <span class="tech-row__stats">
                Cola: <strong>{{ t.enCola }}</strong> · Cerrados:
                <strong>{{ t.cerrados }}</strong>
              </span>
              <span
                class="tech-badge"
                :class="
                  t.estadoOperativo === 'EN_PROGRESO'
                    ? 'tech-badge--green'
                    : t.estadoOperativo === 'EN_COLA'
                      ? 'tech-badge--amber'
                      : 'tech-badge--blue'
                "
              >
                <span class="chip__dot" />
                {{
                  t.estadoOperativo === 'EN_PROGRESO'
                    ? 'Atendiendo ahora'
                    : t.estadoOperativo === 'EN_COLA'
                      ? 'Sin iniciar atención'
                      : 'Disponible para asignar'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA 4: Demanda por Departamento Solicitante y Tickets en Pausa -->
      <div v-else-if="tabActiva === 'demanda'" class="grid-two-cols">
        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <span class="panel-card__title">TOP DEPARTAMENTOS SOLICITANTES</span>
            <span class="panel-card__hint">% Demanda TI</span>
          </div>

          <div v-if="!rankingDepartamentosSolicitantes.length" class="empty-row">
            Sin datos de demanda por departamento solicitante.
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="(dep, idx) in rankingDepartamentosSolicitantes"
              :key="dep.nombre"
              class="demand-item cursor-pointer"
              @click="irABandejaConTexto(dep.nombre)"
            >
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="font-semibold text-ink">{{ idx + 1 }}. {{ dep.nombre }}</span>
                <span class="muted">
                  {{ dep.cantidad }} {{ dep.cantidad === 1 ? 'ticket' : 'tickets' }} ({{
                    dep.porcentaje
                  }}%)
                </span>
              </div>
              <div class="demand-bar-track">
                <div
                  class="demand-bar-fill"
                  :style="{
                    width: `${Math.max(4, dep.porcentaje)}%`,
                    backgroundColor: colorBarraDemanda(idx),
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="panel-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <span class="section-heading section-heading--amber">
              TICKETS EN PAUSA (RELOJ TÉCNICO DETENIDO)
            </span>
            <span class="panel-card__hint">{{ ticketsEnEspera.length }} en espera</span>
          </div>

          <div v-if="!ticketsEnEspera.length" class="empty-row">
            No hay tickets detenidos en estado En Espera.
          </div>

          <div v-else class="q-gutter-y-xs">
            <div
              v-for="t in ticketsEnEspera.slice(0, 6)"
              :key="t.id"
              class="pause-row cursor-pointer"
              @click="abrirDetalleTicket(t)"
            >
              <div class="pause-row__text ellipsis">
                <strong>{{ t.folio }}</strong> · {{ t.catalogo_incidencia }} ({{
                  t.departamento_solicitante
                }})
              </div>
              <span class="pause-row__tag">
                {{ t.departamento }} · {{ textoPausaReal(t) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA 5: Comparativa de Tiempos entre Técnicos Pares -->
      <div v-else class="panel-card">
        <div class="panel-card__header row items-center justify-between q-gutter-xs">
          <span class="panel-card__title">
            COMPARATIVA DE TIEMPO EFECTIVO ENTRE TÉCNICOS PARES (POR SERVICIO Y ÁREA TI)
          </span>
          <span class="panel-card__hint">Calculado desde reloj real en progreso</span>
        </div>

        <div v-if="!comparativaPares.length" class="q-pa-md">
          <div class="empty-row">
            Aún no hay suficientes casos con tiempo efectivo registrado para comparar técnicos pares en este período.
          </div>
        </div>

        <div v-else-if="$q.screen.lt.md" class="q-pa-sm q-gutter-y-sm">
          <div v-for="row in comparativaPares" :key="row.clave" class="mobile-matriz-card">
            <div class="font-semibold text-ink q-mb-xs">{{ row.catalogo_incidencia }}</div>
            <div class="text-caption muted q-mb-xs">
              {{ row.tecnico }} · {{ row.departamento }} ({{ row.casos }} {{ row.casos === 1 ? 'caso' : 'casos' }})
            </div>
            <div class="row items-center justify-between text-caption tabular-nums">
              <span>Téc.: <strong class="text-ink">{{ formatearMinutos(row.promTecnicoMin) }}</strong> · Área: <strong class="text-ink">{{ formatearMinutos(row.promAreaMin) }}</strong></span>
              <span class="chip" :class="row.claseDesvio">{{ row.etiquetaDesvio }}</span>
            </div>
          </div>
        </div>

        <div v-else class="table-fixed-wrap">
          <table class="matriz-table">
            <thead>
              <tr>
                <th style="width: 28%">Servicio del Catálogo</th>
                <th style="width: 18%">Sub-Gerencia TI</th>
                <th style="width: 16%">Técnico</th>
                <th style="width: 7%" class="text-center">Casos</th>
                <th style="width: 10%" class="text-center">Prom. Téc.</th>
                <th style="width: 10%" class="text-center">Prom. Área</th>
                <th style="width: 11%" class="text-right">Desvío</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparativaPares" :key="row.clave" class="matriz-row">
                <td class="celda-wrap font-medium text-ink">{{ row.catalogo_incidencia }}</td>
                <td class="celda-wrap muted">{{ row.departamento }}</td>
                <td class="celda-wrap text-ink">{{ row.tecnico }}</td>
                <td class="text-center tabular-nums">{{ row.casos }}</td>
                <td class="text-center font-semibold text-ink tabular-nums">{{ formatearMinutos(row.promTecnicoMin) }}</td>
                <td class="text-center muted tabular-nums">{{ formatearMinutos(row.promAreaMin) }}</td>
                <td class="text-right">
                  <span class="chip" :class="row.claseDesvio">{{ row.etiquetaDesvio }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal de detalle para operar tickets directo desde el Dashboard -->
    <TicketDetalleDialog
      v-model="dialogoAbierto"
      :ticket="ticketSeleccionado"
      @actualizado="recargarDatos"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import TicketDetalleDialog from '@/components/tickets/TicketDetalleDialog.vue';
import { ESTADO_CLASS } from '@/composables/useTickets';
import type {
  EstadoTicket,
  MetricaTicketReal,
  MetricasResumenOperativo,
  Ticket,
} from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useConfiguracionesStore } from '@/stores/useConfiguracionesStore';
import { esDepartamentoTI, useDepartmentsStore } from '@/stores/useDepartmentsStore';
import { ESTADOS_ACTIVOS_TECNICO, useTicketStore } from '@/stores/ticketStore';
import { formatearHora12 } from '@/utils/formatFecha';

type PresetPeriodo = 'todo' | 'mes' | '30d' | '60d' | '90d' | 'custom';

const PRESETS_PERIODO: ReadonlyArray<{ id: Exclude<PresetPeriodo, 'custom'>; label: string }> = [
  { id: 'todo', label: 'Todo' },
  { id: 'mes', label: 'Mes actual' },
  { id: '30d', label: '30 días' },
  { id: '60d', label: '60 días' },
  { id: '90d', label: '90 días' },
];

const RESUMEN_METRICAS_VACIO: MetricasResumenOperativo = {
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

interface FilaComparativaPar {
  clave: string;
  catalogo_incidencia: string;
  departamento: string;
  tecnico: string;
  casos: number;
  promTecnicoMin: number;
  promAreaMin: number;
  etiquetaDesvio: string;
  claseDesvio: 'ok' | 'info' | 'warn' | 'bad';
}

interface TarjetaKpi {
  id: string;
  titulo: string;
  valor: number;
  subtitulo: string;
  color: string;
  claseColor: string;
  clasePill: string;
  estadoFiltro?: EstadoTicket;
}

interface FilaMatrizGerencia {
  id_departamento: number;
  nombre: string;
  abiertos: number;
  asignados: number;
  en_progreso: number;
  en_espera: number;
  por_verificar: number;
  reabiertos: number;
  cerrados: number;
  no_resueltos: number;
  cancelados: number;
  total: number;
  sla: number;
}

interface FilaPrioridadTecnico {
  prioridad: string;
  asignados: number;
  en_progreso: number;
  en_espera: number;
  por_verificar: number;
  reabiertos: number;
  cerrados: number;
  no_resueltos: number;
  total: number;
}

interface ItemPlantillaTecnico {
  id: number;
  nombre_completo: string;
  departamento: string;
  ticketActual: Ticket | null;
  horaInicioTexto: string | null;
  asignados: number;
  enProgreso: number;
  enEspera: number;
  porVerificar: number;
  reabiertos: number;
  cerradosSolo: number;
  enCola: number;
  activosTotal: number;
  cerrados: number;
  estadoOperativo: 'EN_PROGRESO' | 'EN_COLA' | 'DISPONIBLE';
}

const BAR_COLORS = ['#065F46', '#0F766E', '#B45309', '#51655C'];
const ORDEN_PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const configuracionesStore = useConfiguracionesStore();
const ticketStore = useTicketStore();
const departmentsStore = useDepartmentsStore();

const tabActiva = ref<'matriz' | 'suplencia' | 'plantilla' | 'demanda' | 'pares'>('matriz');
const tabGerenteArea = ref<'equipo' | 'pendientes' | 'pares'>('equipo');
const kpiSeleccionadoIdx = ref(0);
const ticketSeleccionado = ref<Ticket | null>(null);
const dialogoAbierto = ref(false);

const presetActivo = ref<PresetPeriodo>('todo');
const cargandoMetricas = ref(false);
const resumenMetricas = ref<MetricasResumenOperativo>(RESUMEN_METRICAS_VACIO);
const ticketsMetricas = ref<MetricaTicketReal[]>([]);
const filtrosPeriodo = reactive<{ fecha_desde: string; fecha_hasta: string }>({
  fecha_desde: '',
  fecha_hasta: '',
});

const metricaPorTicketId = computed<Map<number, MetricaTicketReal>>(() => {
  const mapa = new Map<number, MetricaTicketReal>();
  for (const m of ticketsMetricas.value) {
    mapa.set(m.id, m);
  }
  return mapa;
});

function formatoFechaInput(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function aplicarPresetPeriodo(preset: Exclude<PresetPeriodo, 'custom'>): void {
  presetActivo.value = preset;
  const hoy = new Date();
  if (preset === 'todo') {
    filtrosPeriodo.fecha_desde = '';
    filtrosPeriodo.fecha_hasta = '';
  } else if (preset === 'mes') {
    filtrosPeriodo.fecha_desde = formatoFechaInput(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    filtrosPeriodo.fecha_hasta = formatoFechaInput(hoy);
  } else {
    const dias = preset === '30d' ? 30 : preset === '60d' ? 60 : 90;
    filtrosPeriodo.fecha_desde = formatoFechaInput(new Date(hoy.getTime() - dias * 86400000));
    filtrosPeriodo.fecha_hasta = formatoFechaInput(hoy);
  }
  void recargarDatos();
}

function formatearMinutos(minutos: number): string {
  const valor = Number(minutos ?? 0);
  if (valor < 60) return `${Math.round(valor)} min`;
  const horas = Math.floor(valor / 60);
  const resto = Math.round(valor % 60);
  return resto > 0 ? `${horas}h ${resto}m` : `${horas}h`;
}

const rol = computed(() => authStore.role);
const cargando = computed(() => ticketStore.cargando);
const errorCarga = computed(() => ticketStore.errorCarga);

const puedeCrearTicket = computed(
  () => rol.value === 'ADMINISTRADOR' || rol.value === 'MESA_TECNICA',
);

const tituloDashboard = computed(() => {
  switch (rol.value) {
    case 'MESA_TECNICA':
      return 'Tablero Operativo — Mesa Técnica';
    case 'DIRECTOR':
      return 'Tablero Ejecutivo 360° — Dirección TI';
    case 'GERENTE_AREA':
      return 'Tablero de Sub-Gerencia TI';
    case 'TECNICO':
      return 'Mi Tablero Técnico Personal';
    default:
      return 'Tablero Principal de Operaciones TI';
  }
});

const alcanceTexto = computed(() => {
  switch (rol.value) {
    case 'MESA_TECNICA':
    case 'ADMINISTRADOR':
    case 'DIRECTOR':
      return 'Alcance: Global TI';
    case 'GERENTE_AREA': {
      const dptoNombre = departmentsStore.departments.find(
        (d) => d.id === authStore.usuario?.id_departamento,
      )?.nombre;
      return `Alcance: ${dptoNombre ?? 'Mi Sub-Gerencia'}`;
    }
    case 'TECNICO':
      return `Alcance: Cola Personal (${authStore.usuario?.nombre ?? 'Técnico'})`;
    default:
      return 'Alcance: Mis Solicitudes';
  }
});

const rutaBandejaRol = computed(() => {
  switch (rol.value) {
    case 'GERENTE_AREA':
      return '/gerencia/bandeja';
    case 'TECNICO':
      return '/tecnico/mis-tickets';
    case 'USUARIO':
      return '/usuario/mis-solicitudes';
    default:
      return '/tickets/recepcion';
  }
});

const etiquetaBotonBandeja = computed(() => {
  switch (rol.value) {
    case 'GERENTE_AREA':
      return 'Bandeja de Área';
    case 'TECNICO':
      return 'Mi Cola de Trabajo';
    default:
      return 'Recepción Global';
  }
});

const hintRolActual = computed(() => {
  switch (rol.value) {
    case 'MESA_TECNICA':
    case 'ADMINISTRADOR':
      return 'Punto Único (SPOC): recepción, suplencia SLA y cierre telefónico';
    case 'DIRECTOR':
      return 'Visión 360° de todas las Sub-Gerencias TI, SLAs y demanda corporativa';
    case 'GERENTE_AREA':
      return 'Sub-Gerencia TI: balanceo de técnicos especialistas y control de pausas de tu área';
    case 'TECNICO':
      return 'Mi Cola Personal: atención por orden de prioridad SLA y registro del 100% de tu jornada';
    default:
      return 'Seguimiento de solicitudes';
  }
});

/**
 * Si se usa el SIMULADOR ROL en sesión de Administrador, acota los tickets al rol simulado
 * para que la vista de Técnico o Gerente de Área refleje su alcance real.
 */
const tickets = computed<Ticket[]>(() => {
  const todos = ticketStore.tickets;
  if (rol.value === 'TECNICO') {
    const idSesion = Number(authStore.usuario?.id ?? 0);
    const propios = todos.filter((t) => Number(t.id_tecnico) === idSesion);
    // Si está usando el simulador con cuenta Admin (que no es técnico), muestra los asignados a técnicos
    return propios.length > 0 ? propios : todos.filter((t) => t.id_tecnico !== null);
  }
  if (rol.value === 'GERENTE_AREA' && authStore.usuario?.id_departamento !== undefined) {
    const delArea = todos.filter(
      (t) => Number(t.id_departamento) === Number(authStore.usuario?.id_departamento),
    );
    return delArea.length > 0 ? delArea : todos;
  }
  return todos;
});

function contarPorEstado(estado: EstadoTicket): number {
  return tickets.value.filter((t) => t.estado === estado).length;
}

const tasaReaperturaPct = computed<number>(() => {
  if (resumenMetricas.value.total_evaluables > 0) {
    return resumenMetricas.value.gobernanza.tasa_reapertura_pct;
  }
  const evaluables = tickets.value.filter((t) =>
    ['Resuelto - Por Verificar', 'Cerrado', 'Reabierto'].includes(t.estado),
  ).length;
  if (evaluables === 0) return 0;
  return (contarPorEstado('Reabierto') / evaluables) * 100;
});

const metaMaxReaperturaPct = computed(() => configuracionesStore.metaMaxReaperturaPct);

const textoCalidadBadge = computed(() => {
  const pct = tasaReaperturaPct.value.toFixed(1);
  const meta = metaMaxReaperturaPct.value;
  if (rol.value === 'TECNICO') {
    return `Mi Calidad: ${contarPorEstado('Reabierto')} reaperturas (${pct}%)`;
  }
  if (rol.value === 'GERENTE_AREA') {
    return `Reaperturas Área: ${pct}% (Meta < ${meta}%)`;
  }
  return `Reaperturas Global: ${pct}% (Meta < ${meta}%)`;
});

const tarjetasKpi = computed<TarjetaKpi[]>(() => [
  {
    id: 'total',
    titulo:
      rol.value === 'GERENTE_AREA'
        ? 'Total Área'
        : rol.value === 'TECNICO'
          ? 'Mi Total'
          : 'Generados',
    valor: tickets.value.length,
    subtitulo: 'Todos',
    color: 'var(--st-total)',
    claseColor: 'kpi-box--total',
    clasePill: 'cell-pill--total',
  },
  {
    id: 'abiertos',
    titulo: 'Abiertos',
    valor: contarPorEstado('Abierto'),
    subtitulo: 'Sin asignar',
    color: 'var(--st-abierto)',
    claseColor: 'kpi-box--abierto',
    clasePill: 'cell-pill--abierto',
    estadoFiltro: 'Abierto',
  },
  {
    id: 'asignados',
    titulo: 'Asignados',
    valor: contarPorEstado('Asignado'),
    subtitulo: 'En cola téc.',
    color: 'var(--st-asignado)',
    claseColor: 'kpi-box--asignado',
    clasePill: 'cell-pill--asignado',
    estadoFiltro: 'Asignado',
  },
  {
    id: 'progreso',
    titulo: 'En Progreso',
    valor: contarPorEstado('En Progreso'),
    subtitulo: 'Atendiendo',
    color: 'var(--st-progreso)',
    claseColor: 'kpi-box--progreso',
    clasePill: 'cell-pill--progreso',
    estadoFiltro: 'En Progreso',
  },
  {
    id: 'espera',
    titulo: 'En Espera',
    valor: contarPorEstado('En Espera'),
    subtitulo: 'Pausados',
    color: 'var(--st-espera)',
    claseColor: 'kpi-box--espera',
    clasePill: 'cell-pill--espera',
    estadoFiltro: 'En Espera',
  },
  {
    id: 'verificar',
    titulo: 'Por Verificar',
    valor: contarPorEstado('Resuelto - Por Verificar'),
    subtitulo: 'Validar cierre',
    color: 'var(--st-verificar)',
    claseColor: 'kpi-box--verificar',
    clasePill: 'cell-pill--verificar',
    estadoFiltro: 'Resuelto - Por Verificar',
  },
  {
    id: 'reabiertos',
    titulo: 'Reabiertos',
    valor: contarPorEstado('Reabierto'),
    subtitulo: 'Reincidencia',
    color: 'var(--st-reabierto)',
    claseColor: 'kpi-box--reabierto',
    clasePill: 'cell-pill--reabierto',
    estadoFiltro: 'Reabierto',
  },
  {
    id: 'cerrados',
    titulo: 'Cerrados',
    valor: contarPorEstado('Cerrado'),
    subtitulo: 'Resueltos',
    color: 'var(--st-cerrado)',
    claseColor: 'kpi-box--cerrado',
    clasePill: 'cell-pill--cerrado',
    estadoFiltro: 'Cerrado',
  },
  {
    id: 'no-resueltos',
    titulo: 'No Resueltos',
    valor: contarPorEstado('No Resuelto'),
    subtitulo: 'Sin solución',
    color: 'var(--st-no-resuelto)',
    claseColor: 'kpi-box--no-resuelto',
    clasePill: 'cell-pill--no-resuelto',
    estadoFiltro: 'No Resuelto',
  },
  {
    id: 'cancelados',
    titulo: 'Cancelados',
    valor: contarPorEstado('Cancelado'),
    subtitulo: 'Error / Dup.',
    color: 'var(--st-cancelado)',
    claseColor: 'kpi-box--cancelado',
    clasePill: 'cell-pill--cancelado',
    estadoFiltro: 'Cancelado',
  },
]);

const filasMatrizGerencias = computed<FilaMatrizGerencia[]>(() => {
  const mapa = new Map<
    number,
    Omit<FilaMatrizGerencia, 'sla'> & { dentroSla: number; evaluablesSla: number }
  >();

  for (const d of departmentsStore.departments) {
    if (!d.is_activo || !esDepartamentoTI(d)) continue;
    mapa.set(d.id, {
      id_departamento: d.id,
      nombre: d.nombre,
      abiertos: 0,
      asignados: 0,
      en_progreso: 0,
      en_espera: 0,
      por_verificar: 0,
      reabiertos: 0,
      cerrados: 0,
      no_resueltos: 0,
      cancelados: 0,
      total: 0,
      dentroSla: 0,
      evaluablesSla: 0,
    });
  }

  const ahora = Date.now();
  for (const t of tickets.value) {
    let fila = mapa.get(t.id_departamento);
    if (!fila) {
      fila = {
        id_departamento: t.id_departamento,
        nombre: t.departamento,
        abiertos: 0,
        asignados: 0,
        en_progreso: 0,
        en_espera: 0,
        por_verificar: 0,
        reabiertos: 0,
        cerrados: 0,
        no_resueltos: 0,
        cancelados: 0,
        total: 0,
        dentroSla: 0,
        evaluablesSla: 0,
      };
      mapa.set(t.id_departamento, fila);
    }

    fila.total += 1;
    if (t.estado === 'Abierto') fila.abiertos += 1;
    else if (t.estado === 'Asignado') fila.asignados += 1;
    else if (t.estado === 'En Progreso') fila.en_progreso += 1;
    else if (t.estado === 'En Espera') fila.en_espera += 1;
    else if (t.estado === 'Resuelto - Por Verificar') fila.por_verificar += 1;
    else if (t.estado === 'Reabierto') fila.reabiertos += 1;
    else if (t.estado === 'Cerrado') fila.cerrados += 1;
    else if (t.estado === 'No Resuelto') fila.no_resueltos += 1;
    else if (t.estado === 'Cancelado') fila.cancelados += 1;

    if (t.estado !== 'Cancelado') {
      fila.evaluablesSla += 1;
      const finAsignacion = t.fecha_asignacion ? new Date(t.fecha_asignacion).getTime() : ahora;
      const min = Math.max(0, (finAsignacion - new Date(t.fecha_creacion).getTime()) / 60000);
      if (min <= (t.tiempo_max_asignacion_minutos || 240)) {
        fila.dentroSla += 1;
      }
    }
  }

  const slaRealPorDepto = new Map<number, number>();
  for (const depMet of resumenMetricas.value.por_departamento) {
    slaRealPorDepto.set(depMet.id_departamento, depMet.pct_sla_resolucion);
  }

  return Array.from(mapa.values())
    .map(({ dentroSla, evaluablesSla, ...f }) => ({
      ...f,
      sla:
        slaRealPorDepto.get(f.id_departamento) ??
        (evaluablesSla > 0 ? Math.round((dentroSla / evaluablesSla) * 100) : 100),
    }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
});

const filasPrioridadTecnico = computed<FilaPrioridadTecnico[]>(() => {
  const mapa = new Map<string, FilaPrioridadTecnico>();
  for (const nombrePrio of ORDEN_PRIORIDADES) {
    mapa.set(nombrePrio, {
      prioridad: nombrePrio,
      asignados: 0,
      en_progreso: 0,
      en_espera: 0,
      por_verificar: 0,
      reabiertos: 0,
      cerrados: 0,
      no_resueltos: 0,
      total: 0,
    });
  }

  for (const t of tickets.value) {
    if (t.estado === 'Cancelado') continue;

    const clave =
      ORDEN_PRIORIDADES.find((p) => p.toLowerCase() === t.prioridad.trim().toLowerCase()) ??
      t.prioridad;
    let fila = mapa.get(clave);
    if (!fila) {
      fila = {
        prioridad: clave,
        asignados: 0,
        en_progreso: 0,
        en_espera: 0,
        por_verificar: 0,
        reabiertos: 0,
        cerrados: 0,
        no_resueltos: 0,
        total: 0,
      };
      mapa.set(clave, fila);
    }

    fila.total += 1;
    if (t.estado === 'Asignado') fila.asignados += 1;
    else if (t.estado === 'En Progreso') fila.en_progreso += 1;
    else if (t.estado === 'En Espera') fila.en_espera += 1;
    else if (t.estado === 'Resuelto - Por Verificar') fila.por_verificar += 1;
    else if (t.estado === 'Reabierto') fila.reabiertos += 1;
    else if (t.estado === 'Cerrado') fila.cerrados += 1;
    else if (t.estado === 'No Resuelto') fila.no_resueltos += 1;
  }

  return Array.from(mapa.values());
});

const misTicketsActivosTecnico = computed<Ticket[]>(() =>
  tickets.value.filter((t) => ESTADOS_ACTIVOS_TECNICO.includes(t.estado)),
);

const ticketsPorAsignar = computed(() => {
  const ahora = Date.now();
  return tickets.value
    .filter((t) => t.estado === 'Abierto')
    .map((ticket) => {
      const minutosTranscurridos = Math.max(
        0,
        Math.round((ahora - new Date(ticket.fecha_creacion).getTime()) / 60000),
      );
      const vencido = minutosTranscurridos > (ticket.tiempo_max_asignacion_minutos || 60);
      return { ticket, minutosTranscurridos, vencido };
    })
    .sort(
      (a, b) =>
        Number(b.vencido) - Number(a.vencido) || b.minutosTranscurridos - a.minutosTranscurridos,
    );
});

const ticketsPorVerificar = computed(() =>
  tickets.value.filter((t) => t.estado === 'Resuelto - Por Verificar'),
);

const ticketsEnEspera = computed(() =>
  tickets.value.filter((t) => t.estado === 'En Espera'),
);

const resumenPlantilla = computed<ItemPlantillaTecnico[]>(() => {
  const mapaTecnicos = new Map<
    number,
    { id: number; nombre_completo: string; departamento: string }
  >();

  for (const tec of ticketStore.tecnicosDisponibles) {
    mapaTecnicos.set(tec.id, {
      id: tec.id,
      nombre_completo: tec.nombre_completo,
      departamento: tec.departamento,
    });
  }

  for (const t of tickets.value) {
    if (t.id_tecnico && t.tecnico && !mapaTecnicos.has(t.id_tecnico)) {
      mapaTecnicos.set(t.id_tecnico, {
        id: t.id_tecnico,
        nombre_completo: t.tecnico,
        departamento: t.departamento,
      });
    }
  }

  return Array.from(mapaTecnicos.values())
    .map((tec) => {
      const delTecnico = tickets.value.filter((t) => t.id_tecnico === tec.id);
      const ticketActual = delTecnico.find((t) => t.estado === 'En Progreso') ?? null;
      const horaInicioTexto = ticketActual?.fecha_inicio_atencion
        ? formatearHora12(ticketActual.fecha_inicio_atencion)
        : null;

      const asignados = delTecnico.filter((t) => t.estado === 'Asignado').length;
      const enProgreso = delTecnico.filter((t) => t.estado === 'En Progreso').length;
      const enEspera = delTecnico.filter((t) => t.estado === 'En Espera').length;
      const porVerificar = delTecnico.filter((t) => t.estado === 'Resuelto - Por Verificar').length;
      const reabiertos = delTecnico.filter((t) => t.estado === 'Reabierto').length;
      const cerradosSolo = delTecnico.filter((t) => t.estado === 'Cerrado').length;

      const activosTotal = delTecnico.filter((t) =>
        ESTADOS_ACTIVOS_TECNICO.includes(t.estado),
      ).length;
      const enCola = asignados + enEspera + reabiertos;
      const cerrados = porVerificar + cerradosSolo;

      const estadoOperativo: ItemPlantillaTecnico['estadoOperativo'] = ticketActual
        ? 'EN_PROGRESO'
        : activosTotal > 0
          ? 'EN_COLA'
          : 'DISPONIBLE';

      return {
        id: tec.id,
        nombre_completo: tec.nombre_completo,
        departamento: tec.departamento,
        ticketActual,
        horaInicioTexto,
        asignados,
        enProgreso,
        enEspera,
        porVerificar,
        reabiertos,
        cerradosSolo,
        enCola,
        activosTotal,
        cerrados,
        estadoOperativo,
      };
    })
    .sort(
      (a, b) =>
        b.activosTotal - a.activosTotal || a.nombre_completo.localeCompare(b.nombre_completo),
    );
});

const rankingDepartamentosSolicitantes = computed(() => {
  const total = tickets.value.length;
  if (total === 0) return [];

  const conteos = new Map<string, number>();
  for (const t of tickets.value) {
    const nombre = t.departamento_solicitante || 'Sin departamento';
    conteos.set(nombre, (conteos.get(nombre) ?? 0) + 1);
  }

  return Array.from(conteos.entries())
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Number(((cantidad / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
});

// 🛡️ [FASE 3.6 - DASHBOARD] Comparativa de tiempo efectivo real entre técnicos pares por servicio del catálogo
const comparativaPares = computed<FilaComparativaPar[]>(() => {
  const evaluables = ticketsMetricas.value.filter(
    (m) =>
      m.estado !== 'Cancelado' &&
      m.id_tecnico !== null &&
      m.tecnico &&
      Number(m.tiempo_efectivo_minutos ?? 0) > 0,
  );
  if (!evaluables.length) return [];

  const areaServicio = new Map<string, { suma: number; count: number }>();
  const tecServicio = new Map<
    string,
    {
      catalogo_incidencia: string;
      departamento: string;
      tecnico: string;
      suma: number;
      count: number;
      claveArea: string;
    }
  >();

  for (const m of evaluables) {
    const claveArea = `${m.id_departamento}__${m.id_catalogo}`;
    const ef = Number(m.tiempo_efectivo_minutos);
    const prevArea = areaServicio.get(claveArea) ?? { suma: 0, count: 0 };
    areaServicio.set(claveArea, { suma: prevArea.suma + ef, count: prevArea.count + 1 });

    const claveTec = `${claveArea}__${m.id_tecnico}`;
    const prevTec = tecServicio.get(claveTec);
    if (prevTec) {
      prevTec.suma += ef;
      prevTec.count += 1;
    } else {
      tecServicio.set(claveTec, {
        catalogo_incidencia: m.catalogo_incidencia,
        departamento: m.departamento,
        tecnico: m.tecnico ?? 'Técnico',
        suma: ef,
        count: 1,
        claveArea,
      });
    }
  }

  return Array.from(tecServicio.entries())
    .map(([clave, it]) => {
      const area = areaServicio.get(it.claveArea);
      const promTecnicoMin = Math.round(it.suma / it.count);
      const promAreaMin = area && area.count > 0 ? Math.round(area.suma / area.count) : promTecnicoMin;
      const diffPct =
        promAreaMin > 0 ? Math.round(((promTecnicoMin - promAreaMin) / promAreaMin) * 100) : 0;

      let claseDesvio: FilaComparativaPar['claseDesvio'] = 'info';
      let etiquetaDesvio = 'En rango';
      if (diffPct <= -15) {
        claseDesvio = 'ok';
        etiquetaDesvio = `${diffPct}% más ágil`;
      } else if (diffPct >= 35) {
        claseDesvio = 'bad';
        etiquetaDesvio = `+${diffPct}% sobre prom.`;
      } else if (diffPct >= 15) {
        claseDesvio = 'warn';
        etiquetaDesvio = `+${diffPct}% sobre prom.`;
      }

      return {
        clave,
        catalogo_incidencia: it.catalogo_incidencia,
        departamento: it.departamento,
        tecnico: it.tecnico,
        casos: it.count,
        promTecnicoMin,
        promAreaMin,
        etiquetaDesvio,
        claseDesvio,
      };
    })
    .sort((a, b) => b.promTecnicoMin - b.promAreaMin || b.casos - a.casos)
    .slice(0, 20);
});

function colorBarraDemanda(idx: number): string {
  return BAR_COLORS[idx % BAR_COLORS.length] ?? '#0f766e';
}

function textoPausaReal(ticket: Ticket): string {
  const met = metricaPorTicketId.value.get(ticket.id);
  if (met) {
    const mins = Number(met.tiempo_pausa_minutos ?? 0);
    const motivo = met.ultimo_motivo_pausa ? `${met.ultimo_motivo_pausa} · ` : '';
    if (mins > 0) {
      return `${motivo}${formatearMinutos(mins)}`;
    }
    if (met.fecha_inicio_pausa_actual) {
      const diffMin = Math.max(
        1,
        Math.round((Date.now() - new Date(met.fecha_inicio_pausa_actual).getTime()) / 60000),
      );
      return `${motivo}${formatearMinutos(diffMin)}`;
    }
  }
  const horas = Math.max(
    1,
    Math.round((Date.now() - new Date(ticket.fecha_creacion).getTime()) / 3600000),
  );
  return horas < 24 ? `${horas}h` : `${Math.round(horas / 24)}d`;
}

function alClickKpi(idx: number, estado?: EstadoTicket): void {
  kpiSeleccionadoIdx.value = idx;
  irABandejaConEstado(estado);
}

function abrirDetalleTicket(ticket: Ticket): void {
  ticketSeleccionado.value = ticket;
  dialogoAbierto.value = true;
}

function irABandejaConEstado(estado?: EstadoTicket): void {
  void router.push({
    path: rutaBandejaRol.value,
    query: estado ? { estado } : {},
  });
}

function irABandejaConTexto(texto: string): void {
  void router.push({
    path: rutaBandejaRol.value,
    query: { busqueda: texto },
  });
}

async function recargarDatos(): Promise<void> {
  cargandoMetricas.value = true;
  const queryFechas = {
    ...(filtrosPeriodo.fecha_desde ? { fecha_desde: filtrosPeriodo.fecha_desde } : {}),
    ...(filtrosPeriodo.fecha_hasta ? { fecha_hasta: filtrosPeriodo.fecha_hasta } : {}),
  };

  const tareas: Promise<unknown>[] = [
    ticketStore.cargarTickets(queryFechas),
    configuracionesStore.cargarOperativas(),
    departmentsStore.cargarDepartamentos().catch(() => undefined),
    ticketStore
      .cargarMetricas(queryFechas)
      .then((resp) => {
        resumenMetricas.value = resp.resumen;
        ticketsMetricas.value = resp.tickets;
      })
      .catch(() => {
        resumenMetricas.value = RESUMEN_METRICAS_VACIO;
        ticketsMetricas.value = [];
      }),
  ];

  if (['ADMINISTRADOR', 'MESA_TECNICA', 'DIRECTOR', 'GERENTE_AREA'].includes(rol.value)) {
    tareas.push(ticketStore.cargarTecnicosDisponibles().catch(() => []));
  }

  try {
    await Promise.all(tareas);
  } finally {
    cargandoMetricas.value = false;
  }
}

watch(
  () => authStore.role,
  (nuevoRol) => {
    kpiSeleccionadoIdx.value = 0;
    if (nuevoRol === 'DIRECTOR' && tabActiva.value === 'suplencia') {
      tabActiva.value = 'matriz';
    }
    void recargarDatos();
  },
);

onMounted(() => {
  void recargarDatos();
});
</script>

<style scoped lang="scss">
.dashboard-page {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.min-w-0 {
  min-width: 0;
}

.relojes-resumen {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.reloj-item {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__label {
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__val {
    font-size: 0.92rem;
    line-height: 1.2;
    margin-top: 2px;
  }

  &__sub {
    font-size: 0.68rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.calidad-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;

  &--ok {
    background: var(--success-soft);
    color: var(--st-verificar);
  }

  &--bad {
    background: var(--danger-soft);
    color: var(--st-abierto);
  }
}

.role-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: 1120px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.kpi-box {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 13px;
  box-shadow: none;
  cursor: pointer;
  transition:
    border-color var(--transition-ui),
    background-color var(--transition-ui);

  &:hover {
    border-color: var(--border-strong);
  }

  &--active {
    border-color: var(--brand-ink);
    background: var(--surface-subtle);
  }

  &__label {
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  &__val {
    font-size: 1.32rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__pill {
    font-size: 0.67rem;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    white-space: nowrap;
  }
}

.view-tabs-bar {
  border-bottom: 1px solid var(--border-subtle);
}

.view-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 9px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color var(--transition-ui),
    border-color var(--transition-ui);

  &:hover {
    color: var(--text-primary);
  }

  &--active {
    color: var(--brand-ink);
    border-bottom-color: var(--brand-ink);
  }
}

.panel-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: none;
  overflow: hidden;

  &__header {
    padding: 13px 16px;
    border-bottom: 1px solid var(--border-subtle);
  }

  &__title {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  &__hint {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
}

.table-fixed-wrap {
  overflow-x: hidden;
}

.matriz-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  text-align: left;

  thead tr {
    border-bottom: 1px solid var(--border-subtle);
    background: var(--surface-subtle);
    color: var(--text-muted);
  }

  th {
    padding: 10px 5px;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th:first-child,
  td:first-child {
    padding-left: 12px;
  }

  th:last-child,
  td:last-child {
    padding-right: 12px;
  }

  td {
    padding: 10px 5px;
    vertical-align: middle;
  }
}

.celda-wrap {
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.shrink-0 {
  flex-shrink: 0;
}

.mobile-matriz-card {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}

.matriz-row {
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background-color var(--transition-ui);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--surface-hover);
  }
}

.cell-pill {
  display: inline-block;
  min-width: 24px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &--total {
    background: var(--surface-subtle);
    color: var(--st-total);
  }

  &--abierto {
    background: var(--danger-soft);
    color: var(--st-abierto);
  }

  &--asignado {
    background: rgba(3, 105, 161, 0.12);
    color: var(--st-asignado);
  }

  &--progreso {
    background: var(--brand-primary-soft);
    color: var(--st-progreso);
  }

  &--espera {
    background: var(--warning-soft);
    color: var(--st-espera);
  }

  &--verificar {
    background: var(--success-soft);
    color: var(--st-verificar);
  }

  &--reabierto {
    background: rgba(109, 40, 217, 0.12);
    color: var(--st-reabierto);
  }

  &--cerrado {
    background: var(--surface-subtle);
    color: var(--st-cerrado);
  }

  &--no-resuelto {
    background: rgba(194, 65, 12, 0.12);
    color: var(--st-no-resuelto);
  }

  &--cancelado {
    background: rgba(100, 116, 139, 0.13);
    color: var(--st-cancelado);
  }

  &--zero {
    color: var(--text-muted);
    font-weight: 500;
  }
}

.grid-two-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.section-heading {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  &--red {
    color: var(--st-abierto);
  }

  &--green {
    color: var(--st-verificar);
  }

  &--amber {
    color: var(--st-espera);
  }

  &--teal {
    color: var(--st-progreso);
  }
}

.count-pill {
  font-size: 0.74rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  flex-shrink: 0;

  &--red {
    background: var(--danger-soft);
    color: var(--st-abierto);
  }

  &--green {
    background: var(--success-soft);
    color: var(--st-verificar);
  }

  &--teal {
    background: var(--brand-primary-soft);
    color: var(--st-progreso);
  }
}

.action-row {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  &__info {
    min-width: 0;
  }

  &__title {
    font-size: 0.82rem;
    color: var(--text-primary);
  }

  &__sub {
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.cta-btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity var(--transition-ui);

  &:hover {
    opacity: 0.9;
  }

  &--teal {
    background: var(--brand-primary);
    border-color: var(--brand-primary-border);
    color: var(--brand-on-primary);
  }

  &--green {
    background: var(--positive, #15803D);
  }

  &--amber {
    background: #B45309;
  }
}

.tech-row {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  &__left {
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: 0.84rem;
    color: var(--text-primary);
  }

  &__desc {
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__stats {
    font-size: 0.76rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
}

.tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;

  &--green {
    background: var(--brand-primary-soft);
    color: var(--st-progreso);
  }

  &--amber {
    background: var(--warning-soft);
    color: var(--st-espera);
  }

  &--blue {
    background: rgba(3, 105, 161, 0.12);
    color: var(--st-asignado);
  }
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.demand-bar-track {
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: var(--surface-subtle);
  overflow: hidden;
}

.demand-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.pause-row {
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.78rem;

  &__text {
    color: var(--text-primary);
  }

  &__tag {
    color: var(--st-espera);
    font-weight: 600;
    flex-shrink: 0;
  }
}

.empty-row {
  padding: 18px;
  border-radius: 8px;
  border: 1px dashed var(--border-subtle);
  background: var(--surface-bg);
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.text-teal {
  color: var(--brand-ink);
}
.text-red {
  color: var(--st-abierto);
  font-weight: 600;
}
.text-amber {
  color: var(--st-espera);
  font-weight: 600;
}
.font-semibold {
  font-weight: 600;
}
.font-medium {
  font-weight: 500;
}
.font-bold {
  font-weight: 700;
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
