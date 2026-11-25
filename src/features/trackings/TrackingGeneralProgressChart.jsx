import React, { useEffect, useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { formatChileDate } from "../sessions/sessionDisplay.js";
import { areGeneralIndexPointsComparable, buildSessionGeneralIndex } from "./trackingEmotionalSeries.js";
import { SkeletonChart } from "../../ui/LoadingState.jsx";

function experienceDate(point) {
  return point.session_date ? formatChileDate(point.session_date) || point.session_date : "Fecha no disponible";
}

function ExperienceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload.find((entry) => entry.dataKey === "value")?.payload;
  if (!point || !Number.isFinite(point.value)) return null;
  return <div className="el-trackings-chart-tooltip">
    <strong>Experiencia {point.session_number}</strong>
    <span>Fecha: {experienceDate(point)}</span>
    <span>Resultado general: {point.value.toFixed(1)} de 9</span>
    <span>Respuestas consideradas: {point.phases_used}</span>
    <span>Aspectos evaluados: {point.dimensions_used}</span>
  </div>;
}

function comparableSegments(rows) {
  const segments = [];
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    if (!areGeneralIndexPointsComparable(previous, current)) continue;
    const key = `segment_${segments.length}`;
    previous[key] = previous.value;
    current[key] = current.value;
    segments.push(key);
  }
  return segments;
}

export default function TrackingGeneralProgressChart({ sessions = [], loading = false }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const rows = useMemo(() => buildSessionGeneralIndex(sessions), [sessions]);
  const segments = useMemo(() => comparableSegments(rows), [rows]);
  const validPoints = rows.filter((row) => Number.isFinite(row.value));
  const selectedPoint = validPoints.find((point) => point.session_id === selectedSessionId) || null;

  useEffect(() => setSelectedSessionId(null), [sessions]);

  return <section className="el-trackings-chart el-tracking-general-progress" aria-label="Evolución de las experiencias">
    <header className="el-tracking-general-heading">
      <div>
        <span className="el-tracking-eyebrow">Resumen por experiencia</span>
        <h3>Evolución general de las respuestas</h3>
      </div>
    </header>
    {loading ? <SkeletonChart label="Cargando evolución de las experiencias" />
      : !validPoints.length ? <p role="status" className="el-tracking-analysis-empty">Todavía no hay respuestas disponibles para mostrar.</p>
        : <>
          <div className="el-tracking-general-chart">
            <ResponsiveContainer>
              <ComposedChart data={rows} margin={{ top: 20, right: 24, bottom: 22, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session_number" type="number" domain={[1, "dataMax"]} allowDecimals={false} tickFormatter={(value) => `Exp. ${value}`} label={{ value: "Experiencias registradas", position: "insideBottom", offset: -10 }} />
                <YAxis type="number" domain={[1, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]} allowDecimals={false} label={{ value: "Resultado general", angle: -90, position: "insideLeft" }} />
                <Tooltip content={<ExperienceTooltip />} />
                {segments.map((key) => <Line key={key} type="linear" dataKey={key} stroke="#2563eb" strokeWidth={2.5} connectNulls={false} dot={false} activeDot={false} isAnimationActive={false} />)}
                <Scatter dataKey="value" name="Resultado general" fill="#2563eb" shape="circle" isAnimationActive={false} onClick={(point) => setSelectedSessionId(point?.payload?.session_id || point?.session_id || null)} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {selectedPoint ? <div className="el-tracking-general-selected" aria-live="polite">
            <strong>Experiencia {selectedPoint.session_number}</strong>
            <span>Fecha: {experienceDate(selectedPoint)}</span>
            <span>Resultado general: {selectedPoint.value.toFixed(1)} de 9</span>
            <span>Respuestas consideradas: {selectedPoint.phases_used}</span>
            <span>Aspectos evaluados: {selectedPoint.dimensions_used}</span>
          </div> : <p className="el-tracking-general-method">Cada punto resume el resultado general de una experiencia registrada. Selecciona un punto para consultar sus datos y acompáñalo con el resto de la información del seguimiento.</p>}
          {validPoints.length < rows.length && <p className="el-tracking-general-method">Las experiencias sin respuestas válidas se mantienen sin punto.</p>}
        </>}
  </section>;
}
