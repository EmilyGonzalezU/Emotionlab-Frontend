import React, { useMemo, useState } from "react";
import { FiInbox, FiSearch, FiRefreshCw } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import ReportStatusBadge from "./ReportStatusBadge.jsx";
import ReportReview from "./ReportReview.jsx";
import { formatChileInstant } from "../sessions/sessionDisplay.js";
import { usePendingReportRequests, useUsersDirectory } from "./useReports.js";
import "./ReportsList.css";

function fechaPrioridad(s) {
  if (!s) return "";
  return (
    s.updated_at ||
    s.reviewed_at ||
    s.requested_at ||
    s.downloaded_at ||
    s.created_at ||
    ""
  );
}

export default function ReportsList() {
  const { data, isLoading, isError, refetch: refetchPending } = usePendingReportRequests();
  const { data: usersData, isLoading: usersLoading } = useUsersDirectory();
  const [busqueda, setBusqueda] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const handleRefrescar = async () => {
    setRefrescando(true);
    try {
      await refetchPending();
    } finally {
      setRefrescando(false);
    }
  };

  const solicitudes = useMemo(() => {
    const raw = data?.items || [];
    return [...raw].sort((a, b) => {
      const fa = fechaPrioridad(a);
      const fb = fechaPrioridad(b);
      if (!fa && !fb) return 0;
      if (!fa) return 1;
      if (!fb) return -1;
      return new Date(fb).getTime() - new Date(fa).getTime();
    });
  }, [data]);

  const users = useMemo(() => Array.isArray(usersData) ? usersData : usersData?.items || [], [usersData]);
  const nombresPorUid = useMemo(() => new Map(
    users.map((user) => [
      String(user.uid || user.user_id || user.id || ""),
      user.nombre || user.name || "",
    ]).filter(([uid, name]) => uid && name),
  ), [users]);

  const solicitudesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return solicitudes;

    return solicitudes.filter((s) => {
      return String(s.session_id || "").toLowerCase().includes(termino)
        || String(s.tracking_code || "").toLowerCase().includes(termino)
        || String(s.tracking_id || "").toLowerCase().includes(termino)
        || String(s.requester_name || nombresPorUid.get(String(s.requester_uid || "")) || "").toLowerCase().includes(termino)
        || String(s.requester_uid || "").toLowerCase().includes(termino);
    });
  }, [busqueda, solicitudes, nombresPorUid]);

  return (
    <div className="el-reports-list el-admin-reports-list">
      <PageHeader
        title="Solicitudes de reportes"
        description="Revisa los metadatos de las solicitudes y registra una decisión sin acceder al contenido de las sesiones."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={FiRefreshCw}
            onClick={handleRefrescar}
            loading={refrescando || isLoading}
          >
            Actualizar
          </Button>
        }
      />

      <div className="el-reports-search">
        <FiSearch aria-hidden="true" />
        <input
          type="text"
          className="el-reports-search-input"
          placeholder="Buscar por sesión, seguimiento o especialista"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar solicitudes de reportes"
        />
      </div>

      <section className="el-reports-table-card">
        {isLoading ? (
          <SkeletonRows rows={5} columns={5} />
        ) : isError ? (
          <EmptyState
            title="No se pudieron obtener las solicitudes"
            description="Ocurrió un problema al conectar con el servidor. Intenta nuevamente."
          />
        ) : solicitudesFiltradas.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title="Sin solicitudes pendientes"
            description={
              busqueda
                ? "No se encontraron solicitudes con esos criterios."
                : "No hay solicitudes de reportes pendientes de revisión."
            }
          />
        ) : (
          <>
            <div className="el-admin-reports-table-heading">
              <h2>Solicitudes pendientes</h2>
              <span>
                {busqueda
                  ? `${solicitudesFiltradas.length} de ${solicitudes.length} solicitudes`
                  : `${solicitudes.length} solicitudes`}
              </span>
            </div>
            <div className="el-reports-table-scroll">
              <table className="el-table el-reports-table el-admin-reports-table">
                <colgroup>
                  <col className="el-admin-col-request" />
                  <col className="el-admin-col-specialist" />
                  <col className="el-admin-col-date" />
                  <col className="el-admin-col-status" />
                  <col className="el-admin-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Solicitud</th>
                    <th>Especialista solicitante</th>
                    <th>Fecha de solicitud</th>
                    <th>Estado</th>
                    <th className="el-reports-table-col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map((solicitud, index) => {
                    const idUnico = solicitud.request_id || solicitud.report_request_id || solicitud.id || `request-${index}`;
                    const fechaSolicitud = solicitud.created_at || solicitud.requested_at;
                    const fecha = fechaSolicitud ? formatChileInstant(fechaSolicitud) : "No disponible";
                    const nombreEspecialista = solicitud.requester_name
                      || nombresPorUid.get(String(solicitud.requester_uid || ""))
                      || (usersLoading ? "Cargando nombre…" : "Nombre no disponible");
                    const esSeguimiento = solicitud.report_type === "TRACKING";
                    const recurso = esSeguimiento
                      ? solicitud.tracking_code || solicitud.tracking_id
                      : solicitud.session_id;
                    const cantidadSesiones = Number(solicitud.session_count) || 0;
                    const formato = String(solicitud.report_format || "PDF").toUpperCase() === "XLSX" ? "Excel" : "PDF";
                    const motivo = esSeguimiento
                      ? `${cantidadSesiones} ${cantidadSesiones === 1 ? "sesión asociada" : "sesiones asociadas"}`
                      : solicitud.motivo || "Sin motivo indicado";

                    return (
                      <tr key={idUnico}>
                        <td className="el-admin-request-cell" data-label="Solicitud">
                          <div className="el-admin-request-resource">
                            <span className={`el-admin-request-type${esSeguimiento ? " is-tracking" : ""}`}>
                              {esSeguimiento ? "Seguimiento" : <>Informe de sesi&oacute;n</>}
                            </span>
                            <strong>{esSeguimiento ? `Informe ${formato}` : "Informe individual"}</strong>
                            <code title={recurso || "ID no disponible"}>{recurso || "ID no disponible"}</code>
                            <span className="el-admin-request-reason">{motivo}</span>
                          </div>
                        </td>
                        <td data-label="Especialista solicitante">
                          <div className="el-reports-table-specialist el-admin-specialist">
                            <span className="el-admin-specialist-label">Especialista</span>
                            <strong className="el-admin-specialist-name">{nombreEspecialista}</strong>
                          </div>
                        </td>
                        <td data-label="Fecha de solicitud">
                          <time dateTime={fechaSolicitud || undefined}>{fecha}</time>
                        </td>
                        <td data-label="Estado">
                          <ReportStatusBadge status={solicitud.status} />
                        </td>
                        <td className="el-reports-table-col-actions" data-label="Acciones">
                          <Button variant="secondary" size="sm" onClick={() => setSolicitudSeleccionada(solicitud)}>
                            Revisar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <ReportReview
        solicitud={solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
      />
    </div>
  );
}
