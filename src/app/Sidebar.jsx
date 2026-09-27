import React from "react";
import { NavLink } from "react-router-dom";
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
export default function Sidebar({ items }) {
  return (
    <aside className="el-shell-sidebar">
      <div className="el-shell-brand">EmotionLab</div>

      <nav aria-label="Navegación principal">
        <ul className="el-shell-nav">
          {items.map(({ to, label, end, icon: Icon, badgeCount }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `el-shell-nav-link${isActive ? " active" : ""}`
                }
              >
                {Icon && <Icon className="el-shell-nav-icon" aria-hidden="true" />}
                <span>{label}</span>
                {renderBadge(badgeCount)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
