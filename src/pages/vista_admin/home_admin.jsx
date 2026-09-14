import React from "react";
import IndicadoresSync from "./indicadoresSync.jsx";
import PageHeader from "../../ui/PageHeader.jsx";

export default function HomeAdmin() {
  return (
    <div>
      <PageHeader
        title="Panel principal"
        description="Bienvenido al sistema. Aquí tienes el resumen del estado actual:"
      />

      <IndicadoresSync />
    </div>
  );
}
