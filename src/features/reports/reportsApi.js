import { api } from "../../lib/apiClient.js";

/**
 * Capa de datos de Reportes (Fase 4). Se separa de
 * features/sessions/sessionsApi.js porque las solicitudes de reporte
 * tienen su propio ciclo de vida (PENDING/APPROVED/REJECTED/COMPLETED)
 * y consumidores propios: el especialista (solicitar/consultar las
 * suyas) y el administrador (listar pendientes, revisar,
 * aprobar/rechazar).
 *
 * Ningún endpoint ni payload es nuevo — mismo contrato exacto que ya
 * existía, antes repartido entre features/sessions/sessionsApi.js y
 * pages/vista_admin/solicitudes_admin.jsx:
 *   GET   /report-requests?mine=true
 *   POST  /report-requests            body: { session_id, motivo }
 *   GET   /report-requests?status=PENDING
 *   PATCH /report-requests/:id/review body: { approved, reason? }
 *   GET   /report-requests/:id/download
 *   GET   /users
 *
 * Todos son endpoints admin/especialista donde un 401 solo puede
 * significar sesión inválida/vencida, así que es seguro usar
 * apiClient para todos ellos (igual criterio que en sessionsApi.js).
 */
export function fetchMyReportRequests() {
  return api.get("/report-requests?mine=true");
}

export function createReportRequest(sessionId, motivo) {
  return api.post("/report-requests", {
    session_id: sessionId,
    motivo,
  });
}

export function createTrackingReportRequest(trackingId, reportFormat = "PDF") {
  return api.post(`/trackings/${encodeURIComponent(trackingId)}/report-requests`, { report_format: reportFormat });
}

export function fetchTrackingReportDownloadUrl(trackingId, requestId) {
  return api.get(
    `/trackings/${encodeURIComponent(trackingId)}/report-requests/${encodeURIComponent(requestId)}/download`,
  );
}

export function fetchPendingReportRequests() {
  return api.get("/report-requests?status=PENDING");
}

export function reviewReportRequest(id, { approved, reason }) {
  const body = { approved };
  // El motivo de rechazo es opcional (confirmado por el backend: PATCH
  // /report-requests/:id/review admite { approved, reason? }). Nunca
  // se envía un motivo inventado por defecto si el administrador no
  // escribió uno.
  if (!approved && reason) {
    body.reason = reason;
  }
  return api.patch(`/report-requests/${id}/review`, body);
}

export function fetchUsers() {
  return api.get("/users");
}

/**
 * Solicita la URL presignada de S3 para descargar el PDF oficial de
 * una solicitud ya COMPLETED. El backend la genera bajo demanda (dura
 * 300 segundos) — nunca se guarda de forma permanente ni se reutiliza
 * una URL vieja; se pide una nueva cada vez que el usuario hace clic
 * en "Descargar reporte".
 */
export function fetchReportDownloadUrl(id) {
  return api.get(`/report-requests/${id}/download`);
}

export function downloadSessionsExcel({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return api.get(`/reports/excel${params.size ? `?${params}` : ""}`, { responseType: "blob" });
}
