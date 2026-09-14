import React from "react";
import "./EmptyState.css";

/**
 * Reemplaza los <p>No hay sesiones registradas</p> sueltos, con un
 * formato consistente y espacio para una acción cuando corresponde
 * (p. ej. "Limpiar filtros").
 */
export default function EmptyState({
  title = "Sin resultados",
  description,
  icon: Icon,
  action,
}) {
  return (
    <div className="el-empty-state">
      {Icon && <Icon className="el-empty-icon" aria-hidden="true" />}
      <p className="el-empty-title">{title}</p>
      {description && <p className="el-empty-desc">{description}</p>}
      {action}
    </div>
  );
}
