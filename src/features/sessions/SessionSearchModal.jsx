import React from "react";
import Modal from "../../ui/Modal.jsx";
import Button from "../../ui/Button.jsx";

export default function SessionSearchModal({ open, onClose, value, onChange }) {
  return (
    <Modal open={open} onClose={onClose} title="Buscar sesión por ID" size="sm">
      <div className="el-session-search">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ejemplo: session_c691347f..."
          className="el-session-search-input"
          autoFocus
        />
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}>
            Borrar búsqueda
          </Button>
        )}
      </div>
    </Modal>
  );
}
