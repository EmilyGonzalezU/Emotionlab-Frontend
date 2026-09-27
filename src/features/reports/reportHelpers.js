/**
 * Lógica de estado de las solicitudes de reporte.
 *
 * El backend identifica cada solicitud mediante su report_request_id
 * y session_id. La descarga del PDF se solicita posteriormente mediante
 * GET /report-requests/:id/download.
 *
 * No se inventan estados ni URLs de descarga.
 *
 * "error" NO se considera un estado válido de solicitud — nunca se
 * elige por encima de otros estados y se etiqueta explícitamente
 * como error cuando aparece.
 */

const PRIORIDAD_ESTADOS = [
  "COMPLETED",
  "APPROVED",
  "PENDING",
  "REJECTED",
];

/**
 * Obtiene la solicitud más relevante para una sesión.
 *
 * El flujo actual maneja una solicitud de reporte por sesión, por lo que
 * no se depende de motivo === PDF/EXCEL.
 *
 * Las solicitudes con status === "error" quedan en último lugar (no son
 * estados válidos para priorizar sobre el resto).
 */
export function obtenerSolicitudRelevante(solicitudes) {
  if (!Array.isArray(solicitudes) || solicitudes.length === 0) {
    return null;
  }

  for (const estado of PRIORIDAD_ESTADOS) {
    const encontrada = solicitudes.find(
      (solicitud) =>
        String(solicitud?.status || "").toUpperCase() === estado
    );

    if (encontrada) {
      return encontrada;
    }
  }

  // Si todas las solicitudes restantes tienen estado desconocido/error,
  // devolvemos la primera pero nunca se inventará un estado válido.
  return solicitudes[0] || null;
}

/**
 * Etiqueta del botón de solicitud/descarga.
 */
export function obtenerEtiquetaSolicitud(solicitud) {
  if (!solicitud) {
    return "Solicitar reporte";
  }

  const estado = String(solicitud.status || "").toUpperCase();

  if (estado === "ERROR") {
    return "Error en la solicitud";
  }

  if (estado === "PENDING") {
    return "Solicitud pendiente";
  }

  if (estado === "APPROVED") {
    return "Reporte aprobado";
  }

  if (estado === "COMPLETED") {
    if (solicitud.downloaded_at) {
      return "Reporte descargado";
    }
    return "Descargar reporte";
  }

  if (estado === "REJECTED") {
    return "Solicitud rechazada";
  }

  return "Solicitar reporte";
}