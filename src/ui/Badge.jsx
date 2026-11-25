import React from "react";
import "./Badge.css";

const TONES = ["success", "warning", "danger", "info", "neutral", "brand"];

/**
 * Indicador de estado. Reemplaza los `badge-estado` / `badge-rol` con
 * colores en línea repetidos por pantalla. El color siempre representa
 * un estado real (aprobado, pendiente, rechazado, activo/inactivo,
 * rol) — nunca es decorativo.
 */
export default function Badge({ tone = "neutral", children }) {
  const toneClass = TONES.includes(tone) ? tone : "neutral";
  return <span className={`el-badge el-badge-${toneClass}`}>{children}</span>;
}
