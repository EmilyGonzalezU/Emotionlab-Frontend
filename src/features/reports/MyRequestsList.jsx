import React, { useEffect, useMemo, useState } from "react";
import { FiInbox, FiSearch, FiRefreshCw, FiDownload, FiAlertTriangle, FiInfo } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import ReportStatusBadge from "./ReportStatusBadge.jsx";
import Badge from "../../ui/Badge.jsx";
import Modal from "../../ui/Modal.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import {
  useMyReportRequests,
  useReportDownloadUrl,
} from "./useReports.js";
import {
  useReadTracking,
  marcarSolicitudVista,
} from "./useReadTracking.js";
import "./ReportsList.css";
import "./ReportReview.css";

function mostrar(valor) {
  if (valor === null || valor === undefined || valor === "") return "No disponible";
  return valor;
}

function formatearFecha(iso) {
  if (!iso) return "No disponible";
  try {
    return new Date(iso).toLocaleDateString("es-CL");
  } catch {
    return String(iso);
  }
}

function formatearFechaHora(iso) {
  if (!iso) return "No disponible";
  try {
    return new Date(iso).toLocaleString("es-CL");
  } catch {
    return String(iso);
  }
}

function fechaPrioridad(s) {
  if (!s) return "";
  return (
    s.updated_at ||
    s.reviewed_at ||
    s.downloaded_at ||
    s.requested_at ||
    s.created_at ||
    ""
  );
}

function getMotivoRevision(s) {
  if (!s) return "";
  const estado = String(s.status || "").toUpperCase();
  if (estado === "REJECTED") {
    return s.rejection_reason || s.reason || "";
  }
  return s.review_comments || s.reason || "";
}

