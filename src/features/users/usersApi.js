import { api } from "../../lib/apiClient.js";

/**
 * Capa de datos de Usuarios/Especialistas (Fase 5). Mismo contrato
 * exacto que ya usaban pages/vista_admin/visualizadores_admin.jsx y
 * pages/vista_admin/creacion_visor.jsx (fetch manual + token de
 * localStorage repetido en cada función), ahora centralizado en
 * apiClient:
 *
 *   GET    /users              -> lista de usuarios
 *   POST   /users               body: { nombre, email, rol }
 *   PUT    /users/:uid          body: subconjunto de
 *                                { nombre, email, rol, activo }
 *   PATCH  /users/:uid/disable
 *   PATCH  /users/:uid/enable
 *   DELETE /users/:uid
 *
 * Todos son endpoints ya existentes: ningún método, ruta ni forma de
 * payload es nuevo.
 *
 * PUT /users/:uid es una actualización parcial real — se confirmó
 * leyendo services/user_service.py del backend (solo se aplican los
 * campos presentes en el body; "rol" no es obligatorio). Por eso
 * "editar datos" y "cambiar rol" son dos llamadas independientes que
 * nunca se pisan entre sí:
 *   - updateUserProfile envía únicamente { nombre, email }, nunca "rol".
 *   - changeUserRole envía únicamente { rol }, nunca nombre/email.
 * Esto es solo una separación de UX/acciones: no cambia el contrato
 * del backend ni requiere modificarlo.
 */
export function fetchUsers() {
  return api.get("/users");
}

export function createUser({ nombre, email, rol }) {
  return api.post("/users", { nombre, email, rol });
}

export function updateUserProfile(uid, { nombre, email }) {
  return api.put(`/users/${uid}`, { nombre, email });
}

export function changeUserRole(uid, rol) {
  return api.put(`/users/${uid}`, { rol });
}

export function disableUser(uid) {
  return api.patch(`/users/${uid}/disable`);
}

export function enableUser(uid) {
  return api.patch(`/users/${uid}/enable`);
}

export function deleteUser(uid) {
  return api.delete(`/users/${uid}`);
}
