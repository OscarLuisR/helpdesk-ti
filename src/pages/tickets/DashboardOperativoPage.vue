<!-- 🛡️ [FASE 3 - DASHBOARD OPERATIVO] Colores específicos por estado y vistas diferenciadas por Rol -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg dashboard-page">
    <!-- Cabecera de página -->
    <div class="top-bar q-pb-sm q-mb-md">
      <div class="row items-center justify-between q-gutter-y-sm">
        <div class="col-12 col-sm-auto">
          <div class="row items-center q-gutter-x-sm">
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

        <div class="col-12 col-sm-auto row items-center q-gutter-sm">
          <q-btn
            outline
            no-caps
            color="secondary"
            icon="refresh"
            label="Actualizar"
            :loading="cargando"
            @click="recargarDatos"
          />
          <q-btn
            outline
            no-caps
            color="primary"
            icon="inbox"
            :label="etiquetaBotonBandeja"
            :to="rutaBandejaRol"
          />
          <q-btn
            v-if="puedeCrearTicket"
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Nuevo Ticket"
            to="/tickets/nuevo"
          />
        </div>
      </div>
    </div>

    <div v-if="errorCarga" class="form-error q-pa-md rounded-borders q-mb-md">
      {{ errorCarga }}
    </div>

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

          <div class="table-scroll">
            <table class="matriz-table">
              <thead>
                <tr>
                  <th>Prioridad SLA</th>
                  <th class="text-center">Asignados</th>
                  <th class="text-center">En Progreso</th>
                  <th class="text-center">En Espera</th>
                  <th class="text-center">Por Verificar</th>
                  <th class="text-center">Reabiertos</th>
                  <th class="text-center">Cerrados</th>
                  <th class="text-center">Total</th>
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
                    <span class="chip" :class="claseChipPrioridad(p.prioridad)">
                      <span class="chip__dot" />
                      {{ p.prioridad }}
                    </span>
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
                  <td class="text-center font-bold text-dark tabular-nums">{{ p.total }}</td>
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
                  <strong class="text-dark">{{ t.folio }}</strong>
                  <span class="chip" :class="ESTADO_CLASS[t.estado]">
                    <span class="chip__dot" />
                    {{ t.estado }}
                  </span>
                  <span class="chip" :class="claseChipPrioridad(t.prioridad)">
                    {{ t.prioridad }}
                  </span>
                </div>
                <div class="action-row__title q-mt-xs ellipsis">
                  {{ t.catalogo_incidencia }}
                </div>
                <div class="action-row__sub ellipsis">
                  {{ t.departamento_solicitante }} · {{ t.solicitante }} (Tel:
                  <strong class="text-dark">{{ t.solicitante_telefono }}</strong>)
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
        </div>
        <span class="role-hint gt-sm">{{ alcanceTexto }}</span>
      </div>

      <!-- Pestaña 1 Gerente de Área: Tabla de técnicos de su sub-gerencia por estado -->
      <div v-if="tabGerenteArea === 'equipo'" class="panel-card">
        <div class="panel-card__header row items-center justify-between">
          <span class="panel-card__title">
            DISTRIBUCIÓN DE TICKETS POR TÉCNICO DE MI SUB-GERENCIA
          </span>
          <span class="panel-card__hint">Clic en un técnico filtra la bandeja de área</span>
        </div>

        <div class="table-scroll">
          <table class="matriz-table">
            <thead>
              <tr>
                <th>Técnico Especialista</th>
                <th class="text-center">Asignados</th>
                <th class="text-center">En Progreso</th>
                <th class="text-center">En Espera</th>
                <th class="text-center">Por Verificar</th>
                <th class="text-center">Reabiertos</th>
                <th class="text-center">Cerrados</th>
                <th class="text-right">Estado en Vivo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in resumenPlantilla"
                :key="t.id"
                class="matriz-row"
                @click="irABandejaConTexto(t.nombre_completo)"
              >
                <td>
                  <div class="font-semibold text-dark">{{ t.nombre_completo }}</div>
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
                    {{
                      t.estadoOperativo === 'EN_PROGRESO'
                        ? 'Atendiendo ahora'
                        : t.estadoOperativo === 'EN_COLA'
                          ? 'En cola sin iniciar'
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
      <div v-else class="grid-two-cols">
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
                En Espera ({{ tiempoPausaTexto(t.fecha_creacion) }})
              </span>
            </div>
          </div>
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
        </div>
        <span class="role-hint gt-sm">{{ alcanceTexto }}</span>
      </div>

      <!-- VISTA 1: Matriz por Gerencia TI con colores específicos por cada estado -->
      <div v-if="tabActiva === 'matriz'" class="panel-card">
        <div class="panel-card__header row items-center justify-between">
          <span class="panel-card__title">
            DESGLOSE OPERATIVO POR SUB-GERENCIA DE TECNOLOGÍA
          </span>
          <span class="panel-card__hint">Clic en cualquier fila filtra la bandeja por área</span>
        </div>

        <div class="table-scroll">
          <table class="matriz-table">
            <thead>
              <tr>
                <th>Gerencia / Sub-Área TI</th>
                <th class="text-center">Abiertos</th>
                <th class="text-center">Asignados</th>
                <th class="text-center">En Progreso</th>
                <th class="text-center">En Espera</th>
                <th class="text-center">Por Verificar</th>
                <th class="text-center">Reabiertos</th>
                <th class="text-center">Cerrados</th>
                <th class="text-center">Total</th>
                <th class="text-right">SLA</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in filasMatrizGerencias"
                :key="r.id_departamento"
                class="matriz-row"
                @click="irABandejaConTexto(r.nombre)"
              >
                <td class="font-semibold text-dark">{{ r.nombre }}</td>
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
                <td class="text-center font-bold text-dark tabular-nums">{{ r.total }}</td>
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
                  Tel: <strong class="text-dark">{{ t.solicitante_telefono }}</strong> · Resuelto
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
      <div v-else class="grid-two-cols">
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
                <span class="font-semibold text-dark">{{ idx + 1 }}. {{ dep.nombre }}</span>
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
                {{ t.departamento }} ({{ tiempoPausaTexto(t.fecha_creacion) }})
              </span>
            </div>
          </div>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import TicketDetalleDialog from '@/components/tickets/TicketDetalleDialog.vue';
import { ESTADO_CLASS, claseChipPrioridad } from '@/composables/useTickets';
import type { EstadoTicket, Ticket } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useConfiguracionesStore } from '@/stores/useConfiguracionesStore';
import { esDepartamentoTI, useDepartmentsStore } from '@/stores/useDepartmentsStore';
import { ESTADOS_ACTIVOS_TECNICO, useTicketStore } from '@/stores/ticketStore';

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

const BAR_COLORS = ['#0f766e', '#0284c7', '#d97706', '#475569'];
const ORDEN_PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];