export default function MyRequestsList() {
  const { data, isLoading, isError, refetch } = useMyReportRequests();
  const pedirUrlDescarga = useReportDownloadUrl();

  const solicitudes = useMemo(() => {
    const raw = Array.isArray(data) ? data : data?.items || [];
    return [...raw].sort((a, b) => {
      const fa = fechaPrioridad(a);
      const fb = fechaPrioridad(b);
      if (!fa && !fb) return 0;
      if (!fa) return 1;
      if (!fb) return -1;
      return new Date(fb).getTime() - new Date(fa).getTime();
    });
  }, [data]);

  const { noVistos } = useReadTracking(solicitudes);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [refrescando, setRefrescando] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const [errorDescarga, setErrorDescarga] = useState("");
  const [mostrarErrorDescarga, setMostrarErrorDescarga] = useState(false);

  const handleRefrescar = async () => {
    setRefrescando(true);
    try {
      await refetch();
    } finally {
      setRefrescando(false);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (filtroEstado) {
        const st = String(s?.status || "").toUpperCase();
        if (st !== filtroEstado) return false;
      }
      if (!termino) return true;
      return (
        String(s.session_id || "").toLowerCase().includes(termino) ||
        String(s.motivo || "").toLowerCase().includes(termino) ||
        String(getMotivoRevision(s) || "").toLowerCase().includes(termino) ||
        String(s.id || s.request_id || "").toLowerCase().includes(termino)
      );
    });
  }, [solicitudes, busqueda, filtroEstado]);

  const abrirDetalle = (solicitud) => {
    marcarSolicitudVista(solicitud);
    setSolicitudSeleccionada(solicitud);
  };

  useEffect(() => {
    if (!solicitudSeleccionada) return;
    // Si el usuario vuelve a abrir una solicitud después de un refresh,
    // se re-marcar como vista por si el backend actualizó reviewed_at.
    marcarSolicitudVista(solicitudSeleccionada);
  }, [solicitudSeleccionada]);

  const idUnico = (s) => s?.report_request_id || s?.request_id || s?.id;

  const handleDescargar = () => {
    if (!solicitudSeleccionada) return;
    const idSolicitud = idUnico(solicitudSeleccionada);
    if (!idSolicitud) {
      setErrorDescarga("No se encontró un identificador válido para la solicitud.");
      setMostrarErrorDescarga(true);
      return;
    }
    setErrorDescarga("");
    pedirUrlDescarga.mutate(idSolicitud, {
      onSuccess: (data) => {
        const url = data?.download_url || data?.url;
        if (!url) {
          setErrorDescarga(
            "El reporte fue generado, pero el servidor no devolvió un enlace de descarga válido."
          );
          setMostrarErrorDescarga(true);
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      },
      onError: (error) => {
        setErrorDescarga(
          error?.message || "No se pudo obtener el enlace de descarga del reporte."
        );
        setMostrarErrorDescarga(true);
      },
    });
  };

  const estadosDisponibles = [
    { value: "", label: "Todos" },
    { value: "PENDING", label: "Pendientes" },
    { value: "APPROVED", label: "Aprobadas" },
    { value: "REJECTED", label: "Rechazadas" },
    { value: "COMPLETED", label: "Disponibles" },
  ];

  const esNoVisto = (s) => {
    const st = String(s?.status || "").toUpperCase();
    if (st === "PENDING") return false;
    return noVistos > 0 && esCambioNoVistoSimple(s);
  };

  return (
    <div className="el-reports-list">
      <PageHeader
        title="Mis solicitudes de reportes"
        description="Historial de solicitudes de reportes enviadas y su estado actual."
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

      <div className="el-reports-search" style={{ gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px", minWidth: 0 }}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            className="el-reports-search-input"
            placeholder="Buscar por sesión, formato o ID"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar solicitudes"
          />
        </div>
        <select
          className="el-reports-search-input"
          style={{ flex: "0 1 auto", minWidth: "160px" }}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          {estadosDisponibles.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <section className="el-reports-table-card">
        {isLoading ? (
          <SkeletonRows rows={5} columns={6} />
        ) : isError ? (
          <EmptyState
            title="No se pudieron obtener las solicitudes"
            description="Ocurrió un problema al conectar con el servidor. Intenta nuevamente."
          />
        ) : solicitudesFiltradas.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title="Sin solicitudes"
            description={
              busqueda || filtroEstado
                ? "No se encontraron solicitudes con esos criterios."
                : "No has enviado solicitudes de reportes todavía."
            }
          />
        ) : (
          <div className="el-reports-table-scroll">
            <table className="el-reports-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Sesión</th>
                  <th>Participante</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Solicitante</th>
                  <th className="el-reports-table-col-actions">Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => {
                  const sid = idUnico(s);
                  return (
                    <tr key={sid || String(s.session_id || Math.random())}>
                      <td className="el-reports-table-id">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>#{sid || "—"}</span>
                          {esNoVisto(s) && (
                            <Badge tone="warning">Nuevo</Badge>
                          )}
                        </div>
                      </td>
                      <td className="el-reports-table-id">{s.session_id || "—"}</td>
                      <td>{mostrar(s.participant_id || s.participant_name || "—")}</td>
                      <td>{formatearFecha(s.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                          <ReportStatusBadge status={s.status} />
                          {String(s.status || "").toUpperCase() === "REJECTED" && getMotivoRevision(s) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "4px",
                                fontSize: "12px",
                                color: "var(--el-color-danger)",
                                lineHeight: 1.3,
                                minWidth: 0,
                              }}
                            >
                              <FiAlertTriangle aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }} />
                              <span style={{ minWidth: 0, wordBreak: "break-word" }}>
                                {getMotivoRevision(s)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="el-reports-table-specialist">
                          <span>{mostrar(s.requester_name || s.requester_email)}</span>
                          {s.requester_email && (
                            <span className="el-reports-table-specialist-email">
                              {s.requester_email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="el-reports-table-col-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => abrirDetalle(s)}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DetalleSolicitudModal
        solicitud={solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        onDescargar={handleDescargar}
        descargando={pedirUrlDescarga.isPending}
      />

      <ConfirmationDialog
        open={mostrarErrorDescarga}
        title="Error al descargar"
        message={errorDescarga || "Ocurrió un error."}
        confirmLabel="Entendido"
        onConfirm={() => setMostrarErrorDescarga(false)}
        onCancel={() => setMostrarErrorDescarga(false)}
        tone="danger"
      />
    </div>
  );
}

function esCambioNoVistoSimple(solicitud) {
  try {
    const STORAGE_KEY = "el_report_requests_read";
    const raw = localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const id = String(
      solicitud?.report_request_id ||
      solicitud?.request_id ||
      solicitud?.id ||
      ""
    );
    if (!id) return false;
    const estadoActual = String(solicitud?.status || "").toUpperCase();
    const revisadaEn = solicitud?.reviewed_at
      ? new Date(solicitud.reviewed_at).toISOString()
      : null;
    const previo = store[id];
    if (!previo) {
      return (
        estadoActual === "APPROVED" ||
        estadoActual === "REJECTED" ||
        estadoActual === "COMPLETED"
      );
    }
    if (previo.status !== estadoActual) return true;
    if (
      revisadaEn &&
      (!previo.reviewed_at || previo.reviewed_at !== revisadaEn)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function DetalleSolicitudModal({ solicitud, onClose, onDescargar, descargando }) {
  const open = Boolean(solicitud);

  if (!solicitud) return null;

  const estado = String(solicitud.status || "").toUpperCase();
  const puedeDescargar = estado === "COMPLETED";
  const idSolicitud =
    solicitud.report_request_id || solicitud.request_id || solicitud.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Detalle de la solicitud #${idSolicitud || "—"}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          {puedeDescargar && (
            <Button
              variant="primary"
              icon={FiDownload}
              onClick={onDescargar}
              loading={descargando}
            >
              {descargando ? "Preparando descarga..." : "Descargar reporte"}
            </Button>
          )}
        </>
      }
    >
      <section className="el-report-review-section">
        <h4 className="el-report-review-section-title">Solicitud</h4>
        <div className="el-report-review-facts">
          <div className="el-report-review-fact">
            <span>ID de solicitud</span>
            <span className="el-report-review-fact-value">
              {mostrar(idSolicitud)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Sesión</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.session_id)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Formato</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.motivo)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Fecha de solicitud</span>
            <span className="el-report-review-fact-value">
              {formatearFechaHora(solicitud.created_at)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Estado</span>
            <ReportStatusBadge status={solicitud.status} />
          </div>
        </div>
      </section>

      <section className="el-report-review-section">
        <h4 className="el-report-review-section-title">Participante y solicitante</h4>
        <div className="el-report-review-facts">
          <div className="el-report-review-fact">
            <span>ID participante</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.participant_id)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Nombre participante</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.participant_name)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Solicitante</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.requester_name || solicitud.requester_email)}
            </span>
          </div>
          <div className="el-report-review-fact">
            <span>Correo solicitante</span>
            <span className="el-report-review-fact-value">
              {mostrar(solicitud.requester_email)}
            </span>
          </div>
        </div>
      </section>

      {(solicitud.reviewed_at || solicitud.reviewer_name || getMotivoRevision(solicitud)) && (
        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Revisión del administrador</h4>
          <div className="el-report-review-facts">
            <div className="el-report-review-fact">
              <span>Revisado por</span>
              <span className="el-report-review-fact-value">
                {mostrar(solicitud.reviewer_name || solicitud.reviewer_email)}
              </span>
            </div>
            <div className="el-report-review-fact">
              <span>Fecha de revisión</span>
              <span className="el-report-review-fact-value">
                {formatearFechaHora(solicitud.reviewed_at)}
              </span>
            </div>
          </div>

          {getMotivoRevision(solicitud) && (
            <p className="el-report-review-notice" style={{ marginTop: "12px" }}>
              {estado === "REJECTED" ? (
                <FiAlertTriangle aria-hidden="true" />
              ) : (
                <FiInfo aria-hidden="true" />
              )}
              <span>
                <strong>{estado === "REJECTED" ? "Motivo de rechazo:" : "Comentarios:"}</strong>{" "}
                {getMotivoRevision(solicitud)}
              </span>
            </p>
          )}
        </section>
      )}

      {solicitud.downloaded_at && (
        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Descarga</h4>
          <div className="el-report-review-facts">
            <div className="el-report-review-fact">
              <span>Última descarga</span>
              <span className="el-report-review-fact-value">
                {formatearFechaHora(solicitud.downloaded_at)}
              </span>
            </div>
          </div>
        </section>
      )}
    </Modal>
  );
}
