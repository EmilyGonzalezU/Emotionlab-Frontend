import React, { useState, useEffect } from "react";
import { api } from "../../lib/apiClient.js";
import toast from "react-hot-toast";
// Mantenemos la ruta original del CSS para no romper el diseño, 
// a menos que cambies el nombre de la carpeta en el futuro.
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import "./auditLogs.css";

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
      const data = await api.get("/audit-logs");

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
    <div className="el-audit-page">
      <PageHeader
        title="Registro de auditoría"
        description="Trazabilidad de accesos y acciones en el sistema."
        actions={<div className="el-audit-tabs" role="group" aria-label="Filtrar registros de auditoría">
          {[['LOGIN', 'Accesos'], ['REPORT', 'Informes'], ['USER', 'Usuarios']].map(([value, label]) => <Button key={value} size="sm" variant={pestañaLogs === value ? "primary" : "secondary"} aria-pressed={pestañaLogs === value} onClick={() => setPestañaLogs(value)}>{label}</Button>)}
        </div>}
      />
      <section className="el-audit-card">
        {cargandoLogs ? (
          <SkeletonRows rows={5} columns={3} />
        ) : error ? (
          <div role="alert">
            <EmptyState title="No se pudo cargar la auditoría" description={error} />
          </div>
        ) : logsPaginados.length === 0 ? (
          <EmptyState title="Sin registros para mostrar" description="No hay registros en esta categoría." />
        ) : (
          <div className="el-audit-table-scroll">
            <table className="el-table el-audit-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {logsPaginados.map((log, index) => {
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

              const etiquetaLogin = actUpper === "LOGIN_OK"
                ? "Ingreso exitoso"
                : actUpper === "PASSWORD_RESET"
                  ? "Recuperación solicitada"
                  : actUpper === "PASSWORD_CHANGED"
                    ? "Contraseña actualizada"
                    : actUpper === "NEW_PASSWORD_REQUIRED"
                      ? "Clave temporal usada"
                      : "Ingreso fallido";
              const tonoLogin = actUpper === "LOGIN_OK"
                ? "success"
                : actUpper.includes("PASSWORD")
                  ? "info"
                  : "danger";

              return (
                <tr key={log.audit_id || log.event_id || index} className={actUpper === "LOGIN_FAILED" ? "is-failed" : ""}>
                  <td className="el-audit-date" data-label="Fecha y hora">{fechaLegible}</td>
                  <td className="el-audit-actor" data-label="Usuario">{log.actor_email || "Sistema"}</td>
                  <td className="el-audit-action-cell" data-label="Acción">
                    {pestañaLogs === "LOGIN" ? (
                      <div className="el-audit-action-group">
                        <Badge tone={tonoLogin}>{etiquetaLogin}</Badge>
                        {actUpper.includes("LOGIN_FAILED") && log.extra?.reason && (
                          <span className="el-audit-reason">
                            {log.extra.reason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="el-audit-action-group">
                        <Badge tone="brand">{accionFmt}</Badge>
                        {textoSecundario && <span className="el-audit-secondary">{textoSecundario}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN VISIBLE SIEMPRE */}
        {!cargandoLogs && (
          <div className="el-pagination">
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
