// 🛡️ [FASE 3.6 - EXPORTADORES] Utilidades puras de exportación CSV/Excel (UTF-8 BOM) e Informe Ejecutivo PDF
import type { MetricaTicketReal, MetricasResumenOperativo } from '@/models/types';
import { formatearFechaHora } from '@/utils/formatFecha';

type ValorPrimitivo = string | number | boolean | null | undefined;

function escaparCsv(valor: ValorPrimitivo): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  const limpio = texto.replace(/\r?\n/g, ' ').trim();
  if (/[;"\n,]/.test(limpio)) {
    return `"${limpio.replace(/"/g, '""')}"`;
  }
  return limpio;
}

function escaparHtml(valor: ValorPrimitivo): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function descargarBlob(contenido: string, nombreArchivo: string, tipoMime: string): void {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugFechaHoy(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function formatearMinutosLegible(minutos: number): string {
  const valor = Number(minutos ?? 0);
  if (valor < 60) return `${Math.round(valor)} min`;
  const horas = Math.floor(valor / 60);
  const resto = Math.round(valor % 60);
  return resto > 0 ? `${horas}h ${resto}m` : `${horas}h`;
}

function formatearBooleano(valor: boolean | null): string {
  if (valor === null || valor === undefined) return 'N/A';
  return valor ? 'Sí' : 'No';
}

/**
 * 1. Exporta el Listado Detallado de Casos Atendidos en formato CSV compatible con Excel (UTF-8 BOM + ';').
 */
export function exportarListadoDetalladoCsv(
  tickets: readonly MetricaTicketReal[],
  periodoTexto: string,
): void {
  const cabeceras = [
    'Folio',
    'Fecha Creación',
    'Solicitante',
    'Departamento Solicitante',
    'Sub-Gerencia TI',
    'Técnico Asignado',
    'Servicio del Catálogo',
    'Prioridad',
    'Estado',
    'Tipo de Cierre',
    'Conformidad Usuario',
    'Tiempo Asignación (min)',
    'Tiempo Efectivo (min)',
    'Tiempo Pausa Total (min)',
    'Pausa Repuesto/Compra (min)',
    'Pausa Proveedor Externo (min)',
    'Pausa Usuario No Disp. (min)',
    'Pausa Autorización (min)',
    'Cumple SLA Asignación',
    'Cumple SLA Resolución',
    'Suplencia Mesa Técnica',
    'Reaperturas',
    'Transferencias',
    'Fecha Resolución',
    'Fecha Cierre',
    'Causa Raíz',
    'Solución Aplicada',
  ];

  const filas = tickets.map((t) =>
    [
      t.folio,
      formatearFechaHora(t.fecha_creacion),
      t.solicitante,
      t.departamento_solicitante,
      t.departamento,
      t.tecnico ?? 'Sin asignar',
      t.catalogo_incidencia,
      t.prioridad,
      t.estado,
      t.tipo_cierre ?? '',
      formatearBooleano(t.conformidad_usuario),
      Math.round(Number(t.tiempo_asignacion_minutos ?? 0)),
      Math.round(Number(t.tiempo_efectivo_minutos ?? 0)),
      Math.round(Number(t.tiempo_pausa_minutos ?? 0)),
      Math.round(Number(t.pausa_repuesto_minutos ?? 0)),
      Math.round(Number(t.pausa_proveedor_minutos ?? 0)),
      Math.round(Number(t.pausa_usuario_minutos ?? 0)),
      Math.round(Number(t.pausa_autorizacion_minutos ?? 0)),
      formatearBooleano(t.cumple_sla_asignacion),
      formatearBooleano(t.cumple_sla_resolucion),
      t.tuvo_suplencia ? 'Sí' : 'No',
      t.cantidad_reaperturas ?? 0,
      t.cantidad_transferencias ?? 0,
      formatearFechaHora(t.fecha_resolucion),
      formatearFechaHora(t.fecha_cierre),
      t.causa_raiz ?? '',
      t.solucion_aplicada ?? '',
    ]
      .map(escaparCsv)
      .join(';'),
  );

  const encabezadoMeta = `# HelpDesk TI - Listado Detallado de Casos Atendidos (${periodoTexto})`;
  const csv = `\uFEFF${encabezadoMeta}\r\n${cabeceras.map(escaparCsv).join(';')}\r\n${filas.join('\r\n')}`;
  descargarBlob(csv, `helpdesk_casos_detallados_${slugFechaHoy()}.csv`, 'text/csv;charset=utf-8;');
}

interface AcumuladoMensualTecnico {
  mes: string;
  tecnico: string;
  departamento: string;
  evaluables: number;
  resueltosCerrados: number;
  sumaEfectivoMin: number;
  conteoEfectivo: number;
  totalPausaMin: number;
  slaResolOk: number;
  slaResolEval: number;
  reabiertos: number;
}

/**
 * 2. Exporta la Matriz Mensual por Técnico (Excel/CSV UTF-8 BOM).
 */
export function exportarMatrizMensualTecnicosCsv(
  tickets: readonly MetricaTicketReal[],
  periodoTexto: string,
): void {
  const grupos = new Map<string, AcumuladoMensualTecnico>();

  for (const t of tickets) {
    if (t.estado === 'Cancelado' || !t.id_tecnico || !t.tecnico) continue;
    const fecha = new Date(t.fecha_creacion);
    const mes = Number.isNaN(fecha.getTime())
      ? 'Sin fecha'
      : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const clave = `${mes}__${t.id_tecnico}`;

    let acc = grupos.get(clave);
    if (!acc) {
      acc = {
        mes,
        tecnico: t.tecnico,
        departamento: t.departamento,
        evaluables: 0,
        resueltosCerrados: 0,
        sumaEfectivoMin: 0,
        conteoEfectivo: 0,
        totalPausaMin: 0,
        slaResolOk: 0,
        slaResolEval: 0,
        reabiertos: 0,
      };
      grupos.set(clave, acc);
    }

    acc.evaluables += 1;
    const esResueltoOCerrado = t.estado === 'Resuelto - Por Verificar' || t.estado === 'Cerrado';
    if (esResueltoOCerrado) {
      acc.resueltosCerrados += 1;
    }

    const ef = Number(t.tiempo_efectivo_minutos ?? 0);
    if (ef > 0 || esResueltoOCerrado) {
      acc.sumaEfectivoMin += ef;
      acc.conteoEfectivo += 1;
    }

    acc.totalPausaMin += Number(t.tiempo_pausa_minutos ?? 0);

    if (t.cumple_sla_resolucion !== null) {
      acc.slaResolEval += 1;
      if (t.cumple_sla_resolucion) acc.slaResolOk += 1;
    }

    if ((t.cantidad_reaperturas ?? 0) > 0 || t.estado === 'Reabierto') {
      acc.reabiertos += 1;
    }
  }

  const cabeceras = [
    'Mes',
    'Técnico Especialista',
    'Sub-Gerencia TI',
    'Tickets Evaluables',
    'Resueltos / Cerrados',
    'Tiempo Efectivo Promedio (min)',
    'Tiempo Efectivo Promedio',
    'Total Pausa (min)',
    '% Cumplimiento SLA Resolución',
    '% Reaperturas',
  ];

  const ordenados = Array.from(grupos.values()).sort(
    (a, b) => b.mes.localeCompare(a.mes) || a.tecnico.localeCompare(b.tecnico),
  );

  const filas = ordenados.map((g) => {
    const promEf = g.conteoEfectivo > 0 ? Math.round(g.sumaEfectivoMin / g.conteoEfectivo) : 0;
    const pctSla = g.slaResolEval > 0 ? Math.round((g.slaResolOk / g.slaResolEval) * 1000) / 10 : 100;
    const pctReap = g.evaluables > 0 ? Math.round((g.reabiertos / g.evaluables) * 1000) / 10 : 0;

    return [
      g.mes,
      g.tecnico,
      g.departamento,
      g.evaluables,
      g.resueltosCerrados,
      promEf,
      formatearMinutosLegible(promEf),
      Math.round(g.totalPausaMin),
      `${pctSla}%`,
      `${pctReap}%`,
    ]
      .map(escaparCsv)
      .join(';');
  });

  const encabezadoMeta = `# HelpDesk TI - Matriz Mensual por Técnico (${periodoTexto})`;
  const csv = `\uFEFF${encabezadoMeta}\r\n${cabeceras.map(escaparCsv).join(';')}\r\n${filas.join('\r\n')}`;
  descargarBlob(csv, `helpdesk_matriz_mensual_tecnicos_${slugFechaHoy()}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 3. Genera el Informe Ejecutivo Mensual en formato imprimible / Guardar como PDF (A4 limpio).
 * Retorna `false` si el navegador bloqueó la ventana emergente.
 */
export function exportarInformeEjecutivoPdf(
  resumen: MetricasResumenOperativo,
  periodoTexto: string,
  areaFiltroTexto: string,
): boolean {
  const ventana = window.open('', '_blank', 'width=1024,height=780');
  if (!ventana) return false;

  const fechaGeneracion = formatearFechaHora(new Date());

  const p = resumen.pausas_por_motivo;
  const pausas = [
    { motivo: 'Esperando repuesto / compra', minutos: p.repuesto_compra_minutos },
    { motivo: 'Proveedor externo', minutos: p.proveedor_externo_minutos },
    { motivo: 'Usuario no disponible', minutos: p.usuario_no_disponible_minutos },
    { motivo: 'Esperando autorización', minutos: p.esperando_autorizacion_minutos },
  ];
  const totalPausasMin = pausas.reduce((acc, it) => acc + Number(it.minutos ?? 0), 0);

  const filasDeptos = resumen.por_departamento.length
    ? resumen.por_departamento
        .map(
          (d) => `
        <tr>
          <td><strong>${escaparHtml(d.departamento)}</strong></td>
          <td class="num">${d.evaluables}</td>
          <td class="num">${d.resueltos_cerrados}</td>
          <td class="num">${escaparHtml(formatearMinutosLegible(d.promedio_asignacion_minutos))}</td>
          <td class="num">${escaparHtml(formatearMinutosLegible(d.promedio_efectivo_minutos))}</td>
          <td class="num">${d.suplencias}</td>
          <td class="num">${d.reaperturas}</td>
          <td class="num"><strong>${d.pct_sla_asignacion}%</strong></td>
          <td class="num"><strong>${d.pct_sla_resolucion}%</strong></td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="9" class="empty">Sin registros en el período seleccionado.</td></tr>`;

  const filasTecnicos = resumen.por_tecnico.length
    ? resumen.por_tecnico
        .map(
          (t) => `
        <tr>
          <td><strong>${escaparHtml(t.tecnico)}</strong></td>
          <td>${escaparHtml(t.departamento)}</td>
          <td class="num">${t.total}</td>
          <td class="num">${t.resueltos_cerrados}</td>
          <td class="num">${escaparHtml(formatearMinutosLegible(t.promedio_efectivo_minutos))}</td>
          <td class="num">${escaparHtml(formatearMinutosLegible(t.total_pausa_minutos))}</td>
          <td class="num">${t.pct_reapertura}%</td>
          <td class="num"><strong>${t.pct_sla_resolucion}%</strong></td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="8" class="empty">Sin actividad técnica registrada en el período.</td></tr>`;

  const filasPausas = pausas
    .map((m) => {
      const pct = totalPausasMin > 0 ? Math.round((m.minutos / totalPausasMin) * 100) : 0;
      return `
        <tr>
          <td>${escaparHtml(m.motivo)}</td>
          <td class="num">${escaparHtml(formatearMinutosLegible(m.minutos))}</td>
          <td class="num"><strong>${pct}%</strong></td>
        </tr>`;
    })
    .join('');

  const filasTop = resumen.top_catalogo.length
    ? resumen.top_catalogo
        .map(
          (c, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td>${escaparHtml(c.catalogo_incidencia)}</td>
          <td>${escaparHtml(c.departamento)}</td>
          <td class="num"><strong>${c.cantidad}</strong></td>
          <td class="num">${escaparHtml(formatearMinutosLegible(c.promedio_efectivo_minutos))}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="empty">Sin incidencias registradas en el período.</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Ejecutivo SLA — HelpDesk TI (${escaparHtml(periodoTexto)})</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0C1A14;
      background: #FFFFFF;
      margin: 0;
      padding: 20px;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #065F46;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0F766E;
    }
    h1 {
      margin: 3px 0 2px;
      font-size: 20px;
      color: #0C1A14;
      letter-spacing: -0.02em;
    }
    .meta {
      text-align: right;
      font-size: 10.5px;
      color: #51655C;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi {
      border: 1px solid #D9E2DC;
      border-radius: 8px;
      padding: 10px 12px;
      background: #F6F8F6;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #51655C;
    }
    .kpi-val {
      font-size: 20px;
      font-weight: 700;
      color: #065F46;
      margin: 4px 0 2px;
      font-variant-numeric: tabular-nums;
    }
    .kpi-sub {
      font-size: 10px;
      color: #51655C;
    }
    h2 {
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #065F46;
      margin: 16px 0 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #E5ECE8;
      page-break-after: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10.5px;
    }
    th {
      background: #F0F4F1;
      color: #51655C;
      text-transform: uppercase;
      font-size: 9.5px;
      font-weight: 700;
      text-align: left;
      padding: 7px 6px;
      border-bottom: 1px solid #D9E2DC;
    }
    td {
      padding: 6px;
      border-bottom: 1px solid #EDF2EF;
      vertical-align: top;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .empty {
      text-align: center;
      color: #51655C;
      padding: 12px;
    }
    .gov-strip {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 10.5px;
      color: #1E332A;
      background: #F0F4F1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 14px;
    }
    .btn-print {
      background: #065F46;
      color: #FFFFFF;
      border: none;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .print-bar { display: none; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button type="button" class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="eyebrow">HelpDesk TI · Informe Ejecutivo de Gestión</div>
      <h1>Cumplimiento de SLAs y Gobernanza Operativa</h1>
    </div>
    <div class="meta">
      <div><strong>Período:</strong> ${escaparHtml(periodoTexto)}</div>
      <div><strong>Alcance:</strong> ${escaparHtml(areaFiltroTexto)}</div>
      <div><strong>Generado:</strong> ${escaparHtml(fechaGeneracion)}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">SLA Asignación</div>
      <div class="kpi-val">${resumen.pct_sla_asignacion}%</div>
      <div class="kpi-sub">Prom.: ${escaparHtml(formatearMinutosLegible(resumen.promedio_asignacion_minutos))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">SLA Resolución Efectiva</div>
      <div class="kpi-val">${resumen.pct_sla_resolucion}%</div>
      <div class="kpi-sub">Prom.: ${escaparHtml(formatearMinutosLegible(resumen.promedio_efectivo_minutos))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Tiempo en Pausa</div>
      <div class="kpi-val">${escaparHtml(formatearMinutosLegible(resumen.promedio_pausa_minutos))}</div>
      <div class="kpi-sub">Promedio detenido por ticket</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Conformidad Usuario</div>
      <div class="kpi-val">${resumen.gobernanza.pct_conformidad_usuario}%</div>
      <div class="kpi-sub">Reapertura: ${resumen.gobernanza.tasa_reapertura_pct}% · Suplencias: ${resumen.gobernanza.total_suplencias}</div>
    </div>
  </div>

  <div class="gov-strip">
    <span><strong>Evaluables:</strong> ${resumen.total_evaluables}</span>
    <span><strong>Resueltos / Cerrados:</strong> ${resumen.total_resueltos_cerrados}</span>
    <span><strong>Cancelados excluidos:</strong> ${resumen.total_cancelados}</span>
    <span><strong>Transferencias:</strong> ${resumen.gobernanza.total_transferencias}</span>
    <span><strong>Cierres Confirmados:</strong> ${resumen.gobernanza.cierres_confirmados}</span>
    <span><strong>Cierres Administrativos:</strong> ${resumen.gobernanza.cierres_administrativos}</span>
  </div>

  <h2>1. Cumplimiento SLA por Sub-Gerencia TI</h2>
  <table>
    <thead>
      <tr>
        <th>Sub-Gerencia TI</th>
        <th class="num">Eval.</th>
        <th class="num">Res./Cerr.</th>
        <th class="num">Prom. Asig.</th>
        <th class="num">Prom. Efect.</th>
        <th class="num">Supl.</th>
        <th class="num">Reap.</th>
        <th class="num">SLA Asig.</th>
        <th class="num">SLA Resol.</th>
      </tr>
    </thead>
    <tbody>${filasDeptos}</tbody>
  </table>

  <h2>2. Rendimiento y Tiempo Efectivo por Técnico</h2>
  <table>
    <thead>
      <tr>
        <th>Técnico</th>
        <th>Sub-Gerencia TI</th>
        <th class="num">Asig.</th>
        <th class="num">Res./Cerr.</th>
        <th class="num">Prom. Efect.</th>
        <th class="num">Total Pausa</th>
        <th class="num">% Reap.</th>
        <th class="num">SLA Resol.</th>
      </tr>
    </thead>
    <tbody>${filasTecnicos}</tbody>
  </table>

  <h2>3. Desglose de Demoras por Pausa Externa (En Espera)</h2>
  <table>
    <thead>
      <tr>
        <th>Motivo Tipificado</th>
        <th class="num">Tiempo Acumulado</th>
        <th class="num">Participación</th>
      </tr>
    </thead>
    <tbody>${filasPausas}</tbody>
  </table>

  <h2>4. Top 10 Incidencias del Catálogo</h2>
  <table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Incidencia del Catálogo</th>
        <th>Área TI</th>
        <th class="num">Casos</th>
        <th class="num">Prom. Efectivo</th>
      </tr>
    </thead>
    <tbody>${filasTop}</tbody>
  </table>
</body>
</html>`;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 250);
  return true;
}
