import React from "react";
import Badge from "../../ui/Badge.jsx";
import { getV8SessionSummary } from "./sessionModelDisplay.js";

export default function V8CaptureSummary({ session }) {
  const summary = getV8SessionSummary(session);
  return <div className="el-capture-stages">
    <h3>Cálculo con IA</h3>
    <p><span>Estado</span><Badge tone={summary.statusTone}>{summary.statusLabel}</Badge></p>
    {summary.isV8
      ? summary.group !== null && <p><span>Grupo</span><strong>{summary.groupLabel}</strong></p>
      : <p role="status">Todavía no hay un cálculo con IA disponible para esta sesión.</p>}
    {summary.error && <p role="alert">{summary.error}</p>}
  </div>;
}
