import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";

import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonPage } from "../../ui/LoadingState.jsx";

import { useSessionDetail } from "./useSessions.js";

import AiResultCard from "./AiResultCard.jsx";
import { isV8Model } from "./sessionModelDisplay.js";

import { formatChileInstant, getExperiencePayloads, getResponsesForDisplay } from "./sessionDisplay.js";
import { chronologicalEvents, describeSessionEvent, formatElapsed, groupOriginalResponses, nonPersonalOriginalResponses } from "./sessionDetailHelpers.js";

import "./SessionDetail.css";

function respuestaOriginalLabel(response) {
  if (response?._displayRespuestaLabel !== undefined) return response._displayRespuestaLabel;
  const value = response?.respuestaLabel ?? response?.respuesta ?? response?.answer ?? response?.valor;
  if (value === null || value === undefined || value === "") return "Sin respuesta";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =========================================================
  // SESIÓN
  // =========================================================

  const {
    data: sesionData,
    isLoading,
    isError,
    refetch: refetchSesion,
  } = useSessionDetail(id);

  // =========================================================
  // ESTADOS DE UI
  // =========================================================

  const [refrescando, setRefrescando] = useState(false);

  // =========================================================
  // DATOS DE LA SESIÓN
  // =========================================================

  const modelProcessing = sesionData?.model_processing || sesionData?.raw_data?.model_processing || {};
  const rawData = sesionData?.raw_data || {};
  const experiencePayloads = getExperiencePayloads(rawData);
  const sessionData = experiencePayloads.reduce((merged, payload) => ({ ...merged, ...payload }), {});
  const respuestasTodas = experiencePayloads.flatMap((payload) => Array.isArray(payload?.respuestas) ? payload.respuestas : []);
  const respuestasParaVista = getResponsesForDisplay(rawData, modelProcessing);
  const respuestasMostradas = nonPersonalOriginalResponses(respuestasParaVista);
  const respuestasPorEtapa = groupOriginalResponses(respuestasMostradas);
  const eventos = chronologicalEvents(experiencePayloads.flatMap((payload) => Array.isArray(payload?.eventos) ? payload.eventos : []));
  const idSesion =
    sesionData?.session_id || id;

  const dificultad =
    sesionData?.difficulty ||
    sessionData?.difficulty_level ||
    "No registrado";

  // Edad y género declarados para la sesión: se leen de los datos del
  // estudiante o de la respuesta original correspondiente.
  const valorDeclarado = (ids) => {
    const aceptados = new Set(ids.map((valor) => String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()));
    const encontrado = respuestasTodas.find((respuesta) => {
      const identificador = String(respuesta?.idPregunta ?? respuesta?.id_pregunta ?? respuesta?.question_id ?? respuesta?.id ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      return aceptados.has(identificador);
    });
    const valor = encontrado?.respuestaLabel ?? encontrado?.respuesta ?? encontrado?.answer ?? encontrado?.valor ?? encontrado?.value;
    return valor === null || valor === undefined || valor === "" ? null : (typeof valor === "object" ? JSON.stringify(valor) : String(valor));
  };

  const edadRegistrada =
    sesionData?.student_data?.edad ??
    sesionData?.edad ??
    sessionData?.edad ??
    valorDeclarado(["edad", "age", "student_age"]);

  const generoRegistrado =
    sesionData?.student_data?.genero ||
    sesionData?.genero ||
    sesionData?.gender ||
    sessionData?.genero ||
    sessionData?.gender ||
    valorDeclarado(["genero", "género", "gender", "student_gender"]) ||
    "";

  const inicioSesion =
    formatChileInstant(sesionData?.capture_started_at) ||
    formatChileInstant(sessionData?.fechaInicio) ||
    sessionData?.fechaInicio ||
    `${sesionData?.fecha || ""} ${
      sesionData?.hora || ""
    }`.trim() ||
    "Sin registro";

  const finTimestamp = sesionData?.capture_ended_at || sesionData?.capture_finished_at || sessionData?.fechaFin;
  const finSesion = formatChileInstant(finTimestamp) || finTimestamp || "Sin registrar";
  const inicioTimestamp = sesionData?.capture_started_at || sessionData?.fechaInicio;
  const duracionSesion = formatElapsed(inicioTimestamp, finTimestamp);
  const estadoSesion = String(sesionData?.status || sesionData?.estado || "").toLowerCase();
  const etiquetasEstado = { completed: "Completada", identified: "Completada", identificada: "Completada", captured: "Completada", capturing: "En proceso", finalizing: "En proceso", importing: "En proceso", imported: "Incompleta", pending_assignment: "Incompleta", pendiente_identificacion: "Incompleta", capture_import_error: "Error de procesamiento", import_error: "Error de procesamiento", processing_error: "Error de procesamiento" };
  const estadoSesionLabel = etiquetasEstado[estadoSesion] || "Sin registrar";

  // =========================================================
  // ACTUALIZAR MANUALMENTE (BOTÓN REFRESCAR)
  // =========================================================

  const handleRefrescar = async () => {
    setRefrescando(true);
    try {
      await refetchSesion();
    } finally {
      setRefrescando(false);
    }
  };

  // =========================================================
  // RESULTADO DEL MODELO
  // =========================================================



  // =========================================================
  // CARGANDO
  // =========================================================

  if (isLoading) {
    return <SkeletonPage variant="detail" showHeader={false} label="Cargando detalle de la sesión" />;
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (isError) {
    return (
      <div className="el-session-detail">
        <EmptyState
          title="No se pudo cargar la sesión"
          description="No se pudo cargar la información de la sesión."
          action={
            <Button
              variant="secondary"
              icon={FiArrowLeft}
              onClick={() =>
                navigate(-1)
              }
            >
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="el-session-detail">

      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <button
        type="button"
        className="el-session-detail-back"
        onClick={() =>
          navigate(-1)
        }
      >
        <FiArrowLeft
          aria-hidden="true"
        />
        Volver
      </button>

      <PageHeader
        title="Detalle de la sesión"
        actions={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Button
              variant="secondary"
              size="sm"
              icon={FiRefreshCw}
              onClick={handleRefrescar}
              loading={refrescando || isLoading}
            >
              Actualizar
            </Button>
          </div>
        }
      />

      {/* ================================================== */}
      {/* GRID                                               */}
      {/* ================================================== */}

      {sesionData?.import_status === "no_data" && (
        <p role="status" className="el-session-detail-notice">
          La captura se cerró, pero no hay registros asociados de los lentes. Las respuestas y eventos no están disponibles.
        </p>
      )}
      {sesionData?.import_status === "error" && (
        <p role="alert" className="el-session-detail-notice">
          No se pudieron importar los registros de los lentes. La sesión y su identificador se conservaron.
        </p>
      )}

      <div className="el-session-detail-grid">

        {/* ================================================= */}
        {/* DATOS ANONIMIZADOS DE LA EXPERIENCIA              */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Datos de la experiencia
          </h3>

          <div className="el-session-detail-facts">

            <div className="el-session-detail-fact">
              <span>ID de sesión</span>
              <span className="el-session-detail-fact-value">
                {idSesion}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Edad</span>
              <span className="el-session-detail-fact-value">
                {edadRegistrada ?? "Sin registrar"}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Género</span>
              <span className="el-session-detail-fact-value">
                {generoRegistrado || "Sin registrar"}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Nivel de dificultad</span>
              <span className="el-session-detail-fact-value">
                {dificultad}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Inicio de sesión</span>
              <span className="el-session-detail-fact-value">
                {inicioSesion}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Fin de sesión</span>
              <span className="el-session-detail-fact-value">
                {finSesion}
              </span>
            </div>

            <div className="el-session-detail-fact"><span>Duración</span><span className="el-session-detail-fact-value">{duracionSesion}</span></div>
            <div className="el-session-detail-fact"><span>Estado de la sesión</span><span className="el-session-detail-fact-value">{estadoSesionLabel}</span></div>

          </div>

        </section>


        {/* ================================================= */}
        {/* RESULTADO DEL MODELO                                     */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            {isV8Model(modelProcessing) ? "Cálculo con IA" : "Resultado automatizado"}
          </h3>

          <AiResultCard
            sesionData={sesionData}
          />


        </section>

        {/* ================================================= */}
        {/* RESPUESTAS                                        */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Respuestas de la sesión
          </h3>
          <p className="el-session-detail-answer-note">Se muestran los valores normalizados cuando corresponde. El registro original de Unity se conserva sin cambios.</p>

          {respuestasMostradas.length > 0 ? (
            <div className="el-session-detail-answer-stages">
              {respuestasPorEtapa.map((stage) => <section className="el-session-detail-answer-stage" key={stage.id} aria-labelledby={`answer-stage-${stage.id}`}>
                <h4 id={`answer-stage-${stage.id}`}>{stage.label}<span>{stage.responses.length} {stage.responses.length === 1 ? "respuesta" : "respuestas"}</span></h4>
                <div className="el-session-detail-answers">
                {stage.responses.map((resp) => (

                  <div
                    key={resp._originalIndex}
                    className="el-session-detail-answer"
                  >

                    <div className="el-session-detail-answer-header">

                      <span
                        title={
                          resp.textoPregunta
                        }
                      >
                        {resp.textoPregunta || resp.pregunta || resp.question || "Pregunta sin registrar"}
                      </span>

                      {(resp.numeroPregunta ?? resp.numero_pregunta ?? resp.numero) != null && <Badge tone="neutral">#{resp.numeroPregunta ?? resp.numero_pregunta ?? resp.numero}</Badge>}

                    </div>

                    <div className={`el-session-detail-answer-value${resp._normalizacionFallida ? " is-normalization-error" : ""}`}>
                      {respuestaOriginalLabel(resp)}
                    </div>

                    <div className="el-session-detail-answer-footer">

                      <span>
                        {resp.escena
                          ? `Escena: ${resp.escena}`
                          : "—"}
                      </span>

                      <span>
                        {formatChileInstant(resp.timestamp) || resp.timestamp || ""}
                      </span>

                    </div>

                  </div>

                ))}
                </div>
              </section>)}
            </div>
          ) : (
            <EmptyState
              title="Sin respuestas registradas"
            />
          )}

        </section>

        {/* ================================================= */}
        {/* EVENTOS                                           */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Eventos de la sesión
          </h3>

          {eventos.length > 0 ? (
            <div className="el-session-detail-events">

              {eventos.map(
                (evt, index) => (

                  <div
                    key={index}
                    className="el-session-detail-event"
                  >

                    <Badge tone="neutral">
                      {evt.fase || "—"}
                    </Badge>

                    <span className="el-session-detail-event-name">
                      {describeSessionEvent(evt)}
                    </span>

                    <span className="el-session-detail-event-time">
                      {formatChileInstant(evt.timestamp) || evt.timestamp}
                    </span>

                  </div>

                )
              )}

            </div>
          ) : (
            <EmptyState
              title="Sin eventos registrados"
            />
          )}

        </section>

      </div>

    </div>
  );
}
