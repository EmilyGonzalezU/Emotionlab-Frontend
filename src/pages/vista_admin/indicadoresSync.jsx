import React from "react";
// Importamos la tabla pero le damos el nombre actualizado "ListaEspecialistas"
import ListaEspecialistas from "./visualizadores_admin";
import "./indicadoresSync.css";

export default function IndicadoresSync() {
  return (
    <div
      className="dashboard-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "20px",
        alignItems: "start",
      }}>
      {/* =====================================================
          PANEL ÚNICO
          GESTIÓN DE USUARIOS (TABLA COMPLETA)
         ===================================================== */}

      <div
        className="panel-izquierdo"
        style={{
          minWidth: 0,
        }}>
        {/* Usamos la etiqueta con el nombre actualizado */}
        <ListaEspecialistas />
      </div>
    </div>
  );
}