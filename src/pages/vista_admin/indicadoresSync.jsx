import React from "react";
import ListaVisualizadores from "./visualizadores_admin";
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
        <ListaVisualizadores />
      </div>
    </div>
  );
}
