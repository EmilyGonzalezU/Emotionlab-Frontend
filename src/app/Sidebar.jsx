import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

/**
 * Sidebar único, parametrizado por los items de navegación del rol
 * activo (ver navigation.js). Reemplaza components/Sidebar.jsx y
 * components/SidebarAdmin.jsx, que eran el mismo componente
 * duplicado con enlaces distintos.
 */
export default function Sidebar({ items }) {
  return (
    <aside className="el-shell-sidebar">
      <div className="el-shell-brand">EmotionLab</div>

      <nav aria-label="Navegación principal">
        <ul className="el-shell-nav">
          {items.map(({ to, label, end, icon: Icon }) => (
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
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
