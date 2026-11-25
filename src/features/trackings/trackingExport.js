import { getV8SessionSummary } from "../sessions/sessionModelDisplay.js";
import { formatChileInstant } from "../sessions/sessionDisplay.js";
import { buildPhaseAnalysis, originalUnityResponses, responsesByV8Variable, V8_VARIABLES } from "./trackingAnalysis.js";
import { TRACKING_DIMENSIONS } from "./trackingEmotionalSeries.js";

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /^[-=+@]/.test(text) ? `'${text}` : text;
};
const sessionRef = (session, index, indexById) => `Sesión ${indexById.get(session?.session_id) ?? index + 1}`;
const displayDate = (session) => formatChileInstant(session?.session_date || session?.capture_started_at)
  || [session?.fecha, session?.hora].filter(Boolean).join(" ") || "Sin fecha";

function safeFilename(value) {
  return String(value || "seguimiento").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "seguimiento";
}

export async function buildTrackingWorkbook({ tracking, sessions = [], evolution = [], detailsById = {}, demographics }) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const chronological = [...sessions].sort((a, b) => String(a.fecha || a.session_date || "").localeCompare(String(b.fecha || b.session_date || ""))
    || String(a.hora || "").localeCompare(String(b.hora || "")) || String(a.session_id || "").localeCompare(String(b.session_id || "")));
  const indexById = new Map(chronological.map((session, index) => [session.session_id, index + 1]));
  const start = chronological[0];
  const end = chronological.at(-1);
  const summary = [
    ["Campo", "Valor"],
    ["Seguimiento", safeText(tracking?.tracking_code || "Seguimiento")],
    ["Fecha de creación", safeText(tracking?.created_at ? formatChileInstant(tracking.created_at) || tracking.created_at : "Sin fecha")],
    ["Sesiones asociadas", chronological.length],
    ["Rango de experiencias", chronological.length ? `${displayDate(start)} — ${displayDate(end)}` : "Sin sesiones"],
    ["Consistencia demográfica", demographics?.label || "Información insuficiente"],
    ["Alcance", "Edad y género registrados son datos de consistencia y no verifican identidad."],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Resumen");

  const sessionRows = [["Referencia", "Fecha y hora", "Estado", "Respuestas disponibles", "Estado del cálculo con IA", "Grupo asignado", "Edad", "Género"]];
  chronological.forEach((session, index) => {
    const detail = detailsById[session.session_id] || {};
    const v8 = getV8SessionSummary(detail.session_id ? detail : session);
    const demographic = demographics?.sessions?.find((record) => record.session_id === session.session_id);
    const unityResponseCount = originalUnityResponses(detail).length;
    sessionRows.push([
      sessionRef(session, index, indexById), safeText(displayDate(session)), safeText(session.status || detail.status || detail.ai_status || "Sin estado"),
      unityResponseCount ? "Disponibles" : "Sin respuestas Unity disponibles", safeText(v8.statusLabel), v8.group === null ? "" : v8.group,
      safeText(demographic?.age_label), safeText(demographic?.gender),
    ]);
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sessionRows), "Sesiones");

  const valuesBySession = responsesByV8Variable(evolution);
  const answerRows = [["Referencia", "Fecha y hora", ...V8_VARIABLES.map((item) => item.variable)]];
  chronological.forEach((session, index) => answerRows.push([
    sessionRef(session, index, indexById), safeText(displayDate(session)),
    ...V8_VARIABLES.map((item) => {
      const value = valuesBySession.get(session.session_id)?.[item.variable];
      return value ?? "";
    }),
  ]));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(answerRows), "Respuestas Unity");

  const aiRows = [["Referencia", "Fecha y hora", "Estado del cálculo con IA", "Grupo asignado"]];
  chronological.forEach((session, index) => {
    const detail = detailsById[session.session_id] || {};
    const v8 = getV8SessionSummary(detail.session_id ? detail : session);
    aiRows.push([
      sessionRef(session, index, indexById), safeText(displayDate(session)),
      safeText(v8.statusLabel), v8.group === null ? "" : v8.group,
    ]);
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aiRows), "Cálculo con IA");

  const validationRows = [["Estado", "Referencia", "Edad", "Género", "Diferencia edad", "Diferencia género"], [demographics?.label || "Información insuficiente", "", "", "", "", ""]];
  for (const record of demographics?.differences || []) validationRows.push([
    "Revisar", `Sesión ${record.session_number}`, safeText(record.age), safeText(record.gender), record.age_difference ? "Sí" : "No", record.gender_difference ? "Sí" : "No",
  ]);
  if (!demographics?.differences?.length) validationRows.push([demographics?.notice || "Sin diferencias observadas en los campos evaluables.", "", "", "", "", ""]);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(validationRows), "Validación");
  return workbook;
}

