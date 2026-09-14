import React from "react";
import AppShell from "../../app/AppShell.jsx";

/**
 * MenuEspecialista ya no dibuja su propio layout (ver menu_admin.jsx
 * para la misma nota). Este componente se usa tanto para /teacher/*
 * como para /especialista/* en App.jsx — eso no cambia.
 */
export default function MenuEspecialista() {
  return <AppShell role="teacher" />;
}
