// Mapeo único de roles del sistema. Reemplaza las copias locales de
// "obtenerNombreRol" repetidas en visualizadores_admin.jsx y otras
// pantallas — mismo criterio (admin -> Administrador, teacher/visor
// -> Especialista), una sola fuente de verdad.
export const ROLE_LABELS = {
  admin: "Administrador",
  teacher: "Especialista",
  visor: "Especialista",
  visualizador: "Especialista",
  especialista: "Especialista",
};

export function getRoleLabel(rol) {
  const key = String(rol || "").toLowerCase().trim();
  return ROLE_LABELS[key] || rol || "Sin rol";
}