function drawGeneralProgressChart(doc, evolution = []) {
  const margin = 16;
  const phaseColors = { PRE: [37, 99, 235], FACIL: [15, 159, 143], DIFICIL: [147, 51, 234] };
  const chartData = TRACKING_DIMENSIONS.map((dimension) => ({
    dimension,
    phases: dimension.phases.map((phase) => ({ phase, result: buildPhaseAnalysis(evolution, dimension.id, phase) })),
  }));
  if (!chartData.some(({ phases }) => phases.some(({ result }) => result.observations.length))) return false;
  doc.addPage();
  doc.setFontSize(15); doc.setTextColor(25, 45, 80);
  doc.text("Progreso general del alumno", margin, 18);
  doc.setFontSize(8); doc.setTextColor(80, 90, 105);
  doc.text("Vista descriptiva por dimensión y fase. No existe un índice global validado; las dimensiones no se promedian.", margin, 25);
  const cols = 2;
  const chartWidth = 70;
  const chartHeight = 30;
  chartData.forEach(({ dimension, phases }, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const left = margin + col * 90 + 9;
    const top = 38 + row * 53;
    doc.setFontSize(9); doc.setTextColor(25, 45, 80);
    doc.text(dimension.label, left, top);
    const sessionCount = Math.max(1, ...phases.flatMap(({ result }) => result.rows.map((item) => item.session_number)));
    const x = (number) => left + (sessionCount > 1 ? ((number - 1) / (sessionCount - 1)) * chartWidth : chartWidth / 2);
    const y = (value) => top + 5 + ((9 - value) / 8) * chartHeight;
    doc.setDrawColor(225, 230, 237); doc.setLineWidth(0.15);
    for (const value of [1, 5, 9]) doc.line(left, y(value), left + chartWidth, y(value));
    doc.setDrawColor(140, 150, 165);
    doc.line(left, top + 5, left, top + 5 + chartHeight);
    doc.line(left, top + 5 + chartHeight, left + chartWidth, top + 5 + chartHeight);
    for (const { phase, result } of phases) {
      const actual = result.rows.filter((item) => item.observed !== null);
      const color = phaseColors[phase];
      doc.setDrawColor(...color); doc.setFillColor(...color); doc.setLineWidth(0.6);
      for (let point = 0; point < actual.length; point += 1) {
        const current = actual[point];
        if (point && current.session_number === actual[point - 1].session_number + 1) {
          const previous = actual[point - 1];
          doc.line(x(previous.session_number), y(previous.observed), x(current.session_number), y(current.observed));
        }
        doc.circle(x(current.session_number), y(current.observed), 0.8, "F");
      }
    }
  });
  const legend = [["PRE", phaseColors.PRE], ["Modo fácil", phaseColors.FACIL], ["Modo difícil", phaseColors.DIFICIL]];
  let legendX = margin;
  for (const [label, color] of legend) {
    doc.setDrawColor(...color); doc.setFillColor(...color); doc.line(legendX, 199, legendX + 5, 199);
    doc.setFontSize(8); doc.setTextColor(80, 90, 105); doc.text(label, legendX + 7, 200);
    legendX += label === "Modo difícil" ? 42 : 32;
  }
  return true;
}

