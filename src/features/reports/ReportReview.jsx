import React, { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import Modal from "../../ui/Modal.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import ReportStatusBadge from "./ReportStatusBadge.jsx";
import { formatChileInstant } from "../sessions/sessionDisplay.js";
import { useReviewReportRequest, useUsersDirectory } from "./useReports.js";
import "./ReportReview.css";

function mostrar(value) {
  return value === null || value === undefined || value === ""
    ? "No disponible"
    : value;
}

/** Admin report review deliberately contains request metadata only. */
export default function ReportReview({ solicitud, onClose }) {
  const [accion, setAccion] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const revisar = useReviewReportRequest();
  const { data: usersData } = useUsersDirectory();

  useEffect(() => {
    if (!solicitud) {
      setAccion(null);
      setMotivoRechazo("");
      setErrorAccion("");
    }
  }, [solicitud]);

  if (!solicitud) return null;

  const id = solicitud.request_id || solicitud.report_request_id || solicitud.id;
  const pendiente = String(solicitud.status || "").toUpperCase() === "PENDING";
  const fechaSolicitud = solicitud.created_at
    ? formatChileInstant(solicitud.created_at)
    : "No disponible";
  const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
  const requester = users.find((user) => String(user.uid || user.user_id || user.id || "") === String(solicitud.requester_uid || ""));
  const requesterName = requester?.nombre || requester?.name || solicitud.requester_uid || "el especialista solicitante";
  const esSeguimiento = solicitud.report_type === "TRACKING";
  const recurso = esSeguimiento
    ? solicitud.tracking_code || solicitud.tracking_id
    : solicitud.session_id;
  const cantidadSesiones = Number(solicitud.session_count) || 0;
  const formatoSeguimiento = String(solicitud.report_format || "PDF").toUpperCase() === "XLSX" ? "Excel" : "PDF";
  const detalleSolicitud = esSeguimiento
    ? `Informe ${formatoSeguimiento} · ${cantidadSesiones} ${cantidadSesiones === 1 ? "sesión asociada" : "sesiones asociadas"}`
    : mostrar(solicitud.motivo);
  const reportTarget = esSeguimiento
    ? `el seguimiento ${solicitud.tracking_code || solicitud.tracking_id || "solicitado"}`
    : `la sesión ${solicitud.session_id || "solicitada"}`;

  const completeReview = (approved, reason) => {
    setErrorAccion("");
    revisar.mutate(
      { id, approved, reason },
      {
        onSuccess: () => {
          setAccion(null);
          setMotivoRechazo("");
          onClose();
        },
        onError: (error) => {
          setErrorAccion(error?.message || "No se pudo actualizar la solicitud.");
        },
      },
    );
  };

  const handleReject = () => {
    if (!motivoRechazo.trim()) {
      setErrorAccion("Debes indicar un motivo de rechazo.");
      return;
    }
    completeReview(false, motivoRechazo.trim());
  };

  return (
    <>
      <Modal
        open={Boolean(solicitud)}
        onClose={onClose}
        title="Revisar solicitud"
        size="lg"
        className="el-report-review-modal"
        footer={(
          <div className="el-report-review-actions">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            {pendiente && (
              <>
                <Button variant="danger" onClick={() => setAccion("reject")}>Rechazar solicitud</Button>
                <Button variant="primary" onClick={() => setAccion("approve")}>Aprobar reporte</Button>
              </>
            )}
          </div>
        )}
      >
        <div className="el-report-review-summary">
          <div className="el-report-review-summary-top">
            <span className={`el-report-review-type${esSeguimiento ? " is-tracking" : ""}`}>
              {esSeguimiento ? "Informe de seguimiento" : "Informe individual"}
            </span>
            <ReportStatusBadge status={solicitud.status} />
          </div>
          <h4 title={recurso || "ID no disponible"}>{mostrar(recurso)}</h4>
          <p>{detalleSolicitud}</p>
        </div>

        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Datos para la revisión</h4>
          <div className="el-report-review-facts">
            <div className="el-report-review-fact">
              <span>Especialista</span>
              <span className="el-report-review-fact-value">
                {requester?.nombre || requester?.name || "Especialista solicitante"}
              </span>
              <code className="el-report-review-fact-detail">{mostrar(solicitud.requester_uid)}</code>
            </div>
            <div className="el-report-review-fact">
              <span>Motivo de la solicitud</span>
              <span className="el-report-review-fact-value">{detalleSolicitud}</span>
            </div>
            <div className="el-report-review-fact">
              <span>Fecha de solicitud</span>
              <span className="el-report-review-fact-value">{mostrar(fechaSolicitud)}</span>
            </div>
          </div>
          <p className="el-report-review-notice">
            <FiInfo aria-hidden="true" />
            <span>La revisión muestra solo los datos de la solicitud. No incluye las respuestas ni los resultados de IA.</span>
          </p>
        </section>
        {errorAccion && <p className="el-report-review-error" role="alert">{errorAccion}</p>}
      </Modal>

      <ConfirmationDialog
        open={accion === "approve"}
        title="Aprobar reporte"
        message={`Al aprobar esta solicitud, autorizas a ${requesterName} a descargar el informe de ${reportTarget}.`}
        confirmLabel="Aprobar reporte"
        cancelLabel="Cancelar"
        loading={revisar.isPending}
        onConfirm={() => completeReview(true)}
        onCancel={() => setAccion(null)}
      >
        {errorAccion && <p className="el-report-review-error" role="alert">{errorAccion}</p>}
      </ConfirmationDialog>

      <ConfirmationDialog
        open={accion === "reject"}
        title="Rechazar solicitud"
        message="Indica el motivo del rechazo."
        confirmLabel="Rechazar solicitud"
        cancelLabel="Cancelar"
        tone="danger"
        loading={revisar.isPending}
        onConfirm={handleReject}
        onCancel={() => setAccion(null)}
      >
        <label className="el-report-review-reason">
          Motivo del rechazo
          <textarea
            value={motivoRechazo}
            onChange={(event) => setMotivoRechazo(event.target.value)}
            rows={3}
            placeholder="Explica brevemente por qué se rechaza la solicitud."
          />
        </label>
        {errorAccion && <p className="el-report-review-error" role="alert">{errorAccion}</p>}
      </ConfirmationDialog>
    </>
  );
}
