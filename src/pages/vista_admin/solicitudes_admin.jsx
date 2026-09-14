import React from "react";
import ReportsList from "../../features/reports/ReportsList.jsx";

/**
 * SolicitudesAdmin ya no tiene lógica ni CSS propios: la pantalla
 * completa vive ahora en src/features/reports/ReportsList.jsx
 * (Fase 4), que reutiliza GET /report-requests?status=PENDING, GET
 * /users y PATCH /report-requests/:id/review exactamente como este
 * archivo lo hacía.
 *
 * "./visualizadores_admin.css" ya no se importa desde aquí: seguía
 * siendo usado por pages/vista_admin/visualizadores_admin.jsx (fuera
 * de alcance de esta fase), así que ese archivo permanece intacto sin
 * modificarse — la nueva pantalla usa su propia CSS autocontenida
 * (features/reports/ReportsList.css).
 */
export default function SolicitudesAdmin() {
  return <ReportsList />;
}
