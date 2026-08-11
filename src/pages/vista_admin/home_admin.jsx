import React from "react";
import IndicadoresSync from "./IndicadoresSync";

export default function HomeAdmin() {
  return (
    <div>
      {/* Título */}
      <h1
        style={{
          color: "#17315E",
          fontSize: "26px",
          marginTop: 0,
          marginBottom: "8px",
        }}>
        Panel Principal
      </h1>

      {/* Subtítulo */}
      <p
        style={{
          color: "#64748B",
          fontSize: "15px",
          marginBottom: "25px",
          marginTop: 0,
        }}>
        Bienvenido al sistema. Aquí tienes el resumen del estado actual:
      </p>

      <IndicadoresSync />
    </div>
  );
}
