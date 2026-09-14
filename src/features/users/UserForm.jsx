import React, { useEffect, useState } from "react";
import Modal from "../../ui/Modal.jsx";
import Button from "../../ui/Button.jsx";
import { isValidEmail } from "../../lib/validators.js";
import "./UserForm.css";

/**
 * Edición de nombre/correo de un usuario existente.
 *
 * A propósito separado de "cambiar rol" (Fase 5, aprobado por el
 * usuario): son dos acciones distintas con su propio flujo. Este
 * formulario nunca incluye "rol" en el body que envía (ver
 * usersApi.js -> updateUserProfile), así que guardar estos cambios
 * jamás modifica el rol de nadie como efecto colateral.
 *
 * No usa ConfirmationDialog: editar nombre/correo no está en la lista
 * de acciones sensibles (desactivar, eliminar, cambiar rol) que el
 * usuario pidió confirmar explícitamente — es un formulario normal con
 * Guardar/Cancelar, igual que el resto de la app.
 */
export default function UserForm({ usuario, onSave, onClose, loading, error }) {
  const open = Boolean(usuario);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errorLocal, setErrorLocal] = useState("");

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setEmail(usuario.email || "");
      setErrorLocal("");
    }
  }, [usuario]);

  if (!usuario) return null;

  const handleGuardar = () => {
    if (!nombre.trim()) {
      setErrorLocal("El nombre no puede estar vacío.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorLocal("Ingresa un correo electrónico válido.");
      return;
    }
    setErrorLocal("");
    onSave({ nombre: nombre.trim(), email: email.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar datos del usuario"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardar} loading={loading}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="el-user-form-field">
        <label htmlFor="el-user-form-nombre">Nombre completo</label>
        <input
          id="el-user-form-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="el-user-form-field">
        <label htmlFor="el-user-form-email">Correo electrónico</label>
        <input
          id="el-user-form-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      {(errorLocal || error) && <p className="el-user-form-error">{errorLocal || error}</p>}
    </Modal>
  );
}
