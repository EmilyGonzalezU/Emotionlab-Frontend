import React, { useEffect, useState } from "react";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import Modal from "../../ui/Modal.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import ReportStatusBadge from "./ReportStatusBadge.jsx";
import AiResultCard from "../sessions/AiResultCard.jsx";
import { useReviewReportRequest, useSessionContextForAdmin } from "./useReports.js";
import "./ReportReview.css";

// Nunca se muestra un dato inventado: si el campo no viene del
// backend, se dice explícitamente que no está disponible.
function mostrar(valor) {
  if (valor === null || valor === undefined || valor === "") return "No disponible";
  return valor;
}

/**
 * Panel de revisión de una solicitud de reporte para el administrador.
 *
 * Muestra el contexto real de la sesión (reutilizando GET
 * /sessions/:id, el mismo endpoint que ya usa el especialista) y deja
 * aprobar/rechazar mediante PATCH /report-requests/:id/review, con
 * confirmación explícita en ambos casos. Nunca simula un estado
 * COMPLETED: tras aprobar o rechazar, se cierra y la lista de
 * pendientes (que ya invalida React Query) refleja el estado real que
 * devuelva el backend.
 */
export default function ReportReview({ solicitud, nombreEspecialista, onClose }) {
  const open = Boolean(solicitud);
  const sessionId = solicitud?.session_id;

  const { data: contexto, isLoading: cargandoContexto } = useSessionContextForAdmin(sessionId);
  const revisar = useReviewReportRequest();

  const [accion, setAccion] = useState(null); // "approve" | "reject" | null
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    if (!open) {
      setAccion(null);
      setMotivoRechazo("");
      setErrorAccion("");
    }
  }, [open]);

  if (!solicitud) return null;

  const idUnico = solicitud.request_id || solicitud.id;
  const fechaSolicitud = solicitud.created_at
    ? new Date(solicitud.created_at).toLocaleString("es-CL")
    : "No disponible";

  const sesionAdmin = contexto?.status === "ok" ? contexto.data : null;
  const rawData = sesionAdmin?.raw_data || {};
  const duracion = sesionAdmin?.duracion ?? sesionAdmin?.duration;
  const dificultad = sesionAdmin?.difficulty ?? sesionAdmin?.difficulty_level;
  const estadoSesion = sesionAdmin?.status ?? sesionAdmin?.estado;
  const inicioSesion =
    sesionAdmin?.fechaInicio ||
    (sesionAdmin?.fecha || sesionAdmin?.hora
      ? `${sesionAdmin?.fecha || ""} ${sesionAdmin?.hora || ""}`.trim()
      : null);

  const handleAprobar = () => {
    setErrorAccion("");
    revisar.mutate(
      { id: idUnico, approved: true },
      {
        onSuccess: () => {
          setAccion(null);
          onClose();
        },
        onError: (error) => {
          setErrorAccion(error?.message || "No se pudo aprobar la solicitud.");
        },
      },
    );
  };

  const handleRechazar = () => {
    // El backend exige "reason" cuando approved=false (responde 400 si
    // falta) — nunca es realmente opcional, así que se valida acá
    // antes de llamar al endpoint en vez de dejar que falle.
    if (!motivoRechazo.trim()) {
      setErrorAccion("Debes indicar un motivo de rechazo.");
      return;
    }

    setErrorAccion("");
    revisar.mutate(
      { id: idUnico, approved: false, reason: motivoRechazo.trim() },
      {
        onSuccess: () => {
          setAccion(null);
          setMotivoRechazo("");
          onClose();
        },
        onError: (error) => {
          setErrorAccion(error?.message || "No se pudo rechazar la solicitud.");
        },
      },
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Revisión de solicitud de reporte"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="danger" onClick={() => setAccion("reject")}>
              Rechazar solicitud
            </Button>
            <Button variant="primary" onClick={() => setAccion("approve")}>
              Aprobar reporte
            </Button>
          </>
        }
      >
        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Solicitud</h4>
          <div className="el-report-review-facts">
            <div className="el-report-review-fact">
              <span>Especialista</span>
              <span className="el-report-review-fact-value">{mostrar(nombreEspecialista)}</span>
            </div>
            <div className="el-report-review-fact">
              <span>Correo</span>
              <span className="el-report-review-fact-value">{mostrar(solicitud.requester_email)}</span>
            </div>
            <div className="el-report-review-fact">
              <span>Formato</span>
              <span className="el-report-review-fact-value">{mostrar(solicitud.motivo)}</span>
            </div>
            <div className="el-report-review-fact">
              <span>Fecha de solicitud</span>
              <span className="el-report-review-fact-value">{fechaSolicitud}</span>
            </div>
            <div className="el-report-review-fact">
              <span>Estado de la solicitud</span>
              <ReportStatusBadge status={solicitud.status} />
            </div>
          </div>
        </section>

        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Contexto de la sesión</h4>

          {cargandoContexto ? (
            <SkeletonRows rows={4} columns={2} />
          ) : contexto?.status === "unauthorized" ? (
            <p className="el-report-review-notice">
              <FiAlertTriangle aria-hidden="true" />
              <span>No tienes autorización para ver el detalle completo de esta sesión.</span>
            </p>
          ) : contexto?.status !== "ok" ? (
            <p className="el-report-review-notice">
              <FiAlertTriangle aria-hidden="true" />
              <span>No se pudo obtener el contexto de la sesión.</span>
            </p>
          ) : (
            <>
              <div className="el-report-review-facts">
                <div className="el-report-review-fact">
                  <span>ID de sesión</span>
                  <span className="el-report-review-fact-value">
                    {mostrar(sesionAdmin?.session_id || solicitud.session_id)}
                  </span>
                </div>
                <div className="el-report-review-fact">
                  <span>ID participante</span>
                  <span className="el-report-review-fact-value">{mostrar(sesionAdmin?.idParticipante)}</span>
                </div>
                <div className="el-report-review-fact">
                  <span>Nombre del alumno</span>
                  <span className="el-report-review-fact-value">
                    {mostrar(sesionAdmin?.nombre || rawData?.session_data?.nombre)}
                  </span>
                </div>
                <div className="el-report-review-fact">
                  <span>Fecha de la sesión</span>
                  <span className="el-report-review-fact-value">{mostrar(inicioSesion)}</span>
                </div>
                <div className="el-report-review-fact">
                  <span>Duración</span>
                  <span className="el-report-review-fact-value">{mostrar(duracion)}</span>
                </div>
                <div className="el-report-review-fact">
                  <span>Nivel de dificultad</span>
                  <span className="el-report-review-fact-value">{mostrar(dificultad)}</span>
                </div>
                <div className="el-report-review-fact">
                  <span>Estado de la sesión</span>
                  <span className="el-report-review-fact-value">{mostrar(estadoSesion)}</span>
                </div>
              </div>

              <div className="el-report-review-ai">
                <span className="el-report-review-ai-label">Resultado de IA</span>
                <AiResultCard sesionData={sesionAdmin} />
              </div>
            </>
          )}
        </section>

        <section className="el-report-review-section">
          <h4 className="el-report-review-section-title">Consentimiento</h4>
          <p className="el-report-review-notice">
            <FiInfo aria-hidden="true" />
            <span>Información de consentimiento no disponible desde el frontend.</span>
          </p>
        </section>

        {errorAccion && <p className="el-report-review-error">{errorAccion}</p>}
      </Modal>

      <ConfirmationDialog
        open={accion === "approve"}
        title="Aprobar reporte"
        message="¿Confirmas la aprobación de este reporte? Al aprobarlo se iniciará el proceso de generación del PDF."
        confirmLabel="Aprobar reporte"
        cancelLabel="Cancelar"
        loading={revisar.isPending}
        onConfirm={handleAprobar}
        onCancel={() => setAccion(null)}
      >
        {errorAccion && <p className="el-report-review-error">{errorAccion}</p>}
      </ConfirmationDialog>

      <ConfirmationDialog
        open={accion === "reject"}
        title="Rechazar solicitud"
        message="¿Confirmas el rechazo de esta solicitud de reporte? El motivo es obligatorio."
        confirmLabel="Rechazar solicitud"
        cancelLabel="Cancelar"
        tone="danger"
        loading={revisar.isPending}
        onConfirm={handleRechazar}
        onCancel={() => setAccion(null)}
      >
        <label className="el-report-review-reason">
          Motivo del rechazo
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            rows={3}
            placeholder="Explica brevemente por qué se rechaza la solicitud."
          />
        </label>
        {errorAccion && <p className="el-report-review-error">{errorAccion}</p>}
      </ConfirmationDialog>
    </>
  );
}
