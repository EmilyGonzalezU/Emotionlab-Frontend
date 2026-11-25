import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiExternalLink, FiFileText, FiRefreshCw } from "react-icons/fi";
import Button from "../../ui/Button.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import { formatChileInstant } from "../sessions/sessionDisplay.js";
import { getV8SessionSummary } from "../sessions/sessionModelDisplay.js";
import { originalUnityResponses, validateTrackingDemographics } from "./trackingAnalysis.js";
import TrackingEvolutionChart from "./TrackingEvolutionChart.jsx";
import { useCreateTrackingReportRequest, useMyReportRequests } from "../reports/useReports.js";
import { fetchTrackingReportDownloadUrl } from "../reports/reportsApi.js";
import { obtenerSolicitudRelevante } from "../reports/reportHelpers.js";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import "./TrackingDetailWorkspace.css";

const dateText = (session) => formatChileInstant(session?.session_date || session?.capture_started_at)
  || [session?.fecha, session?.hora].filter(Boolean).join(" ") || "Fecha no disponible";

function SessionAiResult({ session, detail, reference }) {
  const source = detail?.session_id ? detail : session;
  const result = getV8SessionSummary(source);
  return <article className="el-tracking-ai-record">
    <div className="el-tracking-ai-record-heading">
      <div><span className="el-tracking-eyebrow">{reference}</span><h4>Cálculo con IA</h4></div>
      <span className={`el-tracking-ai-status ${result.statusTone}`}>{result.statusLabel}</span>
    </div>
    <dl>
      <div><dt>Resultado asignado</dt><dd>{result.group === null ? "No disponible" : `Grupo ${result.group}`}</dd></div>
      <div><dt>Estado</dt><dd>{result.statusLabel}</dd></div>
    </dl>
    <p className="el-tracking-ai-disclaimer">Resultado experimental de apoyo. No constituye un diagnóstico.</p>
  </article>;
}

function overviewDate(values) {
  const dates = values.map((session) => Date.parse(session.fecha || session.session_date || session.capture_started_at || ""))
    .filter(Number.isFinite).sort((a, b) => a - b);
  if (!dates.length) return "Sin fechas disponibles";
  const format = (value) => new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "medium" }).format(new Date(value));
  return dates.length > 1 ? `${format(dates[0])} - ${format(dates.at(-1))}` : format(dates[0]);
}

