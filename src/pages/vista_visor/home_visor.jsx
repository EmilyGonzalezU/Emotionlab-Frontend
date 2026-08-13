import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getApiUrl } from "../../config/api.js";

export default function HomeTeacher() {
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);
  const [estado, setEstado] = useState({
    cargando: true,
    datosBienestar: [],
    sesionesPorDia: [],
  });

  const obtenerDatos = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(getApiUrl("/sessions"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (respuesta.ok) {
        const sesiones = await respuesta.json();

        let contadorSi = 0;
        let contadorNo = 0;
        let contadorPendiente = 0;

        const gruposFecha = {};

        sesiones.forEach((sesion) => {
          // Extraer el valor de bienestar buscando en todas las ubicaciones posibles
          const valorBienestar =
            sesion.bienestar ??
            sesion.prediction?.bienestar ??
            sesion.prediction?.prediccion ??
            sesion.prediction?.resultado ??
            sesion.prediction_result;

          // Evaluar si está pendiente de predicción o viene nulo
          if (
            valorBienestar === null ||
            valorBienestar === undefined ||
            valorBienestar === "" ||
            sesion.status === "pending_prediction" ||
            sesion.estado === "pending_prediction"
          ) {
            contadorPendiente++;
          } else {
            const bienestarStr = String(valorBienestar).toLowerCase().trim();

            if (
              bienestarStr === "sí" ||
              bienestarStr === "si" ||
              bienestarStr === "true" ||
              bienestarStr === "1" ||
              bienestarStr === "alto bienestar" ||
              bienestarStr === "alto"
            ) {
              contadorSi++;
            } else {
              contadorNo++;
            }
          }

          // Priorizar la fecha de creación o de inicio para evitar alteraciones por 'updated_at'
          const fechaRaw =
            sesion.created_at ||
            sesion.fecha_inicio ||
            sesion.fecha ||
            sesion.updated_at;

          if (fechaRaw) {
            const objFecha = new Date(fechaRaw);
            if (!isNaN(objFecha.getTime())) {
              // Clave ISO para ordenamiento exacto (YYYY-MM-DD)
              const fechaISO = objFecha.toISOString().split("T")[0];

              // Formato visual para mostrar en la tabla (DD-MM-YYYY)
              const fechaMostrar = objFecha
                .toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .replaceAll("/", "-");

              if (!gruposFecha[fechaISO]) {
                gruposFecha[fechaISO] = {
                  fechaISO: fechaISO,
                  fechaMostrar: fechaMostrar,
                  total: 0,
                };
              }
              gruposFecha[fechaISO].total += 1;
            }
          }
        });

        const datosPie = [
          { name: "Alto Bienestar", value: contadorSi, color: "#22C55E" },
          { name: "Bajo Bienestar", value: contadorNo, color: "#EF4444" },
          {
            name: "IA Evaluando",
            value: contadorPendiente,
            color: "#F59E0B",
          },
        ].filter((item) => item.value > 0);

        // Convertir el objeto de grupos a lista y ordenar descendentemente (del día más reciente al más antiguo)
        const datosTabla = Object.values(gruposFecha).sort(
          (a, b) => new Date(b.fechaISO) - new Date(a.fechaISO)
        );

        setEstado({
          cargando: false,
          datosBienestar: datosPie,
          sesionesPorDia: datosTabla,
        });
      } else {
        setEstado((prev) => ({ ...prev, cargando: false }));
      }
    } catch (error) {
      console.error("Error cargando datos", error);
      setEstado((prev) => ({ ...prev, cargando: false }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerDatos();
  }, [obtenerDatos]);

  // Redirección usando el formato ISO de fecha
  const irADetalleDia = (fechaISO) => {
    navigate(`/teacher/sesiones?fecha=${fechaISO}`);
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
                    estado.sesionesPorDia.map((item) => (
                      <tr
                        key={item.fechaISO}
                        onClick={() => irADetalleDia(item.fechaISO)}
                        style={{ cursor: "pointer" }}>
                        <td style={{ fontWeight: "bold", color: "#17315E" }}>
                          {item.fechaMostrar}
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