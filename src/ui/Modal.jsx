import React, { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import "./Modal.css";

/**
 * Modal base, accesible y bloqueante: cierra con Escape, cierra al
 * hacer clic fuera, y recibe foco al abrirse. Es la base de
 * ConfirmationDialog y de cualquier diálogo futuro (búsqueda,
 * detalle de solicitud, etc.) en vez de overlays hechos a mano por
 * pantalla.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  const dialogRef = useRef(null);
  const yaAplicoFocoInicial = useRef(false);

  useEffect(() => {
    if (!open) {
      yaAplicoFocoInicial.current = false;
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);

    // Aplicar foco inicial SOLAMENTE UNA VEZ cuando el modal se
    // abre. Si se vuelve a ejecutar este effect porque cambiaron
    // onClose / props del children (por ejemplo al escribir en un
    // textarea dentro del modal), NO se roba el foco del input.
    if (
      !yaAplicoFocoInicial.current &&
      document.activeElement &&
      !dialogRef.current?.contains(document.activeElement)
    ) {
      dialogRef.current?.focus();
      yaAplicoFocoInicial.current = true;
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="el-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`el-modal el-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="el-modal-header">
          {title && <h3 className="el-modal-title">{title}</h3>}
          <button
            type="button"
            className="el-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </div>
        <div className="el-modal-body">{children}</div>
        {footer && <div className="el-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
