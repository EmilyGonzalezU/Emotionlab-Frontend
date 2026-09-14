import { api } from "../../lib/apiClient.js";

/**
 * Capa de datos de Sesiones. Reemplaza los `fetch` manuales repetidos
 * en sesiones_visor.jsx y sesion_detalle.jsx (armar headers, adjuntar
 * token, parsear JSON) por un único punto de entrada, usando
 * lib/apiClient.js (Fase 0).
 *
 * Ningún endpoint, método ni payload cambia — mismo contrato exacto
 * que ya existía:
 *   GET    /sessions
 *   POST   /sessions/import
 *   GET    /sessions/:id
 *   PATCH  /sessions/:id/name
 *
 * (Las solicitudes de reporte — GET /report-requests?mine=true y
 * POST /report-requests — vivían aquí en la Fase 3 y se movieron a
 * features/reports/reportsApi.js en la Fase 4, junto con el resto del
 * flujo de reportes. Ningún endpoint cambió, solo su ubicación.)
 *
 * Todos estos son endpoints donde un 401 solo puede significar sesión
 * inválida/vencida (a diferencia de PATCH /users/me/password, donde
 * un 401 podría confundirse con "contraseña actual incorrecta" — ver
 * la nota en pages/cuenta/Cuenta.jsx). Por eso aquí sí es seguro usar
 * apiClient para todo.
 */
export function fetchSessions() {
  return api.get("/sessions");
}

export function importSessions() {
  return api.post("/sessions/import");
}

export function fetchSessionDetail(id) {
  return api.get(`/sessions/${id}`);
}

export function updateSessionStudentName(id, nombre) {
  return api.patch(`/sessions/${id}/name`, { nombre });
}