function drawTrackingCharts(doc, evolution = []) {
  const margin = 16;
  let chartCount = 0;
  for (const dimension of TRACKING_DIMENSIONS) {
    for (const phase of dimension.phases) {
      const result = buildPhaseAnalysis(evolution, dimension.id, phase);
      if (!result.observations.length) continue;
      chartCount += 1;
      doc.addPage();
      doc.setFontSize(15); doc.setTextColor(25, 45, 80);
      doc.text(`${dimension.label} · ${phase === "PRE" ? "PRE" : phase === "FACIL" ? "Modo fácil" : "Modo difícil"}`, margin, 20);
      doc.setFontSize(9); doc.setTextColor(80, 90, 105);
      doc.text("Respuestas originales observadas por sesion", margin, 27);

      const left = margin + 13;
      const top = 42;
      const width = 170;
      const height = 112;
      const bottom = top + height;
      const lastSession = Math.max(result.rows.length, 1);
      const x = (sessionNumber) => left + (lastSession > 1 ? ((sessionNumber - 1) / (lastSession - 1)) * width : width / 2);
      const y = (value) => bottom - ((value - 1) / 8) * height;

      doc.setDrawColor(225, 230, 237);
      doc.setLineWidth(0.2);
      for (let value = 1; value <= 9; value += 1) {
        doc.line(left, y(value), left + width, y(value));
        doc.setFontSize(8); doc.setTextColor(90, 100, 115);
        doc.text(String(value), left - 5, y(value) + 1, { align: "right" });
      }
      doc.setDrawColor(100, 110, 125);
      doc.line(left, top, left, bottom);
      doc.line(left, bottom, left + width, bottom);
      doc.setFontSize(8); doc.setTextColor(75, 85, 100);
      doc.text("Respuesta original (1–9)", margin, top - 4);
      doc.text("Sesiones en orden cronológico", left + width / 2, bottom + 12, { align: "center" });

      const actual = result.rows.filter((row) => row.observed !== null);
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.8);
      for (let index = 1; index < actual.length; index += 1) {
        const previous = actual[index - 1];
        const current = actual[index];
        if (current.session_number === previous.session_number + 1) {
          doc.line(x(previous.session_number), y(previous.observed), x(current.session_number), y(current.observed));
        }
      }
      doc.setFillColor(37, 99, 235);
      for (const point of actual) {
        doc.circle(x(point.session_number), y(point.observed), 1.3, "F");
        if (actual.length <= 24) {
          doc.setFontSize(7); doc.setTextColor(37, 75, 135);
          doc.text(String(point.observed), x(point.session_number), y(point.observed) - 2.2, { align: "center" });
        }
      }


      const tickStride = Math.max(1, Math.ceil(lastSession / 18));
      for (let sessionNumber = 1; sessionNumber <= lastSession; sessionNumber += tickStride) {
        doc.setFontSize(7); doc.setTextColor(90, 100, 115);
        doc.text(`S${sessionNumber}`, x(sessionNumber), bottom + 5, { align: "center" });
      }
      doc.setFontSize(8); doc.setTextColor(80, 90, 105);
      doc.text("Los espacios sin puntos representan respuestas faltantes; no se interpolan ni se convierten en cero.", margin, 177);
    }
  }
  if (!chartCount) return false;
  return true;
}

