import React from "react";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/SidebarAdmin"; // Ajusta la ruta si es necesario
import "./menu_admin.css";

export default function MenuAdmin() {
  return (
    <div className="admin-layout">
      <SidebarAdmin />

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}