const router = useRouter();
const authStore = useAuthStore();
const configuracionesStore = useConfiguracionesStore();
const ticketStore = useTicketStore();
const departmentsStore = useDepartmentsStore();

const tabActiva = ref<'matriz' | 'suplencia' | 'plantilla' | 'demanda'>('matriz');
const tabGerenteArea = ref<'equipo' | 'pendientes'>('equipo');
const kpiSeleccionadoIdx = ref(0);
const ticketSeleccionado = ref<Ticket | null>(null);
const dialogoAbierto = ref(false);

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
    subtitulo: 'Finalizados',
    color: 'var(--st-cerrado)',
    claseColor: 'kpi-box--cerrado',
    clasePill: 'cell-pill--cerrado',
    estadoFiltro: 'Cerrado',
  },
]);

const filasMatrizGerencias = computed<FilaMatrizGerencia[]>(() => {
  const mapa = new Map<
    number,
    Omit<FilaMatrizGerencia, 'sla'> & { dentroSla: number }
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
      total: 0,
      dentroSla: 0,
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
        total: 0,
        dentroSla: 0,
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

    const finAsignacion = t.fecha_asignacion ? new Date(t.fecha_asignacion).getTime() : ahora;
    const min = Math.max(0, (finAsignacion - new Date(t.fecha_creacion).getTime()) / 60000);
    if (min <= (t.tiempo_max_asignacion_minutos || 240)) {
      fila.dentroSla += 1;
    }
  }

  return Array.from(mapa.values())
    .map(({ dentroSla, ...f }) => ({
      ...f,
      sla: f.total > 0 ? Math.round((dentroSla / f.total) * 100) : 100,
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
      total: 0,
    });
  }

  for (const t of tickets.value) {
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
        ? new Date(ticketActual.fecha_inicio_atencion).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })
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

function colorBarraDemanda(idx: number): string {
  return BAR_COLORS[idx % BAR_COLORS.length] ?? '#0f766e';
}

