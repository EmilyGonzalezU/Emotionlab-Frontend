import React, { useState } from "react";
import emotionLabLogo from "../assets/emotionlab-logo.png";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleLabel } from "../lib/roles.js";
import Button from "../ui/Button.jsx";
import ConfirmationDialog from "../ui/ConfirmationDialog.jsx";
import { ACCOUNT_PATH_BY_ROLE } from "./navigation.js";
import "./Sidebar.css";

function renderBadge(count) {
  if (count === undefined || count === null || Number(count) <= 0) {
    return null;
  }
  const valor = Number(count) > 99 ? "99+" : String(Number(count));
  return <span className="el-shell-nav-badge">{valor}</span>;
}

/**
 * Sidebar único, parametrizado por los items de navegación del rol
 * activo (ver navigation.js). Reemplaza components/Sidebar.jsx y
 * components/SidebarAdmin.jsx, que eran el mismo componente
 * duplicado con enlaces distintos.
 *
 * Cada item puede llevar un badgeCount numérico (>= 1) para mostrar
 * un indicador al lado del label (p. ej. solicitudes pendientes del
 * admin o cambios no leídos del especialista).
 */
export default function Sidebar({ items, role }) {
  const { user, rol, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const accountPath = ACCOUNT_PATH_BY_ROLE[role] || items[0]?.to || "/";
  const nombreUsuario = user?.nombre || user?.email || "Mi cuenta";

  const confirmarLogout = () => {
    setConfirmandoSalida(false);
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <aside className="el-shell-sidebar">
        <div className="el-shell-brand"><img className="el-shell-brand-mark" src={emotionLabLogo} alt="" /><span>EmotionLab</span></div>

        <nav aria-label="Navegación principal">
          <ul className="el-shell-nav">
            {items.map(({ to, label, end, icon: Icon, badgeCount }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `el-shell-nav-link${isActive ? " active" : ""}`}>
                  {Icon && <Icon className="el-shell-nav-icon" aria-hidden="true" />}
                  <span>{label}</span>{renderBadge(badgeCount)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="el-shell-sidebar-account">
          <button type="button" className="el-shell-profile" onClick={() => navigate(accountPath)} title="Ir a mi cuenta">
            <span className="el-shell-profile-avatar"><FiUser aria-hidden="true" /></span>
            <span className="el-shell-profile-copy"><strong>{nombreUsuario}</strong><small>{getRoleLabel(rol)}</small></span>
          </button>
          <Button variant="ghost" size="sm" icon={FiLogOut} onClick={() => setConfirmandoSalida(true)}>Cerrar sesión</Button>
        </div>
      </aside>
      <ConfirmationDialog open={confirmandoSalida} title="Cerrar sesión" message="¿Seguro que quieres cerrar tu sesión en EmotionLab?" confirmLabel="Cerrar sesión" cancelLabel="Cancelar" tone="danger" onConfirm={confirmarLogout} onCancel={() => setConfirmandoSalida(false)} />
    </>
  );
}
