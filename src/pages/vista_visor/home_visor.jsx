import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function HomeTeacher() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState({
    cargando: true,
    datosBienestar: [],
    sesionesPorDia: [],
  });

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        const respuesta = await fetch("http://localhost:5000/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (respuesta.ok) {
          const sesiones = await respuesta.json();

          // --- 1. PROCESAR BIENESTAR (Alto vs Bajo vs Pendiente) ---
          let contadorSi = 0;
          let contadorNo = 0;
          let contadorPendiente = 0;

          // --- 2. AGRUPAR POR FECHA ---
          const gruposFecha = {};

          sesiones.forEach((sesion) => {
            // Lógica Bienestar para atrapar los "null" y leer la IA
            if (
              sesion.bienestar === null ||
              sesion.bienestar === undefined ||
              sesion.bienestar === ""
            ) {
              contadorPendiente++;
            } else {
              const bienestar = String(sesion.bienestar).toLowerCase();
              if (
                bienestar === "sí" ||
                bienestar === "si" ||
                bienestar === "true" ||
                bienestar === "alto bienestar"
              ) {
                contadorSi++;
              } else {
                contadorNo++;
              }
            }

            // Lógica Fecha
            const fechaRaw = sesion.updated_at || sesion.created_at;
            if (fechaRaw) {
              const fechaStr = new Date(fechaRaw).toLocaleDateString("es-CL");
              gruposFecha[fechaStr] = (gruposFecha[fechaStr] || 0) + 1;
            }
          });

          // Formatear para el gráfico
          const datosPie = [
            { name: "Alto Bienestar", value: contadorSi, color: "#22C55E" },
            { name: "Bajo Bienestar", value: contadorNo, color: "#EF4444" },
            {
              name: "IA Evaluando",
              value: contadorPendiente,
              color: "#F59E0B",
            },
          ].filter((item) => item.value > 0);

          // Formatear para la tabla
          const datosTabla = Object.keys(gruposFecha).map((fecha) => ({
            fecha: fecha,
            total: gruposFecha[fecha],
          }));

          setEstado({
            cargando: false,
            datosBienestar: datosPie,
            sesionesPorDia: datosTabla,
          });
        }
      } catch (error) {
        console.error("Error cargando datos", error);
        setEstado((prev) => ({ ...prev, cargando: false }));
      }
    };

    obtenerDatos();
  }, []);

  // Función para cuando hagan clic en una fila de la tabla
  const irADetalleDia = (fecha) => {
    // Convierte slashes "08/08/2026" a guiones "08-08-2026"
    const fechaUrl = fecha.replaceAll("/", "-");
    // Redirige a la vista de sesiones filtrando por el parámetro de consulta ?fecha=
    navigate(`/teacher/sesiones?fecha=${fechaUrl}`);
  };

  return (
    <div className="home-container">
      <h1
        style={{
          color: "#17315E",
          fontSize: "26px",
          marginTop: 0,
          marginBottom: "8px",
          fontWeight: "bold",
        }}>
        Panel del Visualizador
      </h1>
      <p
        style={{
          color: "#64748B",
          fontSize: "15px",
          marginBottom: "25px",
          marginTop: 0,
        }}>
        Resumen general de bienestar y agrupaciones de sesiones por fecha.
      </p>

      <div className="dashboard-layout">
        {/* PANEL IZQUIERDO: La Tabla de Sesiones por Día */}
        <div className="panel-izquierdo">
          <div className="logs-container">
            <h3 className="logs-titulo">Sesiones por Día</h3>

            <div className="tabla-responsive">
              <table className="tabla-logs">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cantidad de Sesiones</th>
                    <th style={{ textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {estado.cargando ? (
                    <tr>
                      <td colSpan="3" className="texto-centrado">
                        Cargando datos...
                      </td>
                    </tr>
                  ) : estado.sesionesPorDia.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="texto-centrado">
                        No hay sesiones registradas
                      </td>
                    </tr>
                  ) : (
                    estado.sesionesPorDia.map((item, index) => (
                      <tr
                        key={index}
                        onClick={() => irADetalleDia(item.fecha)}
                        style={{ cursor: "pointer" }}>
                        <td style={{ fontWeight: "bold", color: "#17315E" }}>
                          {item.fecha}
                        </td>
                        <td>
                          <span
                            className="badge-estado listo"
                            style={{
                              backgroundColor: "#EAF2FF",
                              color: "#17315E",
                            }}>
                            {item.total} sesiones
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "#3B82F6",
                            fontWeight: "600",
                            fontSize: "13px",
                          }}>
                          Ver detalles →
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#64748B",
                marginTop: "15px",
                fontStyle: "italic",
              }}>
              * Haz clic en una fila para ver el listado detallado de ese día y
              exportar.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: El Gráfico de Bienestar */}
        <div className="panel-derecho">
          <div className="logs-container">
            <h3 className="logs-titulo">Métrica de Bienestar</h3>

            <div
              style={{
                height: "250px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              {estado.cargando ? (
                <p style={{ color: "#64748B" }}>Cargando gráfico...</p>
              ) : estado.datosBienestar.length === 0 ? (
                <p style={{ color: "#64748B" }}>
                  No hay datos suficientes para graficar.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estado.datosBienestar}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value">
                      {estado.datosBienestar.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
