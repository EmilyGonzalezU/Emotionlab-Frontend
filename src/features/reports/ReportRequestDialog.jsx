import React from "react";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";

/**
 * Confirmación previa a solicitar un reporte. Antes, un clic en
 * "Solicitar reporte" disparaba el POST /report-requests de inmediato
 * (ver auditoría de Fase 4); ahora siempre pasa por esta confirmación
 * explícita, reutilizando ConfirmationDialog en vez de un modal propio.
 */
export default function ReportRequestDialog({ open, formato, loading, onConfirm, onCancel }) {
  return (
    <ConfirmationDialog
      open={open}
      title="Solicitar reporte"
      message={`Se enviará una solicitud de reporte en formato ${formato} al administrador para su revisión.`}
      confirmLabel="Solicitar reporte"
      cancelLabel="Cancelar"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
