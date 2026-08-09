import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ListaVisualizadores from "./visualizadores_admin";
import "./indicadoresSync.css";

const USERS_ENDPOINT = "http://localhost:5000/users";

const ACTIVE_VALUES = new Set([true, "true", 1]);

const contarUsuariosActivos = (listaUsuarios) => {
  let contActivos = 0;
  let contInactivos = 0;

  if (Array.isArray(listaUsuarios)) {
    listaUsuarios.forEach((usuario) => {
      if (ACTIVE_VALUES.has(usuario.activo)) {
        contActivos++;
      } else {
        contInactivos++;
      }
    });
  }

  return {
    contActivos,
    contInactivos,
    total: Array.isArray(listaUsuarios) ? listaUsuarios.length : 0,
  };
};

export default function IndicadoresSync() {
  const [estadoGrafico, setEstadoGrafico] = useState({
    cargando: true,
    totalUsuarios: 0,
    activos: 0,
    inactivos: 0,
    datosPie: [],
  });

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");

        const respuestaUsuarios = await fetch(USERS_ENDPOINT, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!respuestaUsuarios.ok) {
          throw new Error(
            `Error obteniendo usuarios: ${respuestaUsuarios.status}`,
          );
        }

        const listaUsuarios = await respuestaUsuarios.json();

        const { contActivos, contInactivos, total } =
          contarUsuariosActivos(listaUsuarios);

        setEstadoGrafico({
          cargando: false,
          totalUsuarios: total,
          activos: contActivos,
          inactivos: contInactivos,
          datosPie: [
            {
              name: "Activos",
              value: contActivos,
              color: "#22C55E",
            },
            {
              name: "Inactivos",
              value: contInactivos,
              color: "#EF4444",
            },
          ].filter((item) => item.value > 0),
        });
      } catch (error) {
        console.error("Error consultando usuarios:", error);

        setEstadoGrafico((prev) => ({
          ...prev,
          cargando: false,
        }));
      }
    };

    obtenerUsuarios();
  }, []);

  return (
    <div
      className="dashboard-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)",
        gap: "20px",
        alignItems: "start",
      }}>
      {/* =====================================================
          PANEL IZQUIERDO
          GESTIÓN DE USUARIOS
         ===================================================== */}

      <div
        className="panel-izquierdo"
        style={{
          minWidth: 0,
        }}>
        <ListaVisualizadores />
      </div>

      {/* =====================================================
          PANEL DERECHO
          ESTADO DE LOS USUARIOS
         ===================================================== */}

      <div
        className="panel-derecho"
        style={{
          minWidth: 0,
        }}>
        <div className="logs-container">
          <h3 className="logs-titulo">Estado de los Usuarios</h3>

          {/* RESUMEN NUMÉRICO */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "15px",
            }}>
            {/* TOTAL */}

            <div
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  marginBottom: "5px",
                }}>
                Total
              </div>

              <div
                style={{
                  fontSize: "25px",
                  fontWeight: "bold",
                  color: "#17315E",
                }}>
                {estadoGrafico.cargando ? "..." : estadoGrafico.totalUsuarios}
              </div>
            </div>

            {/* ACTIVOS */}

            <div
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "#F0FDF4",
                border: "1px solid #DCFCE7",
              }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  marginBottom: "5px",
                }}>
                Activos
              </div>

              <div
                style={{
                  fontSize: "25px",
                  fontWeight: "bold",
                  color: "#16A34A",
                }}>
                {estadoGrafico.cargando ? "..." : estadoGrafico.activos}
              </div>
            </div>
          </div>

          {/* GRÁFICO */}

          <div
            style={{
              height: "300px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
            {estadoGrafico.cargando ? (
              <p style={{ color: "#64748B" }}>Cargando...</p>
            ) : estadoGrafico.totalUsuarios === 0 ? (
              <p style={{ color: "#64748B" }}>No hay usuarios registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoGrafico.datosPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value">
                    {estadoGrafico.datosPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* INFORMACIÓN INFERIOR */}

          <div
            style={{
              marginTop: "10px",
              padding: "12px",
              borderRadius: "8px",
              background: "#F8FAFC",
              color: "#64748B",
              fontSize: "13px",
              textAlign: "center",
            }}>
            {estadoGrafico.cargando
              ? "Cargando estado de usuarios..."
              : `${estadoGrafico.activos} usuarios activos y ${estadoGrafico.inactivos} usuarios inactivos`}
          </div>
        </div>
      </div>
    </div>
  );
}
