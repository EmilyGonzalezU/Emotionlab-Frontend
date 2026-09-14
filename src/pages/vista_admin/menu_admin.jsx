import React from "react";
import AppShell from "../../app/AppShell.jsx";

/**
 * MenuAdmin ya no dibuja su propio layout: el sidebar y el header
 * de administración eran una copia casi idéntica de los de
 * especialista (menu_visor.jsx), solo con otro componente de sidebar.
 * Ambos delegan ahora en el mismo AppShell, configurado por rol.
 */
export default function MenuAdmin() {
  return <AppShell role="admin" />;
}
