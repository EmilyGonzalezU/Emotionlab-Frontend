import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiRefreshCw } from "react-icons/fi";
import { getApiUrl } from "../../config/api.js";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";

const VALORES_ALTO_BIENESTAR = new Set(["sí", "si", "true", "1", "alto bienestar", "alto"]);

export default function HomeEspecialista() {
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  // ==========================================================
  // ESTADO DEL PANEL
  // ==========================================================
  const [estado, setEstado] = useState({
    cargando: true,
    datosBienestar: [],
    sesionesPorDia: [],
  });
  const [refrescando, setRefrescando] = useState(false);

  // ==========================================================
  // OBTENER SESIONES
  // ==========================================================
  const obtenerDatos = useCallback(async (mostrarLoading = true) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (mostrarLoading) {
      setRefrescando(true);
    }

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(getApiUrl("/sessions"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error("No se pudieron obtener las sesiones.");
      }

      const sesiones = await respuesta.json();

      // ==================================================
      // CONTADORES DE BIENESTAR
      // ==================================================
      let contadorSi = 0;
      let contadorNo = 0;
      let contadorPendiente = 0;

      // ==================================================
      // AGRUPACIÓN POR FECHA
      // ==================================================
      const gruposFecha = {};

      // ==================================================
      // PROCESAR TODAS LAS SESIONES
      // ==================================================
      sesiones.forEach((sesion) => {
        // =================================================
        // BIENESTAR
        // =================================================
        const valorBienestar =
          sesion.bienestar ??
          sesion.prediction?.bienestar ??
          sesion.prediction?.prediccion ??
          sesion.prediction?.resultado ??
          sesion.prediction_result;

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
          if (VALORES_ALTO_BIENESTAR.has(bienestarStr)) {
            contadorSi++;
          } else {
            contadorNo++;
          }
        }

        // =================================================
        // FECHA REAL DE LA SESIÓN
        // =================================================
        //
        // IMPORTANTE:
        //
        // Aquí usamos:
        //      sesion.fecha
        // y NO:
        //      sesion.created_at
        // porque created_at representa la importación.
        //
        // El backend ahora se encarga de construir
        // sesion.fecha incluso para los archivos genéricos,
        // utilizando el s3_key cuando es necesario.
        //
        // =================================================
        const fechaRaw = sesion.fecha;
        if (!fechaRaw) return;

        // =================================================
        // NORMALIZAR FECHA
        // =================================================
        const fechaISO = String(fechaRaw).split(/[T ]/)[0].slice(0, 10);

        // =================================================
        // VALIDAR FORMATO
        // =================================================
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return;

        // =================================================
        // CONVERTIR A DD-MM-YYYY
        // =================================================
        const [year, month, day] = fechaISO.split("-");
        const fechaMostrar = `${day}-${month}-${year}`;

        // =================================================
        // CREAR GRUPO
        // =================================================
        if (!gruposFecha[fechaISO]) {
          gruposFecha[fechaISO] = {
            fechaISO,
            fechaMostrar,
            total: 0,
          };
        }

        // =================================================
        // SUMAR SESIÓN
        // =================================================
        gruposFecha[fechaISO].total += 1;
      });

      // ======================================================
      // DATOS DEL GRÁFICO
      // ======================================================
      const datosPie = [
        { name: "Alto Bienestar", value: contadorSi, color: "#22C55E" },
        { name: "Bajo Bienestar", value: contadorNo, color: "#EF4444" },
        { name: "IA Evaluando", value: contadorPendiente, color: "#F59E0B" },
      ].filter((item) => item.value > 0);

      // ======================================================
      // ORDENAR FECHAS
      // ======================================================
      const datosTabla = Object.values(gruposFecha).sort((a, b) =>
        b.fechaISO.localeCompare(a.fechaISO)
      );

      // ======================================================
      // GUARDAR DATOS
      // ======================================================
      setEstado({
        cargando: false,
        datosBienestar: datosPie,
        sesionesPorDia: datosTabla,
      });
    } catch (error) {
      console.error("Error cargando datos del panel:", error);
      setEstado((anterior) => ({ ...anterior, cargando: false }));
    } finally {
      fetchingRef.current = false;
      setRefrescando(false);
    }
  }, []);

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerDatos(false);
  }, [obtenerDatos]);

  const handleRefrescar = () => {
    obtenerDatos(true);
  };

  // ==========================================================
  // IR AL DETALLE DE UN DÍA
  // ==========================================================
  const irADetalleDia = (fechaISO) => {
    navigate(`/teacher/sesiones?fecha=${fechaISO}`);
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="home-container">
      <PageHeader
        title="Panel del especialista"
        description="Resumen general de bienestar y agrupaciones de sesiones por fecha."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={FiRefreshCw}
            onClick={handleRefrescar}
            loading={refrescando || estado.cargando}
          >
            Actualizar
          </Button>
        }
      />

      <div className="dashboard-layout">
        {/* ====================================================
            PANEL IZQUIERDO
           ==================================================== */}
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
                  {/* ==========================================
                      CARGANDO
                     ========================================== */}
                  {estado.cargando ? (
                    <tr>
                      <td colSpan="3" className="texto-centrado">
                        Cargando datos...
                      </td>
                    </tr>
                  ) : estado.sesionesPorDia.length === 0 ? (
                    /* ========================================
                       SIN DATOS
                       ======================================== */
                    <tr>
                      <td colSpan="3" className="texto-centrado">
                        No hay sesiones registradas
                      </td>
                    </tr>
                  ) : (
                    /* ========================================
                       SESIONES
                       ======================================== */
                    estado.sesionesPorDia.map((item) => (
                      <tr
                        key={item.fechaISO}
                        onClick={() => irADetalleDia(item.fechaISO)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* ==================================
                            FECHA
                           ================================== */}
                        <td style={{ fontWeight: "bold", color: "#17315E" }}>
                          {item.fechaMostrar}
                        </td>

                        {/* ==================================
                            CANTIDAD
                           ================================== */}
                        <td>
                          <span
                            className="badge-estado listo"
                            style={{ backgroundColor: "#EAF2FF", color: "#17315E" }}
                          >
                            {item.total} sesiones
                          </span>
                        </td>

                        {/* ==================================
                            ACCIÓN
                           ================================== */}
                        <td
                          style={{
                            textAlign: "right",
                            color: "#3B82F6",
                            fontWeight: "600",
                            fontSize: "13px",
                          }}
                        >
                          Ver detalles →
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: "12px", color: "#64748B", marginTop: "15px", fontStyle: "italic" }}>
              * Haz clic en una fila para ver el listado detallado de ese día y exportar.
            </p>
          </div>
        </div>

        {/* ====================================================
            PANEL DERECHO
           ==================================================== */}
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
              }}
            >
              {/* ================================================
                  CARGANDO
                 ================================================ */}
              {estado.cargando ? (
                <p style={{ color: "#64748B" }}>Cargando gráfico...</p>
              ) : estado.datosBienestar.length === 0 ? (
                /* ==============================================
                   SIN DATOS
                   ============================================== */
                <p style={{ color: "#64748B" }}>No hay datos suficientes para graficar.</p>
              ) : (
                /* ==============================================
                   GRÁFICO
                   ============================================== */
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estado.datosBienestar}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
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