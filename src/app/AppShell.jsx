import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import { NAV_BY_ROLE } from "./navigation.js";
import "./AppShell.css";

/**
 * Estructura única de la aplicación: Sidebar + Header + área de
 * trabajo. Reemplaza MenuAdmin/MenuEspecialista, que repetían el
 * mismo layout con un sidebar propio cada uno. Las rutas hijas siguen
 * llegando por <Outlet/>, exactamente como antes — no cambia ninguna
 * ruta en App.jsx.
 */
export default function AppShell({ role }) {
  const items = NAV_BY_ROLE[role] || [];

  return (
    <div className="el-shell">
      <Sidebar items={items} />
      <div className="el-shell-body">
        <Header items={items} role={role} />
        <main className="el-shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
