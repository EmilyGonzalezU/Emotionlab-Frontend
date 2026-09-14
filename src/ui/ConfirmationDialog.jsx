import React from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

/**
 * Reemplaza el patrón de "toast usado como confirmación" repetido en
 * Sidebar, SidebarAdmin, visualizadores_admin (desactivar/activar/
 * eliminar), solicitudes_admin y cuenta_admin/cuenta_visor. A
 * diferencia de un toast, es bloqueante, no se autodestruye a los 5
 * segundos y responde a Escape — apropiado para acciones destructivas
 * o irreversibles (eliminar usuario, rechazar solicitud, cambiar de
 * rol, cerrar sesión).
 */
export default function ConfirmationDialog({
  open,
  title = "Confirmar acción",
  message,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary", // "primary" | "danger"
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{message}</p>
      {/* Contenido adicional opcional (p. ej. un campo de motivo de
          rechazo) para no duplicar todo el diálogo cuando una
          confirmación necesita algo más que texto. Ningún uso
          existente pasa `children`, así que este cambio es
          retrocompatible. */}
      {children}
    </Modal>
  );
}
