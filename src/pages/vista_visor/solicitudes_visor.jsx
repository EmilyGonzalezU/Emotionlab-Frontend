import React from "react";
import MyRequestsList from "../../features/reports/MyRequestsList.jsx";

/**
 * Pantalla "Solicitudes" del rol Especialista (teacher / visor).
 *
 * Reutiliza el componente autocontenido src/features/reports/MyRequestsList.jsx
 * (que a su vez reutiliza ReportStatusBadge, Button, Modal, Badge, PageHeader,
 * EmptyState, LoadingState y ConfirmationDialog existentes).
 *
 * El diseño (tabla, filtros, botón Actualizar, modal de detalle, badges)
 * sigue el mismo patrón visual que ReportsList.jsx del administrador
 * (mismo CSS: ReportsList.css + ReportReview.css) para mantener
 * consistencia visual sin rediseñar nada.
 */
export default function SolicitudesEspecialista() {
  return <MyRequestsList />;
}