export async function createTrackingPdf({ tracking, sessions = [], evolution = [], detailsById = {}, demographics, generatedAt = new Date(), download = true }) {
  const [{ jsPDF }, tableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = tableModule.default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const code = tracking?.tracking_code || "Seguimiento";
  const chronological = [...sessions].sort((a, b) => String(a.fecha || a.session_date || "").localeCompare(String(b.fecha || b.session_date || ""))
    || String(a.hora || "").localeCompare(String(b.hora || "")) || String(a.session_id || "").localeCompare(String(b.session_id || "")));
  const start = chronological[0];
  const end = chronological.at(-1);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 22;
  doc.setFontSize(20);
  doc.setTextColor(25, 45, 80);
  doc.text("Informe de seguimiento", margin, y);
  y += 12;
  doc.setFontSize(12);
  doc.setTextColor(65, 75, 95);
  doc.text(`Identificador: ${code}`, margin, y);
  y += 7;
  doc.text(`Generado: ${generatedAt.toLocaleString("es-CL", { timeZone: "America/Santiago" })}`, margin, y);
  y += 7;
  doc.text(`Experiencias: ${chronological.length}`, margin, y);
  y += 7;
  doc.text(`Rango: ${chronological.length ? `${displayDate(start)} — ${displayDate(end)}` : "Sin sesiones"}`, margin, y);
  y += 7;
  doc.text(`Consistencia demográfica: ${demographics?.label || "Información insuficiente"}`, margin, y);
  y += 8;
  const intro = doc.splitTextToSize("Edad y género son datos declarados que apoyan la revisión de consistencia; no verifican la identidad de una persona. El grupo asignado por el cálculo con IA se conserva como información complementaria y no es un diagnóstico ni un porcentaje.", pageWidth - margin * 2);
  doc.setFontSize(9);
  doc.text(intro, margin, y);
  y += intro.length * 4 + 8;

  if (demographics?.differences?.length) {
    autoTable(doc, {
      startY: y,
      head: [["Revisión", "Sesión", "Edad registrada", "Género registrado"]],
      body: demographics.differences.map((row) => [
        [row.age_difference && "Edad", row.gender_difference && "Género"].filter(Boolean).join(" y "),
        `Sesión ${row.session_number}`, row.age || "Sin dato", row.gender || "Sin dato",
      ]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [40, 72, 120] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  const hasGeneralGraph = drawGeneralProgressChart(doc, evolution);
  const hasGraphs = drawTrackingCharts(doc, evolution) || hasGeneralGraph;
  if (!hasGraphs) {
    if (y > 270) { doc.addPage(); y = 18; }
    doc.setFontSize(9); doc.setTextColor(90, 100, 115);
    doc.text("No hay observaciones disponibles para generar gráficos por dimensión y fase.", margin, y);
  }

  if (chronological.length) {
    doc.addPage();
    doc.setFontSize(15); doc.setTextColor(25, 45, 80); doc.text("Sesiones y resultados", margin, 18);
    autoTable(doc, {
      startY: 24,
      head: [["Sesión", "Fecha", "Estado", "Grupo", "Edad", "Género"]],
      body: chronological.map((session, index) => {
        const detail = detailsById[session.session_id] || {};
        const model = getV8SessionSummary(detail.session_id ? detail : session);
        const demographic = demographics?.sessions?.find((row) => row.session_id === session.session_id);
        return [`Sesión ${index + 1}`, displayDate(session), detail.status || session.status || model.statusLabel, model.group === null ? "Sin grupo" : String(model.group), demographic?.age_label || "Sin dato", demographic?.gender || "Sin dato"];
      }),
      styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [40, 72, 120] },
    });
  }

  for (const [index, session] of chronological.entries()) {
    doc.addPage();
    const reference = `Sesión ${index + 1}`;
    const detail = detailsById[session.session_id] || {};
    const model = getV8SessionSummary(detail.session_id ? detail : session);
    const unityResponses = originalUnityResponses(detail);
    doc.setFontSize(15); doc.setTextColor(25, 45, 80); doc.text(`${reference} · ${displayDate(session)}`, margin, 18);
    autoTable(doc, {
      startY: 24,
      head: [["Campo", "Valor"]],
      body: [
        ["Estado de la sesión", safeText(detail.status || session.status || detail.ai_status || "Sin estado")],
        ["Estado del cálculo con IA", safeText(model.statusLabel)],
        ["Grupo", model.group === null ? "No disponible" : String(model.group)],
      ],
      styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [40, 72, 120] },
    });
    let nextY = doc.lastAutoTable.finalY + 7;
    doc.setFontSize(11); doc.setTextColor(25, 45, 80); doc.text("Respuestas originales de Unity", margin, nextY);
    autoTable(doc, {
      startY: nextY + 3,
      head: [["Pregunta", "Respuesta", "Etapa"]],
      body: unityResponses.map((response) => [
        safeText(response.pregunta || response.question || response.idPregunta || response.id_pregunta || "Respuesta registrada"),
        safeText(response.respuestaLabel ?? response.respuesta ?? response.answer ?? response.value),
        safeText(response.etapa || response.fase || response.escena || response.scene || "Sin etapa"),
      ]),
      styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [40, 72, 120] },
    });
    if (!unityResponses.length) {
      doc.setFontSize(8); doc.setTextColor(90, 100, 115); doc.text("No hay respuestas Unity disponibles para este registro.", margin, nextY + 9);
    }
  }

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFontSize(8); doc.setTextColor(120, 125, 135);
    doc.text(`${code} · Página ${page} de ${doc.getNumberOfPages()}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }
  if (download) doc.save(`${safeFilename(code)}-informe.pdf`);
  return doc;
}

export async function downloadTrackingWorkbook(options) {
  const [workbook, XLSX] = await Promise.all([buildTrackingWorkbook(options), import("xlsx")]);
  const code = safeFilename(options?.tracking?.tracking_code);
  XLSX.writeFile(workbook, `${code}-seguimiento.xlsx`);
  return workbook;
}
