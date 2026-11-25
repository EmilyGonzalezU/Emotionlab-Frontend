import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiArrowRight, FiClock, FiTrash2 } from "react-icons/fi";
import Button from "../../ui/Button.jsx";
import { SkeletonLine, SkeletonRows } from "../../ui/LoadingState.jsx";
import { formatChileDate, formatChileInstant } from "../sessions/sessionDisplay.js";
import TrackingGeneralProgressChart from "./TrackingGeneralProgressChart.jsx";
import { getV8SessionSummary } from "../sessions/sessionModelDisplay.js";
import "./TrackingOverviewCard.css";

function sessionDate(session) {
  const value = session.fecha || session.session_date || session.capture_started_at;
  return formatChileDate(value) || value || "Fecha no disponible";
}

function hasEvolutionData(session, evolutionById) {
  const point = evolutionById.get(session.session_id);
  if (!point) return false;
  if (point.model_version === "1.0.0-experimental") {
    return Array.isArray(point.observations) && point.observations.length > 0;
  }
  return typeof point.wellbeing === "number" && Number.isFinite(point.wellbeing);
}

function V8SessionResult({ session }) {
  const result = getV8SessionSummary(session);
  return <span className={`el-tracking-ai-result ${result.statusTone}`}>
    <strong>Resultado del cálculo</strong>
    <span>{result.isV8 && result.group !== null ? `Grupo ${result.group}` : "No disponible"}</span>
  </span>;
}

export default function TrackingOverviewCard({
  trackingId,
  trackingCode,
  createdAt,
  demographics,
  sessions = [],
  evolution = [],
  loading = false,
  evolutionError = null,
  associationNotice = "",
  actions,
  onRemove,
  onRetry,
}) {
  const evolutionById = new Map(evolution.map((point) => [point.session_id, point]));
  const chronologicalSessions = [...sessions].sort((a, b) =>
    String(a.session_date || a.fecha || a.capture_started_at || "").localeCompare(String(b.session_date || b.fecha || b.capture_started_at || ""))
    || String(a.session_id || "").localeCompare(String(b.session_id || "")));
  const completeRecords = sessions.length > 0 && sessions.every((session) => {
    const model = getV8SessionSummary(session);
    const data = evolutionById.get(session.session_id);
    return model.status === "analyzed" && (data?.observations?.length > 0 || Number.isFinite(data?.wellbeing));
  });

  return (
    <article className="el-tracking-overview-card">
      <header className="el-tracking-overview-header">
        <div className="el-tracking-overview-title">
          <span className="el-tracking-eyebrow">Seguimiento</span>
          <h2>{trackingCode || "Seguimiento"}</h2>
        </div>
        <div className="el-tracking-overview-meta">
          {loading ? <span className="el-tracking-session-count"><SkeletonLine width={92} /></span> : <span className="el-tracking-session-count"><FiActivity aria-hidden="true" /> {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}</span>}
          {loading && <span className="el-tracking-updating"><FiClock aria-hidden="true" /> Actualizando…</span>}
          {actions}
        </div>
      </header>

      <div className="el-tracking-summary-meta">
        <div><span>Creado</span><strong>{formatChileInstant(createdAt) || "Sin fecha"}</strong></div>
        <div><span>Estado de los registros</span><strong>{loading ? <SkeletonLine width={100} /> : sessions.length === 0 ? "Sin sesiones" : completeRecords ? "Datos disponibles" : "Revisión de datos"}</strong></div>
        <div><span>Consistencia demográfica</span><strong className={`status-${demographics?.status || "insufficient"}`}>{loading ? <SkeletonLine width={125} /> : demographics?.label || "Información insuficiente"}</strong></div>
        {trackingId && <Link className="el-tracking-detail-link" to={`/teacher/experiencias/${encodeURIComponent(trackingId)}`}><span>Ver detalle</span><FiArrowRight aria-hidden="true" /></Link>}
      </div>
      {associationNotice && <p className="el-tracking-association-notice" role="status">{associationNotice}</p>}

      <div className="el-tracking-overview-content">
        <section className="el-tracking-sessions" aria-labelledby="el-tracking-sessions-title">
          <div className="el-tracking-section-heading">
            <div>
              <span className="el-tracking-eyebrow">Actividad</span>
              <h3 id="el-tracking-sessions-title">Sesiones asociadas</h3>
            </div>
            <span className="el-tracking-count-pill">{loading ? <SkeletonLine width={20} /> : sessions.length}</span>
          </div>

          {loading ? <SkeletonRows rows={3} columns={1} /> : sessions.length === 0 ? (
            <div className="el-tracking-empty-sessions">
              <FiActivity aria-hidden="true" />
              <strong>Aún no hay sesiones</strong>
              <span>Cuando agregues sesiones, aparecerán aquí junto a sus datos disponibles.</span>
            </div>
          ) : (
            <ul className="el-tracking-session-list">
              {chronologicalSessions.map((session, index) => {
                const available = hasEvolutionData(session, evolutionById);
                return (
                  <li key={session.session_id}>
                    <Link
                      className="el-tracking-session-link"
                      to={`/teacher/sesiones/${encodeURIComponent(session.session_id)}`}
                    >
                      <span className="el-tracking-session-icon"><FiActivity aria-hidden="true" /></span>
                      <span className="el-tracking-session-main">
                        <strong>Experiencia {index + 1}</strong>
                        <code className="el-tracking-session-id" title={session.session_id}>{session.session_id}</code>
                        <span>{sessionDate(session)}</span>
                        <V8SessionResult session={session} />
                      </span>
                      <span className="el-tracking-session-side">
                        <span className={`el-tracking-data-status ${available ? "is-available" : "is-pending"}`}>
                          <i aria-hidden="true" />
                          {available ? "Datos disponibles" : "Sin datos para evolución"}
                        </span>
                      </span>
                    </Link>
                    {onRemove && <Button className="el-tracking-session-remove" variant="ghost" size="sm" icon={FiTrash2} onClick={() => onRemove(session.session_id)} disabled={loading} aria-label={`Desvincular experiencia ${index + 1}`} title="Desvincular sesión" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="el-tracking-evolution" aria-label="Evolución del seguimiento">
          {evolutionError ? <div className="el-tracking-chart-error" role="alert">
            <FiActivity aria-hidden="true" />
            <strong>No se pudo cargar la evolución</strong>
            <span>{evolutionError.message || "El servidor no devolvió los datos de evolución."}</span>
            {Number.isInteger(evolutionError.status) && evolutionError.status > 0 && <small>HTTP {evolutionError.status}</small>}
            {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Reintentar</Button>}
          </div> : <TrackingGeneralProgressChart sessions={evolution} loading={loading} />}
        </section>
      </div>
    </article>
  );
}
