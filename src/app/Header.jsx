import React from "react";
import { useLocation } from "react-router-dom";
import { getRoleLabel } from "../lib/roles.js";
import Badge from "../ui/Badge.jsx";
import { getSectionLabel } from "./navigation.js";
import "./Header.css";

/**
 * Barra superior del AppShell: contexto de página y rol activo.
 */
export default function Header({ items, role }) {
  const location = useLocation();

  const seccion = getSectionLabel(location.pathname, items);

  return (
    <>
      <header className="el-shell-header">
        <div className="el-shell-header-section">{seccion}</div>

        <div className="el-shell-header-actions">
          <Badge tone="brand">{getRoleLabel(role)}</Badge>
        </div>
      </header>
    </>
  );
}
