import React from "react";
//se importa ehh el componente de tarjetas q creamos, abajo se llama en <IndicadoresSync />
import IndicadoresSync from "./IndicadoresSync";

export default function HomeAdmin() {
  return (
    <div className="home-container">
      {/* Título un poco más compacto y con tu Azul Marino oficial */}
      <h1
        style={{
          color: "#17315E",
          fontSize: "26px",
          marginTop: 0,
          marginBottom: "8px",
        }}>
        Panel Principal
      </h1>

      {/* Subtítulo más pegadito arriba y con el gris secundario oficial */}
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
