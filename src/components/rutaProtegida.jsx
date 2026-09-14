import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Le agregamos un parámetro extra: "rolPermitido"
export default function RutaProtegida({ children, rolPermitido }) {
  const { token, rol: rolUsuario } = useAuth();

  // 1. Si no hay token, patada al Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Verificamos si la ruta exige un rol y el usuario NO lo tiene
  if (rolPermitido && rolUsuario !== rolPermitido) {
    // Lo devolvemos a su área correspondiente
    if (rolUsuario === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/teacher" replace />;
    }
  }

  // Si todo está en orden, le abrimos la puerta
  return children;
}
