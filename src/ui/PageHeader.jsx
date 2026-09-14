import React from "react";
import "./PageHeader.css";

/**
 * Encabezado de pantalla: título + descripción + acciones. Reemplaza
 * los `<h1 style={{ color: "#17315E", ... }}>` repetidos con valores
 * ligeramente distintos en cada página (home_admin, home_visor,
 * sesiones_visor, auditLogs...).
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <header className="el-page-header">
      <div>
        <h1 className="el-page-header-title">{title}</h1>
        {description && <p className="el-page-header-desc">{description}</p>}
      </div>
      {actions && <div className="el-page-header-actions">{actions}</div>}
    </header>
  );
}
