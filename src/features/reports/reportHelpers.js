/**
 * Lógica de estado de las solicitudes de reporte (PDF/Excel), sin
 * ningún endpoint ni dato inventado.
 *
 * Nota histórica: esta primera versión de la Fase 4 intentaba adivinar
 * la URL de descarga buscando varios nombres de campo posibles
 * (download_url/file_url/...) directamente en el objeto de la
 * solicitud. Con acceso al backend real se confirmó que eso nunca
 * podía funcionar: no existe tal campo en la lista — la URL
 * presignada de S3 se obtiene bajo demanda llamando
 * GET /report-requests/:id/download (ver reportsApi.js
 * -> fetchReportDownloadUrl), válida solo 300 segundos. Por eso esa
 * búsqueda defensiva se retiró de aquí.
 */

/**
 * De todas las solicitudes de un tipo (PDF/EXCEL) para una sesión,
 * elige la más relevante para mostrar en el botón correspondiente:
 * una completada o aprobada se muestra antes que una pendiente, y una
 * pendiente antes que una rechazada. Si no hay ninguna solicitud de
 * ese tipo, devuelve null (todavía no se ha solicitado nada — nunca
 * se inventa un estado por defecto).
 */
export function obtenerSolicitudRelevante(solicitudes, tipo) {
  const deTipo = (solicitudes || []).filter((s) => (s.motivo || "").toUpperCase() === tipo);
  if (deTipo.length === 0) return null;

  const porEstado = (estado) =>
    deTipo.find((s) => String(s.status || "").toUpperCase() === estado);

  return (
    porEstado("COMPLETED") ||
    porEstado("APPROVED") ||
    porEstado("PENDING") ||
    porEstado("REJECTED") ||
    deTipo[0]
  );
}

/**
 * Etiqueta del botón de solicitud/descarga, con el vocabulario exacto
 * pedido: "Solicitar reporte" / "Solicitud pendiente" / "Reporte
 * aprobado" / "Descargar reporte" / "Solicitud rechazada". No se
 * inventa un sexto estado.
 */
export function obtenerEtiquetaSolicitud(solicitud) {
  if (!solicitud) return "Solicitar reporte";

  const estado = String(solicitud.status || "").toUpperCase();
  if (estado === "PENDING") return "Solicitud pendiente";
  if (estado === "APPROVED") return "Reporte aprobado";
  if (estado === "COMPLETED") return "Descargar reporte";
  if (estado === "REJECTED") return "Solicitud rechazada";
  return "Solicitar reporte";
}
