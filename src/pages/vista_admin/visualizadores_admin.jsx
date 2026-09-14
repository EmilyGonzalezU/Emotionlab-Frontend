import React from "react";
import UsersList from "../../features/users/UsersList.jsx";

/**
 * ListaEspecialistas ya no tiene lógica ni CSS propios: la pantalla
 * completa vive ahora en src/features/users/UsersList.jsx (Fase 5),
 * que reutiliza exactamente los mismos endpoints que este archivo
 * usaba (GET /users, PUT /users/:uid, PATCH /users/:uid/disable|enable,
 * DELETE /users/:uid), separando "editar datos" de "cambiar rol" como
 * dos acciones distintas y reemplazando las confirmaciones por toast
 * (que se autodestruían a los 5 segundos) por ConfirmationDialog.
 *
 * "./visualizadores_admin.css" ya no se usa desde ningún archivo del
 * proyecto (se verificó antes de eliminarlo) — la nueva pantalla usa
 * su propia CSS autocontenida (features/users/UsersList.css), mismo
 * criterio que se aplicó con sesiones_visor.css en la Fase 3 y con
 * ReportsList.css en la Fase 4.
 */
export default function ListaEspecialistas() {
  return <UsersList />;
}
