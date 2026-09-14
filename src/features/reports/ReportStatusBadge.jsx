import React from "react";
import Badge from "../../ui/Badge.jsx";

// Estados reales tal como los entrega el backend — nunca se inventa un
// estado nuevo, solo se traduce a una etiqueta legible + color.
const ESTADOS = {
  PENDING: { label: "Pendiente de revisión", tone: "warning" },
  APPROVED: { label: "Aprobado", tone: "brand" },
  REJECTED: { label: "Rechazado", tone: "danger" },
  COMPLETED: { label: "Disponible para descarga", tone: "success" },
};

/**
 * Traduce el estado real de una solicitud de reporte (PENDING/
 * APPROVED/REJECTED/COMPLETED) a un Badge consistente. Si el backend
 * alguna vez entrega un estado distinto de estos cuatro, se muestra
 * tal cual en vez de forzarlo a uno de los conocidos.
 */
export default function ReportStatusBadge({ status }) {
  const clave = status ? String(status).toUpperCase() : null;
  const info = clave ? ESTADOS[clave] : null;

  if (!info) {
    return <Badge tone="neutral">{status || "Sin solicitud"}</Badge>;
  }

  return <Badge tone={info.tone}>{info.label}</Badge>;
}
