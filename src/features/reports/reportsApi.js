import { api } from "../../lib/apiClient.js";
import { getApiUrl } from "../../config/api.js";

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

/**
 * Contexto de sesión para la revisión del administrador
 * (GET /sessions/:id, reutilizado del flujo del especialista).
 *
 * A diferencia del resto de este archivo, esta llamada NO pasa por
 * apiClient: hasta ahora este endpoint solo lo consumía el rol
 * teacher/especialista, y no hay ninguna confirmación de que un 401
 * del administrador contra esta ruta signifique "sesión vencida" — en
 * vez de eso, podría significar simplemente que este rol no está
 * autorizado para ver el detalle completo de la sesión. apiClient
 * cerraría la sesión automáticamente ante cualquier 401
 * (comportamiento correcto para el resto de los endpoints, pero
 * incorrecto aquí si el 401 en realidad es un problema de permisos).
 * Por eso el 401/403 se maneja localmente, devolviendo un estado
 * honesto en vez de inventar un endpoint nuevo o modificar el
 * backend.
 */
export async function fetchSessionContextForAdmin(sessionId) {
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(getApiUrl(`/sessions/${sessionId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    return { status: "network_error", data: null };
  }

  if (response.status === 401 || response.status === 403) {
    return { status: "unauthorized", data: null };
  }

  if (!response.ok) {
    return { status: "error", data: null };
  }

  const data = await response.json().catch(() => null);
  return { status: "ok", data };
}