export default function TrackingDetailWorkspace({ tracking, sessions = [], evolution = [], detailsById = {}, detailsLoading = false, loading = false, onRefresh, refreshing = false }) {
  const chronologicalSessions = useMemo(() => [...sessions].sort((a, b) =>
    String(a.fecha || a.session_date || a.capture_started_at || "").localeCompare(String(b.fecha || b.session_date || b.capture_started_at || ""))
    || String(a.hora || "").localeCompare(String(b.hora || ""))
    || String(a.session_id || "").localeCompare(String(b.session_id || ""))), [sessions]);
  const indexById = useMemo(() => new Map(chronologicalSessions.map((session, index) => [session.session_id, index + 1])), [chronologicalSessions]);
  const demographics = useMemo(() => validateTrackingDemographics(chronologicalSessions, detailsById), [chronologicalSessions, detailsById]);
  const ageValues = [...new Set(demographics.sessions.map((record) => record.age_label).filter(Boolean))];
  const genderValues = [...new Set(demographics.sessions.map((record) => record.gender).filter(Boolean))];
  const [selectedSessionId, setSelectedSessionId] = useState(chronologicalSessions[0]?.session_id || "");
  const [exporting, setExporting] = useState("");
  const [confirmTrackingReport, setConfirmTrackingReport] = useState(false);
  const [requestedFormat, setRequestedFormat] = useState("PDF");
  const [reportNotice, setReportNotice] = useState("");
  const { data: reportRequestsData } = useMyReportRequests();
  const createTrackingReportRequest = useCreateTrackingReportRequest();
  const queryClient = useQueryClient();
  const selectedSession = chronologicalSessions.find((session) => session.session_id === selectedSessionId) || chronologicalSessions[0];
  const selectedDetail = selectedSession ? detailsById[selectedSession.session_id] || {} : {};
  const selectedResponses = originalUnityResponses(selectedDetail);
  const trackingRequests = (Array.isArray(reportRequestsData) ? reportRequestsData : reportRequestsData?.items || [])
    .filter((item) => item.report_type === "TRACKING" && String(item.tracking_id || "") === String(tracking?.tracking_id || ""));
  const trackingPdfRequest = obtenerSolicitudRelevante(trackingRequests.filter((item) => String(item.report_format || "PDF").toUpperCase() === "PDF"));
  const trackingExcelRequest = obtenerSolicitudRelevante(trackingRequests.filter((item) => String(item.report_format || "PDF").toUpperCase() === "XLSX"));

  useEffect(() => {
    const statuses = [trackingPdfRequest?.status, trackingExcelRequest?.status].map((status) => String(status || "").toUpperCase());
    if (statuses.some((status) => ["APPROVED", "COMPLETED", "ERROR", "REJECTED"].includes(status))) {
      setReportNotice("");
    }
  }, [trackingPdfRequest?.status, trackingExcelRequest?.status]);

  async function handleTrackingReport(format) {
    const trackingRequest = format === "XLSX" ? trackingExcelRequest : trackingPdfRequest;
    const status = String(trackingRequest?.status || "").toUpperCase();
    if (status === "COMPLETED" && !trackingRequest.downloaded_at) {
      const requestId = trackingRequest.report_request_id || trackingRequest.request_id || trackingRequest.id;
      if (!requestId) { setReportNotice("No se encontró la solicitud aprobada para descargar el informe."); return; }
      setExporting(format); setReportNotice("");
      try {
        const result = await fetchTrackingReportDownloadUrl(tracking.tracking_id, requestId);
        if (!result?.download_url) throw new Error("El servidor no devolvió el enlace de descarga.");
        window.open(result.download_url, "_blank", "noopener,noreferrer");
        await queryClient.invalidateQueries({ queryKey: ["reportRequests", "mine"] });
      } catch (error) {
        setReportNotice(error?.message || "No se pudo descargar el informe aprobado.");
      } finally { setExporting(""); }
      return;
    }
    if (status === "PENDING" || status === "APPROVED") {
      setReportNotice(status === "PENDING" ? "La solicitud está pendiente de aprobación del administrador." : "El administrador aprobó la solicitud y el informe se está generando.");
      return;
    }
    setReportNotice("");
    setRequestedFormat(format);
    setConfirmTrackingReport(true);
  }

  function confirmCreateTrackingReport() {
    createTrackingReportRequest.mutate({ trackingId: tracking.tracking_id, reportFormat: requestedFormat }, {
      onSuccess: () => {
        setConfirmTrackingReport(false);
        setReportNotice(`Solicitud de ${requestedFormat === "XLSX" ? "Excel" : "PDF"} enviada al administrador. Podrás descargarla cuando sea aprobada y esté lista.`);
      },
      onError: (error) => {
        setConfirmTrackingReport(false);
        setReportNotice(error?.message || "No se pudo enviar la solicitud del informe.");
      },
    });
  }
  const pdfStatus = String(trackingPdfRequest?.status || "").toUpperCase();
  const excelStatus = String(trackingExcelRequest?.status || "").toUpperCase();

  return <div className="el-tracking-detail-workspace">
    <div className="el-tracking-detail-topbar">
      <Link to="/teacher/experiencias" className="el-tracking-back-link"><FiArrowLeft aria-hidden="true" /> Volver a seguimientos</Link>
      <div className="el-tracking-detail-actions" aria-label="Acciones del seguimiento">
        <Button variant="secondary" size="sm" icon={FiRefreshCw} onClick={onRefresh} loading={refreshing}>Actualizar</Button>
        <span className="el-tracking-actions-divider" aria-hidden="true" />
        <Button variant="primary" size="sm" icon={pdfStatus === "COMPLETED" && !trackingPdfRequest?.downloaded_at ? FiDownload : FiFileText} onClick={() => handleTrackingReport("PDF")} loading={exporting === "PDF" || createTrackingReportRequest.isPending} disabled={Boolean(exporting) || chronologicalSessions.length === 0}>
          {pdfStatus === "PENDING" ? "PDF: pendiente" : pdfStatus === "APPROVED" ? "PDF: en preparación" : pdfStatus === "COMPLETED" && !trackingPdfRequest?.downloaded_at ? "Descargar PDF" : pdfStatus === "ERROR" ? "Solicitar PDF nuevamente" : "Solicitar informe PDF"}
        </Button>
        <Button variant="secondary" size="sm" icon={excelStatus === "COMPLETED" && !trackingExcelRequest?.downloaded_at ? FiDownload : FiFileText} onClick={() => handleTrackingReport("XLSX")} loading={exporting === "XLSX" || createTrackingReportRequest.isPending} disabled={Boolean(exporting) || chronologicalSessions.length === 0}>
          {excelStatus === "PENDING" ? "Excel: pendiente" : excelStatus === "APPROVED" ? "Excel: en preparación" : excelStatus === "COMPLETED" && !trackingExcelRequest?.downloaded_at ? "Descargar Excel" : excelStatus === "ERROR" ? "Solicitar Excel nuevamente" : "Solicitar Excel"}
        </Button>
      </div>
    </div>
    {[trackingPdfRequest, trackingExcelRequest].filter((item) => item?.status === "ERROR").map((trackingRequest) => <p key={trackingRequest.report_format || "PDF"} className="el-tracking-export-error" role="alert">
      No se pudo preparar el informe tras aprobar la solicitud. Puedes volver a solicitarlo.
      {trackingRequest.generation_error && <small className="el-tracking-report-error-detail"> Detalle: {String(trackingRequest.generation_error).slice(0, 240)}</small>}
    </p>)}
    {reportNotice && <p className="el-tracking-report-notice" role="status">{reportNotice}</p>}

    <header className="el-tracking-detail-hero">
      <div><span className="el-tracking-eyebrow">Detalle del seguimiento</span><h1>{tracking?.tracking_code || "Seguimiento"}</h1><p>Historial de experiencias, respuestas originales y evolución registrada.</p></div>
      <div className="el-tracking-detail-hero-count"><strong>{chronologicalSessions.length}</strong><span>{chronologicalSessions.length === 1 ? "sesión asociada" : "sesiones asociadas"}</span></div>
    </header>

    <section className="el-tracking-detail-summary" aria-labelledby="tracking-summary-title">
      <div className="el-tracking-detail-section-heading"><div><span className="el-tracking-eyebrow">Resumen</span><h2 id="tracking-summary-title">Informaci&#xF3;n del seguimiento</h2></div></div>
      <dl className="el-tracking-detail-metrics">
        <div><dt>Creado</dt><dd>{formatChileInstant(tracking?.created_at) || "Sin fecha"}</dd></div>
        <div><dt>Periodo registrado</dt><dd>{overviewDate(chronologicalSessions)}</dd></div>
        <div><dt>Edades registradas</dt><dd>{ageValues.length ? ageValues.join(", ") : "Sin dato"}</dd></div>
        <div><dt>G&#xE9;neros registrados</dt><dd>{genderValues.length ? genderValues.join(", ") : "Sin dato"}</dd></div>
      </dl>
    </section>

    <section className="el-tracking-detail-section" aria-labelledby="tracking-session-list-title">
      <div className="el-tracking-detail-section-heading"><div><span className="el-tracking-eyebrow">Historial</span><h2 id="tracking-session-list-title">Sesiones y respuestas</h2></div><span>{chronologicalSessions.length} {chronologicalSessions.length === 1 ? "sesi\u00f3n" : "sesiones"}</span></div>
      {loading ? <SkeletonRows rows={5} columns={2} /> : chronologicalSessions.length === 0
        ? <p className="el-tracking-detail-empty">No hay sesiones asociadas a este seguimiento.</p>
        : <div className="el-tracking-detail-session-grid">
          <nav className="el-tracking-detail-session-nav" aria-label="Seleccionar sesión">
            <ul className="el-tracking-detail-session-list">
              {chronologicalSessions.map((session, index) => {
                const detail = detailsById[session.session_id] || {};
                const model = getV8SessionSummary(detail.session_id ? detail : session);
                const responses = originalUnityResponses(detail);
                const selected = session.session_id === selectedSession?.session_id;
                const demographic = demographics.sessions.find((row) => row.session_id === session.session_id);
                const responseStatus = detail.detail_error
                  ? "No se pudieron cargar las respuestas"
                  : detailsLoading
                    ? "Cargando respuestas..."
                    : detail.session_id
                      ? responses.length ? "Respuestas disponibles" : "Respuestas no disponibles"
                      : "Selecciona para ver las respuestas";
                return <li key={session.session_id}><button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => setSelectedSessionId(session.session_id)}>
                  <span className="el-tracking-detail-session-number">{index + 1}</span>
                  <span className="el-tracking-detail-session-copy"><strong>Sesi&#xF3;n {index + 1}</strong><small>{dateText(session)}</small><small>{responseStatus}</small><small>{model.group === null ? model.statusLabel : `Grupo ${model.group}`}</small><small>Edad {demographic?.age_label || "-"} | G&#xE9;nero {demographic?.gender || "-"}</small></span>
                </button></li>;
              })}
            </ul>
          </nav>
          {selectedSession && <article className="el-tracking-selected-session">
            <header className="el-tracking-selected-session-header"><div><span className="el-tracking-eyebrow">Experiencia {indexById.get(selectedSession.session_id)}</span><h3>{dateText(selectedSession)}</h3><code>{selectedSession.session_id}</code></div><Link to={`/teacher/sesiones/${encodeURIComponent(selectedSession.session_id)}`} state={{ fromTracking: tracking?.tracking_id }}><FiExternalLink aria-hidden="true" /> Abrir sesión</Link></header>
            <div className="el-tracking-selected-session-columns">
              <section className="el-tracking-original-responses"><h4>Respuestas originales de Unity</h4>{detailsLoading ? <SkeletonRows rows={5} columns={1} /> : selectedResponses.length ? <ul>{selectedResponses.map((response, index) => <li key={`${response.idPregunta || response.id_pregunta || index}-${index}`}><strong>{response.pregunta || response.question || response.idPregunta || response.id_pregunta || `Respuesta ${index + 1}`}</strong><span>{response.respuestaLabel ?? response.respuesta ?? response.answer ?? response.value ?? "Sin respuesta"}</span><small>{response.etapa || response.fase || response.escena || response.scene || "Etapa no identificada"}</small></li>)}</ul> : selectedDetail.detail_error ? <p>No se pudieron cargar las respuestas. Actualiza la vista para volver a intentarlo.</p> : <p>Los detalles de las respuestas originales no est\u00e1n disponibles para esta sesi\u00f3n.</p>}</section>
              <SessionAiResult session={selectedSession} detail={selectedDetail} reference={`Sesión ${indexById.get(selectedSession.session_id)}`} />
            </div>
          </article>}
        </div>}
    </section>

    <section className="el-tracking-detail-section el-tracking-detail-analysis" aria-labelledby="tracking-analysis-title">
      <div className="el-tracking-detail-section-heading"><div><span className="el-tracking-eyebrow">Análisis descriptivo</span><h2 id="tracking-analysis-title">Evolución por dimensión y fase</h2></div><p>Respuestas originales en escala 1-9; cada serie conserva su dimensión y fase.</p></div>
      <TrackingEvolutionChart sessions={evolution} loading={loading} />
    </section>
    <ConfirmationDialog
      open={confirmTrackingReport}
      title={`Solicitar informe ${requestedFormat === "XLSX" ? "Excel" : "PDF"}`}
      message={`Se enviará al administrador una solicitud para generar el informe ${requestedFormat === "XLSX" ? "Excel" : "PDF"} con las ${chronologicalSessions.length} sesiones actualmente asignadas.`}
      confirmLabel="Enviar solicitud"
      cancelLabel="Cancelar"
      loading={createTrackingReportRequest.isPending}
      onConfirm={confirmCreateTrackingReport}
      onCancel={() => setConfirmTrackingReport(false)}
    />
  </div>;
}
