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

/**
 * Obtiene la solicitud más relevante para una sesión.
 *
 * Se usa la más reciente por fecha de actualización/creación. Priorizar
 * el estado PENDING sobre la fecha hacía que una solicitud vieja pendiente
 * ocultara otra posterior ya aprobada o lista para descargar.
 */
export function obtenerSolicitudRelevante(solicitudes) {
  if (!Array.isArray(solicitudes) || solicitudes.length === 0) {
    return null;
  }
  const fecha = (solicitud) => String(
    solicitud?.updated_at
      || solicitud?.reviewed_at
      || solicitud?.requested_at
      || solicitud?.created_at
      || ""
  );
  return solicitudes.reduce((latest, request) =>
    !latest || fecha(request) > fecha(latest) ? request : latest, null);
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
