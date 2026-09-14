import React from "react";
import SessionDetail from "../../features/sessions/SessionDetail.jsx";

/**
 * SesionDetalle ya no tiene lógica ni CSS propios: toda la pantalla
 * vive ahora en src/features/sessions/SessionDetail.jsx (Fase 3), que
 * reutiliza el mismo intérprete de resultado de IA introducido en la
 * Fase 0 (features/sessions/predictionHelpers.js) sin cambiar ninguna
 * regla de confianza del dato.
 *
 * "./sesion_detalle.css" ya no se importa desde aquí — a diferencia
 * de sesiones_visor.css, se confirmó que ningún otro archivo del
 * proyecto importa sesion_detalle.css, así que queda huérfano en
 * disco (ver informe de Fase 3, pendiente de que lo elimines).
 */
export default function SesionDetalle() {
  return <SessionDetail />;
}
