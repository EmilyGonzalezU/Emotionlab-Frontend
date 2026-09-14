import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/api.js";
import toast from "react-hot-toast";
// Mantenemos la ruta original del CSS para no romper el diseño, 
// a menos que cambies el nombre de la carpeta en el futuro.
import "../vista_visor/sesiones_visor.css"; 

export default function AuditLogs() {
  const [logsAudit, setLogsAudit] = useState([]);
  const [cargandoLogs, setCargandoLogs] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros de las pestañas
  const [pestañaLogs, setPestañaLogs] = useState("LOGIN");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const sesionesPorPagina = 8;

  const cargarLogs = async () => {
    setCargandoLogs(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const respuesta = await fetch(getApiUrl("/audit-logs"), { headers });
      
      if (!respuesta.ok) {
        throw new Error("Error al obtener auditoría");
      }
      
      const data = await respuesta.json();
      
      console.log("Datos de auditoría recibidos:", data);

      if (Array.isArray(data)) {
        setLogsAudit(data);
      } else {
        setLogsAudit(data.items || []);
      }
      
    } catch (error) {
      console.error("Error al cargar logs:", error);
      setError("No se pudieron cargar los registros de auditoría.");
      toast.error("Error al cargar la auditoría");
    } finally {
      setCargandoLogs(false);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  // 🔄 AQUÍ ESTÁ LA MAGIA: Ordenamos de MÁS NUEVO a MÁS VIEJO antes de filtrar
  const logsOrdenados = [...logsAudit].sort((a, b) => {
    const fechaA = new Date(a.iso_timestamp || a.timestamp || 0).getTime();
    const fechaB = new Date(b.iso_timestamp || b.timestamp || 0).getTime();
    return fechaB - fechaA; // El mayor (más reciente) gana y va primero
  });

  const logsFiltrados = logsOrdenados.filter(log => {
    const act = (log.action || "").toUpperCase();
    if (pestañaLogs === "LOGIN") return act.includes("LOGIN") || act.includes("PASSWORD");
    if (pestañaLogs === "REPORT") return act.includes("REPORT");
    // Agregamos APPROV y REJECT para pillar las solicitudes de usuarios
    if (pestañaLogs === "USER") return act.includes("USER") || act.includes("USUARIO") || act.includes("CUENTA") || act.includes("APPROV") || act.includes("REJECT");
    return false;
  });

  useEffect(() => {
    setPaginaActual(1);
  }, [pestañaLogs]);

  const totalPaginas = Math.ceil(logsFiltrados.length / sesionesPorPagina) || 1;
  const indiceUltimaSesion = paginaActual * sesionesPorPagina;
  const indicePrimeraSesion = indiceUltimaSesion - sesionesPorPagina;
  const logsPaginados = logsFiltrados.slice(indicePrimeraSesion, indiceUltimaSesion);

  return (
    <div className="sesiones-main-content">
      
      <header className="sesiones-header">
        <div>
          <h2>Registro de Auditoría</h2>
          <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
            Trazabilidad de accesos y acciones en el sistema.
          </span>
        </div>

        <div className="acciones-header">
          <div className="filtros-wrapper">
            <div style={{ display: "flex", gap: "8px", border: "1px solid #cbd5e1", padding: "4px", borderRadius: "8px", backgroundColor: "#fff" }}>
              <button 
                onClick={() => setPestañaLogs("LOGIN")}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
                  backgroundColor: pestañaLogs === "LOGIN" ? "#17315e" : "transparent",
                  color: pestañaLogs === "LOGIN" ? "#fff" : "#64748b"
                }}
              >
                Accesos
              </button>
              <button 
                onClick={() => setPestañaLogs("REPORT")}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
                  backgroundColor: pestañaLogs === "REPORT" ? "#17315e" : "transparent",
                  color: pestañaLogs === "REPORT" ? "#fff" : "#64748b"
                }}
              >
                Informes
              </button>
              <button 
                onClick={() => setPestañaLogs("USER")}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
                  backgroundColor: pestañaLogs === "USER" ? "#17315e" : "transparent",
                  color: pestañaLogs === "USER" ? "#fff" : "#64748b"
                }}
              >
                Usuarios
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="sesiones-container">
        
        <div style={{ 
          display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr", 
          padding: "0 24px 12px 24px", 
          borderBottom: "1px solid #cbd5e1", 
          marginBottom: "12px",
          fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase"
        }}>
          <span>Fecha y Hora</span>
          <span>Especialista</span>
          <span>Acción</span>
        </div>

        <div className="sesiones-list">
          {cargandoLogs ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#64748B" }}>
              Cargando auditoría...
            </p>
          ) : error ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#EF4444" }}>
              {error}
            </p>
          ) : logsPaginados.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#64748B" }}>
              No hay registros en esta categoría para mostrar.
            </p>
          ) : (
            logsPaginados.map((log, index) => {
              const timestamp = log.iso_timestamp || log.timestamp;
              const fechaLegible = timestamp 
                ? new Date(timestamp).toLocaleString("es-CL", { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute:'2-digit' 
                  }) 
                : "Fecha desconocida";

              let accionFmt = log.action;
              const actUpper = (log.action || "").toUpperCase();
              
              if (actUpper.includes("REQUESTED")) accionFmt = "📄 Solicitó Informe";
              else if (actUpper.includes("APPROVED") || actUpper.includes("APPROV")) accionFmt = "✅ Aprobó Usuario/Informe";
              else if (actUpper.includes("REJECTED") || actUpper.includes("REJECT")) accionFmt = "❌ Rechazó Usuario/Informe";
              else if (actUpper.includes("DOWNLOADED")) accionFmt = "📥 Descargó Informe";
              else if (actUpper.includes("CREA") || actUpper.includes("CREATED")) accionFmt = "➕ Creó Usuario";
              else if (actUpper.includes("ACTUALIZA") || actUpper.includes("UPDATED")) accionFmt = "✏️ Editó Usuario";
              else if (actUpper.includes("ELIMINA") || actUpper.includes("DELETED")) accionFmt = "🗑️ Eliminó Usuario";
              else if (actUpper.includes("DESHABILITA") || actUpper.includes("DISABLE")) accionFmt = "🚫 Desactivó Usuario";
              else if (actUpper.includes("HABILITA") || actUpper.includes("ENABLE")) accionFmt = "✅ Habilitó Usuario";

              let textoSecundario = "";
              if (pestañaLogs === "REPORT") {
                const idReal = log.session_id || log.participant_id || log.extra?.session_id || log.extra?.report_id;
                if (!idReal || String(idReal) === "undefined") {
                  textoSecundario = "Sesión ID: No disponible";
                } else if (String(idReal) === "__PENDING__") {
                  textoSecundario = "Sesión ID: En proceso...";
                } else {
                  textoSecundario = `Sesión ID: ${idReal}`;
                }
              } else {
                textoSecundario = log.extra?.target_email ? `Target: ${log.extra.target_email}` : "";
              }

              return (
                <div 
                  key={index} 
                  className="sesion-card" 
                  style={{ 
                    gridTemplateColumns: "1.2fr 1.5fr 1.5fr", 
                    cursor: "default",
                    backgroundColor: actUpper === "LOGIN_FAILED" ? "#fef2f2" : undefined,
                    borderLeft: actUpper === "LOGIN_FAILED" ? "4px solid #ef4444" : undefined
                  }}
                >
                  <span className="sesion-col sesion-col-id" style={{ fontSize: "0.85rem" }}>
                    {fechaLegible}
                  </span>
                  
                  <span className="sesion-col" style={{ color: "#334155" }}>
                    {log.actor_email || "Sistema"}
                  </span>
                  
                  <span className="sesion-col">
                    {pestañaLogs === "LOGIN" ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ 
                          color: actUpper === "LOGIN_OK" ? "#166534" : (actUpper.includes("PASSWORD") ? "#0284c7" : "#991b1b"), 
                          fontWeight: "600", fontSize: "0.9rem" 
                        }}>
                          {actUpper === "LOGIN_OK" ? "✅ Ingreso Exitoso" : 
                           actUpper === "PASSWORD_RESET" ? "🔑 Recuperación solicitada" :
                           actUpper === "PASSWORD_CHANGED" ? "🔄 Contraseña Actualizada" :
                           actUpper === "NEW_PASSWORD_REQUIRED" ? "⚠️ Clave Temporal Usada" :
                           "❌ Ingreso Fallido"}
                        </span>
                        {actUpper.includes("LOGIN_FAILED") && log.extra?.reason && (
                          <span style={{ fontSize: "0.75rem", color: "#991b1b", marginTop: "2px" }}>
                            {log.extra.reason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#17315E", fontWeight: "600", fontSize: "0.9rem" }}>
                          {accionFmt}
                        </span>
                        <span className="sesion-col-genero" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                          {textoSecundario}
                        </span>
                      </div>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN VISIBLE SIEMPRE */}
        {!cargandoLogs && (
          <div className="paginacion-container">
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
            >
              Anterior
            </button>
            <span className="info-paginacion">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  );
}