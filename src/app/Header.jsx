import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleLabel } from "../lib/roles.js";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ConfirmationDialog from "../ui/ConfirmationDialog.jsx";
import { getSectionLabel, ACCOUNT_PATH_BY_ROLE } from "./navigation.js";
import "./Header.css";

/**
 * Barra superior del AppShell: contexto de la página a la izquierda,
 * identidad del usuario y acciones de cuenta/sesión a la derecha.
 *
 * El botón "Cerrar sesión" vivía antes dentro de cada sidebar y usaba
 * un toast de react-hot-toast como confirmación (se autodestruía a
 * los 5 segundos). Aquí usa ConfirmationDialog (Fase 0): bloqueante,
 * no se cierra solo, responde a Escape — apropiado para una acción
 * que termina la sesión del usuario.
 */
export default function Header({ items, role }) {
  const { user, rol, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);

  const seccion = getSectionLabel(location.pathname, items);
  const nombreUsuario = user?.nombre || user?.email || "Mi cuenta";
  const etiquetaRol = getRoleLabel(rol);
  const cuentaPath = ACCOUNT_PATH_BY_ROLE[role] || items[0]?.to || "/";

  const confirmarLogout = () => {
    setConfirmandoSalida(false);
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="el-shell-header">
        <div className="el-shell-header-section">{seccion}</div>

        <div className="el-shell-header-actions">
          <Badge tone="brand">{etiquetaRol}</Badge>

          <button
            type="button"
            className="el-shell-header-user"
            onClick={() => navigate(cuentaPath)}
            title="Ir a mi cuenta"
          >
            <FiUser aria-hidden="true" />
            <span>{nombreUsuario}</span>
          </button>

          <Button
            variant="ghost"
            size="sm"
            icon={FiLogOut}
            onClick={() => setConfirmandoSalida(true)}
          >
            Cerrar sesión
          </Button>
        </div>
      </header>

      <ConfirmationDialog
        open={confirmandoSalida}
        title="Cerrar sesión"
        message="¿Seguro que quieres cerrar tu sesión en EmotionLab?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={confirmarLogout}
        onCancel={() => setConfirmandoSalida(false)}
      />
    </>
  );
}
