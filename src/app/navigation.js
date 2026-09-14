import { FiHome, FiUsers, FiFileText, FiClipboard, FiUser } from "react-icons/fi";

/**
 * Fuente única de la navegación por rol. Reemplaza la duplicación
 * entre components/Sidebar.jsx y components/SidebarAdmin.jsx (mismo
 * componente, distintos enlaces hardcodeados). Los items del rol
 * "teacher" siguen apuntando a "/teacher/..." incluso cuando se
 * navega desde el alias "/especialista" — es el mismo comportamiento
 * que ya tenía la app, no se cambia ningún link.
 */
export const NAV_BY_ROLE = {
  admin: [
    { to: "/admin", label: "Inicio", end: true, icon: FiHome },
    { to: "/admin/visualizadores", label: "Especialistas", icon: FiUsers },
    { to: "/admin/solicitudes", label: "Solicitudes", icon: FiFileText },
    { to: "/admin/auditoria", label: "Auditoría", icon: FiClipboard },
    { to: "/admin/cuenta", label: "Cuenta", icon: FiUser },
  ],
  teacher: [
    { to: "/teacher", label: "Inicio", end: true, icon: FiHome },
    { to: "/teacher/sesiones", label: "Sesiones", icon: FiClipboard },
    { to: "/teacher/cuenta", label: "Cuenta", icon: FiUser },
  ],
};

export const ACCOUNT_PATH_BY_ROLE = {
  admin: "/admin/cuenta",
  teacher: "/teacher/cuenta",
};

/**
 * Etiqueta de sección para el encabezado, a partir de la ruta actual.
 * Trata "/especialista/*" como equivalente a "/teacher/*" solo para
 * esta lectura visual — no cambia ningún enlace ni ruta real.
 */
export function getSectionLabel(pathname, items) {
  const normalizado = pathname.startsWith("/especialista")
    ? pathname.replace("/especialista", "/teacher")
    : pathname;

  const ordenados = [...items].sort((a, b) => b.to.length - a.to.length);
  const match = ordenados.find((item) =>
    item.end ? normalizado === item.to : normalizado.startsWith(item.to),
  );

  return match?.label || "EmotionLab";
}
