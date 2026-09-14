import React from "react";
import SessionsList from "../../features/sessions/SessionsList.jsx";

/**
 * SesionesEspecialista ya no tiene lógica ni CSS propios: toda la
 * pantalla vive ahora en src/features/sessions/SessionsList.jsx
 * (Fase 3), reutilizando AppShell/PageHeader/Button/Modal/EmptyState/
 * LoadingState y los hooks de React Query en useSessions.js.
 *
 * Importante: este archivo YA NO importa "./sesiones_visor.css" — ese
 * archivo se deja intacto en el proyecto porque
 * pages/vista_admin/auditLogs.jsx lo importa directamente para su
 * propia tabla (.sesiones-container, .sesion-card, .btn-paginacion,
 * etc.). Auditoría queda fuera del alcance de esta fase, así que ese
 * CSS no se toca ni se elimina.
 */
export default function SesionesEspecialista() {
  return <SessionsList />;
}
