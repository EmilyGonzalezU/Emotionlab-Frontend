import React from "react";
import Cuenta from "../cuenta/Cuenta.jsx";

/**
 * CuentaAdmin ya no tiene lógica propia: era una copia casi idéntica
 * de cuenta_visor.jsx (misma lógica de datos, misma validación de
 * contraseña, solo cambiaba la etiqueta de rol mostrada). El rol se
 * lee ahora dentro de Cuenta directamente desde AuthContext.
 */
export default function CuentaAdmin() {
  return <Cuenta />;
}
