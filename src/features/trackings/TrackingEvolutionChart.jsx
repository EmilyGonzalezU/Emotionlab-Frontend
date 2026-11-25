import React, { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatChileDate } from "../sessions/sessionDisplay.js";
import { TRACKING_DIMENSIONS, buildSessionPhaseRows } from "./trackingEmotionalSeries.js";
import { SkeletonChart } from "../../ui/LoadingState.jsx";

const PHASES = [
  { id: "PRE", label: "PRE", color: "#2563eb" },
  { id: "FACIL", label: "Modo fácil", color: "#0f9f8f" },
  { id: "DIFICIL", label: "Modo difícil", color: "#9333ea" },
];

function ObservedTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const points = payload.filter((item) => item.value !== null && item.value !== undefined);
  if (!points.length) return null;
  return <div className="el-trackings-chart-tooltip"><strong>Sesión {label}</strong>
    {row?.session_date && <span>Fecha: {formatChileDate(row.session_date) || row.session_date}</span>}
    {points.map((point) => <span key={point.dataKey}>{point.name}: {point.value} / 9</span>)}
  </div>;
}

export default function TrackingEvolutionChart({ sessions = [], loading = false, onDimensionChange }) {
  const [dimensionId, setDimensionId] = useState("nerviosismo");
  const [phase, setPhase] = useState("PRE");
  const [view, setView] = useState("session");
  const dimension = TRACKING_DIMENSIONS.find((item) => item.id === dimensionId) || TRACKING_DIMENSIONS[0];
  useEffect(() => { if (!dimension.phases.includes(phase)) setPhase(dimension.phases[0]); }, [dimension, phase]);
  const result = useMemo(() => buildSessionPhaseRows(sessions, dimensionId), [sessions, dimensionId]);
  const visiblePhases = view === "compare" ? dimension.phases : [phase];

  function changeDimension(value) {
    setDimensionId(value);
    const next = TRACKING_DIMENSIONS.find((item) => item.id === value);
    setPhase(next?.phases[0] || "PRE");
    onDimensionChange?.(value, next?.phases[0]);
  }

  return <section className="el-trackings-chart el-tracking-analysis-chart" aria-label="Análisis de respuestas por dimensión">
    <div className="el-tracking-analysis-heading">
      <div><span className="el-tracking-eyebrow">Respuestas originales</span><h3>Evolución por dimensiones</h3></div>
      <div className="el-tracking-analysis-selectors">
        <label>Dimensión<select value={dimensionId} onChange={(event) => changeDimension(event.target.value)}>{TRACKING_DIMENSIONS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        {view === "session" && <label>Fase<select value={phase} onChange={(event) => setPhase(event.target.value)}>{dimension.phases.map((item) => <option value={item} key={item}>{PHASES.find((entry) => entry.id === item)?.label}</option>)}</select></label>}
      </div>
    </div>
    <div className="el-trackings-view-toggle" role="group" aria-label="Vista de evolución">
      <button type="button" aria-pressed={view === "session"} onClick={() => setView("session")}>Evolución entre sesiones</button>
      <button type="button" aria-pressed={view === "compare"} onClick={() => setView("compare")}>Comparar fases</button>
    </div>
    {loading ? <SkeletonChart label="Cargando datos de evolución" />
      : !result.observations.some((point) => visiblePhases.includes(point.phase)) ? <p role="status" className="el-tracking-analysis-empty">No hay respuestas originales válidas para esta dimensión y fase.</p>
        : <>
          <div className="el-tracking-general-legend">{visiblePhases.map((item) => { const visual = PHASES.find((entry) => entry.id === item); return <span key={item}><i style={{ backgroundColor: visual.color }} />{visual.label}</span>; })}</div>
          <div className="el-trackings-chart-canvas el-tracking-analysis-canvas">
            <ResponsiveContainer><LineChart data={result.rows} margin={{ top: 18, right: 16, bottom: 12, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session_number" type="number" domain={[1, "dataMax"]} allowDecimals={false} tickFormatter={(value) => `S${value}`} label={{ value: "Sesiones en orden cronológico", position: "insideBottom", offset: -4 }} />
              <YAxis type="number" domain={[1, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]} allowDecimals={false} label={{ value: "Respuesta (1–9)", angle: -90, position: "insideLeft" }} />
              <Tooltip content={<ObservedTooltip />} />
              {visiblePhases.map((item) => { const visual = PHASES.find((entry) => entry.id === item); return <Line key={item} type="linear" dataKey={item} name={visual.label} stroke={visual.color} strokeWidth={2.5} connectNulls={false} dot={{ r: 4 }} activeDot={{ r: 6 }} />; })}
            </LineChart></ResponsiveContainer>
          </div>
        </>}
  </section>;
}
