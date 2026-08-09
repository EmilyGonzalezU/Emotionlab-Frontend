import React from "react";
import { Navigate } from "react-router-dom";

// Le agregamos un parámetro extra: "rolPermitido"
export default function RutaProtegida({ children, rolPermitido }) {
  const token = localStorage.getItem("token");

  // 1. Si no hay token, patada al Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Intentamos descubrir qué rol tiene el usuario
  let rolUsuario = localStorage.getItem("rol"); // Por si tu Login guarda el rol aquí

  // Si no está guardado suelto, lo hackeamos y lo leemos directamente desde dentro del token
  if (!rolUsuario) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      rolUsuario = payload.rol || payload.role; // Dependiendo de cómo lo llame tu backend
    } catch (e) {
      console.error("No se pudo leer el rol del token");
    }
  }

  // 3. Verificamos si la ruta exige un rol y el usuario NO lo tiene
  if (rolPermitido && rolUsuario !== rolPermitido) {
    // ¡Alerta de intruso! 🚨 Lo devolvemos a su área correspondiente
    if (rolUsuario === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/teacher" replace />;
    }
  }

  // Si todo está en orden, le abrimos la puerta
  return children;
}
