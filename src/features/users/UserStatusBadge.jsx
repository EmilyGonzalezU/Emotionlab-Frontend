import React from "react";
import Badge from "../../ui/Badge.jsx";

/**
 * Traduce el campo real "activo" (booleano, tal como lo entrega el
 * backend) a un Badge consistente. Reemplaza el
 * <span className="badge-estado ..."> con colores en línea que tenía
 * visualizadores_admin.jsx.
 */
export default function UserStatusBadge({ activo }) {
  return activo ? <Badge tone="success">Activo</Badge> : <Badge tone="danger">Inactivo</Badge>;
}
