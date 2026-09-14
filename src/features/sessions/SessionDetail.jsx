import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiCheck,
  FiX,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiUser,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";

import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import Modal from "../../ui/Modal.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";

import { api } from "../../lib/apiClient.js";

import {
  useSessionDetail,
  useUpdateStudentName,
} from "./useSessions.js";

import {
  interpretarResultadoIA,
  AVISO_IA,
} from "./predictionHelpers.js";

import AiResultCard from "./AiResultCard.jsx";

import {
  useCreateReportRequest,
  useMyReportRequests,
  useReportDownloadUrl,
} from "../reports/useReports.js";

import ReportRequestDialog from "../reports/ReportRequestDialog.jsx";

import {
  obtenerEtiquetaSolicitud,
  obtenerSolicitudRelevante,
} from "../reports/reportHelpers.js";

import "./SessionDetail.css";

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
  // REPORTES
  // =========================================================

  const {
    data: solicitudesData,
    refetch: refetchSolicitudes,
  } = useMyReportRequests();

  const actualizarNombre = useUpdateStudentName(id);
  const crearSolicitud = useCreateReportRequest();
  const pedirUrlDescarga = useReportDownloadUrl();

  // =========================================================
  // ESTADOS DE UI
  // =========================================================

  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");

  const [aviso, setAviso] = useState(null);

  const [formatoAConfirmar, setFormatoAConfirmar] =
    useState(null);

  // =========================================================
  // PARTICIPANTES
  // =========================================================

  const [busquedaParticipante, setBusquedaParticipante] =
    useState("");

  const [participantes, setParticipantes] = useState([]);

  const [buscandoParticipantes, setBuscandoParticipantes] =
    useState(false);

  const [mostrarParticipantes, setMostrarParticipantes] =
    useState(false);

  const [participantId, setParticipantId] =
    useState("");

  const [nombreParticipante, setNombreParticipante] =
    useState("");

  const [guardandoParticipante, setGuardandoParticipante] =
    useState(false);

  const [errorParticipante, setErrorParticipante] =
    useState("");

  // =========================================================
  // DATOS DE LA SESIÓN
  // =========================================================

  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};

  const respuestas = sessionData?.respuestas || [];
  const eventos = sessionData?.eventos || [];

  const nombreAlumno =
    sesionData?.nombre ||
    sessionData?.nombre ||
    sessionData?.student_name ||
    "Sin especificar";

  const edadAlumno =
    sesionData?.edad ||
    sessionData?.edad ||
    sessionData?.age
      ? `${
          sesionData?.edad ||
          sessionData?.edad ||
          sessionData?.age
        } años`
      : "Sin registrar";

  const cursoAlumno =
    sesionData?.curso ||
    sessionData?.curso ||
    sessionData?.course ||
    sessionData?.grade ||
    "No asignado";

  const generoAlumno =
    sesionData?.genero ||
    sessionData?.genero ||
    sessionData?.gender ||
    "Sin registrar";

  const idSesion =
    sesionData?.session_id || id;

  const dificultad =
    sesionData?.difficulty ||
    sessionData?.difficulty_level ||
    "No registrado";

  const inicioSesion =
    sessionData?.fechaInicio ||
    `${sesionData?.fecha || ""} ${
      sesionData?.hora || ""
    }`.trim() ||
    "Sin registro";

  const finSesion =
    sessionData?.fechaFin ||
    "En curso / Sin registro";

  // =========================================================
  // PARTICIPANTE INICIAL
  // =========================================================

  useEffect(() => {
    const idExistente =
      sesionData?.participant_id ||
      sessionData?.participant_id ||
      sessionData?.idParticipante ||
      "";

    const nombreExistente =
      sesionData?.participant_name ||
      sessionData?.participant_name ||
      sessionData?.participant?.nombre ||
      "";

    if (idExistente) {
      setParticipantId(idExistente);
    }

    if (nombreExistente) {
      setNombreParticipante(nombreExistente);
    }
  }, [sesionData]);

  // =========================================================
  // SOLICITUDES
  // =========================================================

  const solicitudes = solicitudesData?.items || [];

  const deEstaSesion = useMemo(() => {
    return solicitudes.filter(
      (s) =>
        String(
          s?.session_id ||
            s?.sessionId ||
            ""
        ) === String(idSesion)
    );
  }, [solicitudes, idSesion]);

  /*
   * IMPORTANTE:
   *
   * Antes:
   *
   * obtenerSolicitudRelevante(deEstaSesion, "PDF")
   *
   * Ahora:
   *
   * se busca la solicitud real sin depender de motivo.
   */

  const solicitud = useMemo(
    () =>
      obtenerSolicitudRelevante(deEstaSesion),
    [deEstaSesion]
  );

  const estadoSolicitud = String(
    solicitud?.status || ""
  ).toUpperCase();

  const etiquetaSolicitud =
    obtenerEtiquetaSolicitud(solicitud);

  // =========================================================
  // ACTUALIZAR AUTOMÁTICAMENTE APPROVED -> COMPLETED
  // =========================================================

  useEffect(() => {
    if (estadoSolicitud !== "APPROVED") {
      return undefined;
    }

    const intervalo = setInterval(() => {
      refetchSolicitudes();
    }, 2000);

    return () => clearInterval(intervalo);
  }, [
    estadoSolicitud,
    refetchSolicitudes,
  ]);

  // =========================================================
  // EDITAR NOMBRE
  // =========================================================

  const abrirEdicionNombre = () => {
    setNuevoNombre(
      nombreAlumno !== "Sin especificar"
        ? nombreAlumno
        : ""
    );

    setErrorNombre("");
    setEditandoNombre(true);
  };

  const cancelarEdicionNombre = () => {
    setEditandoNombre(false);
    setErrorNombre("");
  };

  const cambiarNuevoNombre = (e) => {
    const val = e.target.value;

    if (val.length > 25) {
      setErrorNombre(
        "El nombre no puede superar los 25 caracteres."
      );
      return;
    }

    if (
      !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/.test(
        val
      )
    ) {
      setErrorNombre(
        "No se permiten caracteres especiales."
      );
      return;
    }

    setErrorNombre("");
    setNuevoNombre(val);
  };

  const guardarNombre = (e) => {
    e.preventDefault();

    if (!nuevoNombre.trim()) {
      setErrorNombre(
        "El nombre no puede estar vacío."
      );
      return;
    }

    actualizarNombre.mutate(
      nuevoNombre.trim(),
      {
        onSuccess: () =>
          setEditandoNombre(false),

        onError: (error) =>
          setErrorNombre(
            error?.message ||
              "No se pudo actualizar el nombre del alumno."
          ),
      }
    );
  };

  // =========================================================
  // BUSCAR PARTICIPANTES
  // =========================================================

  const buscarParticipantes = async () => {
    const texto =
      busquedaParticipante.trim();

    if (!texto) {
      setParticipantes([]);
      setMostrarParticipantes(false);
      return;
    }

    try {
      setBuscandoParticipantes(true);
      setErrorParticipante("");

      const data = await api.get(
        `/participants/search?name=${encodeURIComponent(
          texto
        )}`
      );

      const lista = Array.isArray(data)
        ? data
        : data?.participants ||
          data?.items ||
          data?.data ||
          [];

      setParticipantes(lista);
      setMostrarParticipantes(true);
    } catch (error) {
      console.error(
        "Error buscando participantes:",
        error
      );

      setErrorParticipante(
        error?.message ||
          "No se pudieron buscar los participantes."
      );
    } finally {
      setBuscandoParticipantes(false);
    }
  };

  useEffect(() => {
    const texto =
      busquedaParticipante.trim();

    if (!texto) {
      setParticipantes([]);
      setMostrarParticipantes(false);
      return;
    }

    const timer = setTimeout(
      buscarParticipantes,
      350
    );

    return () =>
      clearTimeout(timer);
  }, [busquedaParticipante]);

  // =========================================================
  // SELECCIONAR PARTICIPANTE
  // =========================================================

  const seleccionarParticipante = (
    participante
  ) => {
    const idSeleccionado =
      participante?.participant_id ||
      participante?.id ||
      "";

    const nombreSeleccionado =
      participante?.nombre ||
      participante?.name ||
      participante?.nombre_completo ||
      "";

    setParticipantId(idSeleccionado);
    setNombreParticipante(nombreSeleccionado);

    setBusquedaParticipante("");
    setParticipantes([]);
    setMostrarParticipantes(false);

    setErrorParticipante("");
  };

  // =========================================================
  // GUARDAR PARTICIPANTE
  // =========================================================

  const guardarParticipante = async () => {
    const nombre =
      nombreParticipante.trim();

    if (!nombre) {
      setErrorParticipante(
        "Debes ingresar el nombre del participante."
      );
      return;
    }

    try {
      setGuardandoParticipante(true);
      setErrorParticipante("");

      let idFinal = participantId;

      // -----------------------------------------------------
      // CREAR PARTICIPANTE
      // -----------------------------------------------------

      if (!idFinal) {
        const creado = await api.post(
          "/participants",
          {
            nombre,
          }
        );

        idFinal =
          creado?.participant_id ||
          creado?.id ||
          creado?.participant
            ?.participant_id ||
          "";

        if (!idFinal) {
          throw new Error(
            "El servidor no devolvió el ID del participante."
          );
        }
      }

      // -----------------------------------------------------
      // ASIGNAR A LA SESIÓN
      // -----------------------------------------------------

      await api.patch(
        `/sessions/${idSesion}`,
        {
          participant_id: idFinal,
        }
      );

      // -----------------------------------------------------
      // ACTUALIZAR NOMBRE
      // -----------------------------------------------------

      try {
        await api.patch(
          `/sessions/${idSesion}/name`,
          {
            nombre,
          }
        );
      } catch (errorNombreSesion) {
        console.warn(
          "No se pudo actualizar el nombre:",
          errorNombreSesion
        );
      }

      setParticipantId(idFinal);

      await refetchSesion();

      setAviso({
        mensaje: `Participante asignado correctamente. ID: ${idFinal}`,
        tipo: "ok",
      });
    } catch (error) {
      console.error(
        "Error guardando participante:",
        error
      );

      setErrorParticipante(
        error?.message ||
          "No se pudo guardar el participante."
      );
    } finally {
      setGuardandoParticipante(false);
    }
  };

  // =========================================================
  // RESULTADO IA
  // =========================================================

  const resultadoIA =
    interpretarResultadoIA(sesionData);

  /*
   * Protección adicional:
   *
   * Si resultadoIA.resultado llega como objeto,
   * extraemos bienestar para que React nunca
   * intente renderizar directamente el objeto.
   */

  const resultadoIASeguro =
    typeof resultadoIA?.resultado ===
      "object" &&
    resultadoIA?.resultado !== null
      ? resultadoIA.resultado.bienestar ||
        resultadoIA.resultado.prediccion ||
        "Sin resultado"
      : resultadoIA?.resultado ||
        "Sin resultado";

  // =========================================================
  // REPORTE
  // =========================================================

  const handleAccionReporte = () => {
    setAviso(null);

    // -------------------------------------------------------
    // NO EXISTE SOLICITUD
    // -------------------------------------------------------

    if (!solicitud) {
      setFormatoAConfirmar("pdf");
      return;
    }

    // -------------------------------------------------------
    // PENDING
    // -------------------------------------------------------

    if (
      estadoSolicitud === "PENDING"
    ) {
      setAviso({
        mensaje:
          "Tu solicitud de reporte sigue pendiente de aprobación por el administrador.",
        tipo: "pendiente",
      });

      return;
    }

    // -------------------------------------------------------
    // APPROVED
    // -------------------------------------------------------

    if (
      estadoSolicitud === "APPROVED"
    ) {
      setAviso({
        mensaje:
          "Tu solicitud fue aprobada. El reporte oficial se está generando; podrás descargarlo cuando esté listo.",
        tipo: "pendiente",
      });

      return;
    }

    // -------------------------------------------------------
    // COMPLETED
    // -------------------------------------------------------

    if (
      estadoSolicitud === "COMPLETED"
    ) {
      const idSolicitud =
        solicitud?.report_request_id ||
        solicitud?.request_id ||
        solicitud?.id;

      if (!idSolicitud) {
        setAviso({
          mensaje:
            "El reporte está completado, pero no se encontró un identificador válido para descargarlo.",
          tipo: "pendiente",
        });

        return;
      }

      pedirUrlDescarga.mutate(
        idSolicitud,
        {
          onSuccess: (data) => {
            const url =
              data?.download_url ||
              data?.url;

            if (!url) {
              setAviso({
                mensaje:
                  "El reporte fue generado, pero el servidor no devolvió un enlace de descarga válido.",
                tipo: "pendiente",
              });

              return;
            }

            window.open(
              url,
              "_blank",
              "noopener,noreferrer"
            );
          },

          onError: (error) => {
            setAviso({
              mensaje:
                error?.message ||
                "No se pudo obtener el enlace de descarga del reporte.",
              tipo: "pendiente",
            });
          },
        }
      );

      return;
    }

    // -------------------------------------------------------
    // REJECTED
    // -------------------------------------------------------

    if (
      estadoSolicitud === "REJECTED"
    ) {
      setAviso({
        mensaje:
          solicitud?.reason ||
          solicitud?.motivo_rechazo ||
          "La solicitud de reporte fue rechazada por el administrador.",
        tipo: "pendiente",
      });

      return;
    }

    // -------------------------------------------------------
    // DESCONOCIDO
    // -------------------------------------------------------

    setAviso({
      mensaje:
        `La solicitud tiene un estado no reconocido: ${
          solicitud?.status ||
          "sin estado"
        }.`,
      tipo: "pendiente",
    });
  };

  // =========================================================
  // CONFIRMAR SOLICITUD
  // =========================================================

  const confirmarSolicitudReporte =
    () => {
      if (!formatoAConfirmar) {
        return;
      }

      crearSolicitud.mutate(
        {
          sessionId: idSesion,
          motivo:
            formatoAConfirmar.toUpperCase(),
        },
        {
          onSuccess: () => {
            setFormatoAConfirmar(null);

            refetchSolicitudes();

            setAviso({
              mensaje:
                "Solicitud de reporte enviada al administrador exitosamente.",
              tipo: "ok",
            });
          },

          onError: (error) => {
            setFormatoAConfirmar(null);

            setAviso({
              mensaje:
                error?.message ||
                "Hubo un error al comunicarse con el servidor.",
              tipo: "pendiente",
            });
          },
        }
      );
    };

  // =========================================================
  // CARGANDO
  // =========================================================

  if (isLoading) {
    return (
      <div className="el-session-detail">
        <SkeletonRows
          rows={8}
          columns={2}
        />
      </div>
    );
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
          <Button
            variant="secondary"
            size="sm"
            icon={FiFileText}
            onClick={handleAccionReporte}
            disabled={
              crearSolicitud.isPending ||
              pedirUrlDescarga.isPending
            }
            title={etiquetaSolicitud}
          >
            {pedirUrlDescarga.isPending
              ? "Preparando descarga..."
              : etiquetaSolicitud}
          </Button>
        }
      />

      {/* ================================================== */}
      {/* GRID                                               */}
      {/* ================================================== */}

      <div className="el-session-detail-grid">

        {/* ================================================= */}
        {/* DATOS DEL ALUMNO                                  */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Datos del alumno y la sesión
          </h3>

          <div className="el-session-detail-facts">

            {/* NOMBRE */}

            <div className="el-session-detail-fact el-session-detail-fact-name">

              <div className="el-session-detail-fact-label-row">

                <span>
                  Nombre del alumno
                </span>

                {!editandoNombre && (
                  <button
                    type="button"
                    className="el-session-detail-edit-btn"
                    onClick={
                      abrirEdicionNombre
                    }
                    title="Editar nombre del alumno"
                    aria-label="Editar nombre del alumno"
                  >
                    <FiEdit2 />
                  </button>
                )}

              </div>

              {!editandoNombre ? (
                <span className="el-session-detail-fact-value">
                  {nombreAlumno}
                </span>
              ) : (
                <form
                  onSubmit={
                    guardarNombre
                  }
                  className="el-session-detail-edit-form"
                >

                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={
                      cambiarNuevoNombre
                    }
                    className="el-session-detail-edit-input"
                    placeholder="Nombre del alumno"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="el-session-detail-edit-confirm"
                    disabled={
                      actualizarNombre.isPending
                    }
                    aria-label="Guardar nombre"
                  >
                    <FiCheck />
                  </button>

                  <button
                    type="button"
                    className="el-session-detail-edit-cancel"
                    onClick={
                      cancelarEdicionNombre
                    }
                    aria-label="Cancelar edición"
                  >
                    <FiX />
                  </button>

                </form>
              )}

              {errorNombre && (
                <span className="el-session-detail-fact-error">
                  {errorNombre}
                </span>
              )}

            </div>

            <div className="el-session-detail-fact">
              <span>Curso</span>
              <span className="el-session-detail-fact-value">
                {cursoAlumno}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Edad</span>
              <span className="el-session-detail-fact-value">
                {edadAlumno}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>Género</span>
              <span className="el-session-detail-fact-value">
                {generoAlumno}
              </span>
            </div>

            <div className="el-session-detail-fact">
              <span>ID de sesión</span>
              <span className="el-session-detail-fact-value">
                {idSesion}
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

          </div>

        </section>

        {/* ================================================= */}
        {/* PARTICIPANTE                                     */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Participante
          </h3>

          <div className="el-session-detail-facts">

            {/* ID */}

            <div className="el-session-detail-fact">

              <div className="el-session-detail-fact-label-row">

                <FiUser />

                <span>
                  ID anonimizado
                </span>

              </div>

              <span className="el-session-detail-fact-value">
                {participantId ||
                  "Sin asignar"}
              </span>

            </div>

            {/* NOMBRE */}

            <div className="el-session-detail-fact">

              <span>
                Nombre
              </span>

              <span className="el-session-detail-fact-value">
                {nombreParticipante ||
                  "Sin asignar"}
              </span>

            </div>

            {/* BUSCADOR */}

            <div className="el-session-detail-fact el-session-detail-fact-name">

              <span>
                Buscar participante existente
              </span>

              <div
                style={{
                  position: "relative",
                  marginTop: "6px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >

                  <FiSearch />

                  <input
                    type="text"
                    value={
                      busquedaParticipante
                    }
                    onChange={(e) =>
                      setBusquedaParticipante(
                        e.target.value
                      )
                    }
                    placeholder="Escribe un nombre..."
                    className="el-session-detail-edit-input"
                    style={{
                      width: "100%",
                    }}
                  />

                </div>

                {buscandoParticipantes && (
                  <span className="el-session-detail-fact-error">
                    Buscando...
                  </span>
                )}

                {mostrarParticipantes &&
                  participantes.length >
                    0 && (

                    <div
                      style={{
                        marginTop: "8px",
                        border:
                          "1px solid var(--color-line)",
                        borderRadius:
                          "var(--radius-sm)",
                        overflow: "hidden",
                        background:
                          "var(--color-surface)",
                      }}
                    >

                      {participantes.map(
                        (participante) => {

                          const idP =
                            participante?.participant_id ||
                            participante?.id ||
                            "";

                          const nombreP =
                            participante?.nombre ||
                            participante?.name ||
                            participante?.nombre_completo ||
                            "Sin nombre";

                          return (
                            <button
                              key={idP}
                              type="button"
                              onClick={() =>
                                seleccionarParticipante(
                                  participante
                                )
                              }
                              style={{
                                width: "100%",
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                alignItems:
                                  "flex-start",
                                gap: "2px",
                                padding:
                                  "10px 12px",
                                border:
                                  "none",
                                borderBottom:
                                  "1px solid var(--color-line-soft)",
                                background:
                                  "transparent",
                                cursor:
                                  "pointer",
                                textAlign:
                                  "left",
                              }}
                            >

                              <strong>
                                {nombreP}
                              </strong>

                              <small>
                                ID: {idP}
                              </small>

                            </button>
                          );
                        }
                      )}

                    </div>
                  )}

              </div>

            </div>

            {/* NOMBRE NUEVO */}

            <div className="el-session-detail-fact el-session-detail-fact-name">

              <span>
                Nombre para nuevo participante
              </span>

              <input
                type="text"
                value={
                  nombreParticipante
                }
                onChange={(e) => {
                  setNombreParticipante(
                    e.target.value
                  );
                  setParticipantId("");
                  setErrorParticipante("");
                }}
                placeholder="Nombre completo"
                className="el-session-detail-edit-input"
                style={{
                  marginTop: "6px",
                }}
              />

            </div>

            {errorParticipante && (
              <div className="el-session-detail-fact-error">
                {errorParticipante}
              </div>
            )}

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >

              <Button
                variant="secondary"
                size="sm"
                icon={FiUser}
                onClick={
                  guardarParticipante
                }
                disabled={
                  guardandoParticipante
                }
              >
                {guardandoParticipante
                  ? "Guardando..."
                  : "Asignar participante"}
              </Button>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* RESULTADO IA                                     */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Resultado de IA
          </h3>

          <AiResultCard
            sesionData={sesionData}
          />

          <p className="el-session-detail-aviso">
            {AVISO_IA}
          </p>

        </section>

        {/* ================================================= */}
        {/* RESPUESTAS                                        */}
        {/* ================================================= */}

        <section className="el-session-detail-card">

          <h3 className="el-session-detail-card-title">
            Respuestas del alumno
          </h3>

          {respuestas.length > 0 ? (
            <div className="el-session-detail-answers">

              {respuestas.map(
                (resp, index) => (

                  <div
                    key={index}
                    className="el-session-detail-answer"
                  >

                    <div className="el-session-detail-answer-header">

                      <span
                        title={
                          resp.textoPregunta
                        }
                      >
                        {resp.textoPregunta ||
                          `Pregunta ${
                            index + 1
                          }`}
                      </span>

                      <Badge tone="neutral">
                        #{index + 1}
                      </Badge>

                    </div>

                    <div className="el-session-detail-answer-value">
                      {resp.respuestaLabel ||
                        "Sin respuesta"}
                    </div>

                    <div className="el-session-detail-answer-footer">

                      <span>
                        {resp.escena
                          ? `Escena: ${resp.escena}`
                          : "—"}
                      </span>

                      <span>
                        {resp.timestamp
                          ?.split(" ")[1] ||
                          ""}
                      </span>

                    </div>

                  </div>

                )
              )}

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
                      {evt.nombre}
                    </span>

                    <span className="el-session-detail-event-time">
                      {evt.timestamp}
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

      {/* ================================================== */}
      {/* AVISO                                              */}
      {/* ================================================== */}

      <Modal
        open={Boolean(aviso)}
        onClose={() => setAviso(null)}
        title="Aviso"
        footer={
          <Button
            onClick={() =>
              setAviso(null)
            }
          >
            Entendido
          </Button>
        }
      >

        <p className="el-session-detail-aviso">

          {aviso?.tipo ===
          "pendiente" ? (
            <FiClock
              aria-hidden="true"
            />
          ) : (
            <FiCheckCircle
              aria-hidden="true"
            />
          )}

          <span>
            {aviso?.mensaje}
          </span>

        </p>

      </Modal>

      {/* ================================================== */}
      {/* CONFIRMAR REPORTE                                  */}
      {/* ================================================== */}

      <ReportRequestDialog
        open={Boolean(
          formatoAConfirmar
        )}
        formato="PDF"
        loading={
          crearSolicitud.isPending
        }
        onConfirm={
          confirmarSolicitudReporte
        }
        onCancel={() =>
          setFormatoAConfirmar(null)
        }
      />

    </div>
  );
}