function tiempoPausaTexto(fechaIso: string): string {
  const horas = Math.max(1, Math.round((Date.now() - new Date(fechaIso).getTime()) / 3600000));
  if (horas < 24) return `${horas}h`;
  return `${Math.round(horas / 24)}d`;
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
  const tareas: Promise<unknown>[] = [
    ticketStore.cargarTickets(),
    configuracionesStore.cargarOperativas(),
    departmentsStore.cargarDepartamentos().catch(() => undefined),
  ];

  if (['ADMINISTRADOR', 'MESA_TECNICA', 'DIRECTOR', 'GERENTE_AREA'].includes(rol.value)) {
    tareas.push(ticketStore.cargarTecnicosDisponibles().catch(() => []));
  }

  await Promise.all(tareas);
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
.top-bar {
  border-bottom: 1px solid var(--border);
}

.calidad-badge {
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;

  &--ok {
    background: rgba(22, 163, 74, 0.12);
    color: var(--st-verificar);
  }

  &--bad {
    background: rgba(220, 38, 38, 0.12);
    color: var(--st-abierto);
  }
}

.role-hint {
  font-size: 0.78rem;
  font-style: italic;
  color: var(--muted);
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (min-width: 1120px) {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

.kpi-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--border);
  border-radius: var(--radius);
  padding: 9px 11px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;

  &:hover,
  &--active {
    box-shadow: var(--shadow-hover);
    transform: translateY(-1px);
  }

  &--total     { border-top-color: var(--st-total); }
  &--abierto   { border-top-color: var(--st-abierto); }
  &--asignado  { border-top-color: var(--st-asignado); }
  &--progreso  { border-top-color: var(--st-progreso); }
  &--espera    { border-top-color: var(--st-espera); }
  &--verificar { border-top-color: var(--st-verificar); }
  &--reabierto { border-top-color: var(--st-reabierto); }
  &--cerrado   { border-top-color: var(--st-cerrado); }

  &__label {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--muted);
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  &__val {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__pill {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 999px;
    white-space: nowrap;
  }
}

.view-tabs-bar {
  border-bottom: 1px solid var(--border);
}

.view-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
  }

  &--active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
}

.panel-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;

  &__header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }

  &__title {
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }

  &__hint {
    font-size: 0.76rem;
    color: var(--muted);
  }
}

.table-scroll {
  overflow-x: auto;
}

.matriz-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;

  thead tr {
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
  }

  th {
    padding: 10px 12px;
    font-weight: 600;
  }

  td {
    padding: 11px 12px;
  }
}

.matriz-row {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--primary-soft);
  }
}

.cell-pill {
  display: inline-block;
  min-width: 24px;
  padding: 2px 8px;
  border-radius: 5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &--total {
    background: rgba(30, 58, 95, 0.12);
    color: var(--st-total);
  }

  &--abierto {
    background: rgba(220, 38, 38, 0.13);
    color: var(--st-abierto);
  }

  &--asignado {
    background: rgba(2, 132, 199, 0.13);
    color: var(--st-asignado);
  }

  &--progreso {
    background: rgba(15, 118, 110, 0.14);
    color: var(--st-progreso);
  }

  &--espera {
    background: rgba(217, 119, 6, 0.14);
    color: var(--st-espera);
  }

  &--verificar {
    background: rgba(22, 163, 74, 0.14);
    color: var(--st-verificar);
  }

  &--reabierto {
    background: rgba(124, 58, 237, 0.14);
    color: var(--st-reabierto);
  }

  &--cerrado {
    background: rgba(71, 85, 105, 0.14);
    color: var(--st-cerrado);
  }

  &--zero {
    color: var(--muted);
    font-weight: 500;
  }
}

.grid-two-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.section-heading {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
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
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  flex-shrink: 0;

  &--red {
    background: rgba(220, 38, 38, 0.13);
    color: var(--st-abierto);
  }

  &--green {
    background: rgba(22, 163, 74, 0.13);
    color: var(--st-verificar);
  }

  &--teal {
    background: rgba(15, 118, 110, 0.13);
    color: var(--st-progreso);
  }
}

.action-row {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  &__info {
    min-width: 0;
  }

  &__title {
    font-size: 0.82rem;
    color: var(--text);
  }

  &__sub {
    font-size: 0.76rem;
    color: var(--muted);
    margin-top: 2px;
  }
}

.cta-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.92;
  }

  &--teal {
    background: var(--st-progreso);
  }

  &--green {
    background: var(--st-verificar);
  }

  &--amber {
    background: var(--st-espera);
  }
}

.tech-row {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
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
    color: var(--text);
  }

  &__desc {
    font-size: 0.76rem;
    color: var(--muted);
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
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
}

.tech-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;

  &--green {
    background: rgba(15, 118, 110, 0.14);
    color: var(--st-progreso);
  }

  &--amber {
    background: rgba(217, 119, 6, 0.14);
    color: var(--st-espera);
  }

  &--blue {
    background: rgba(2, 132, 199, 0.13);
    color: var(--st-asignado);
  }
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
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
  background: var(--bg);
  overflow: hidden;
}

.demand-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.pause-row {
  padding: 9px 12px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.78rem;

  &__text {
    color: var(--text);
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
  border: 1px dashed var(--border);
  background: var(--bg);
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted);
}

.text-teal {
  color: var(--st-progreso);
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
