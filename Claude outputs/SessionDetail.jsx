import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  FiArrowLeft, FiEdit2, FiCheck, FiX, FiFileText, FiFile,
  FiClock, FiCheckCircle, FiSearch, FiUser, FiRefreshCw,
} from "react-icons/fi";

import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import Modal from "../../ui/Modal.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";

import { useSessionDetail, useUpdateStudentName } from "./useSessions.js";
import { interpretarResultadoIA, AVISO_IA } from "./predictionHelpers.js";
import AiResultCard from "./AiResultCard.jsx";
import { useCreateReportRequest, useMyReportRequests, useReportDownloadUrl } from "../reports/useReports.js";
import ReportRequestDialog from "../reports/ReportRequestDialog.jsx";
import { obtenerEtiquetaSolicitud, obtenerSolicitudRelevante } from "../reports/reportHelpers.js";
import { api } from "../../lib/apiClient.js";

import "./SessionDetail.css";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sesionData, isLoading, isError } = useSessionDetail(id);
  const { data: solicitudesData } = useMyReportRequests();
  const actualizarNombre = useUpdateStudentName(id);
  const crearSolicitud = useCreateReportRequest();
  const pedirUrlDescarga = useReportDownloadUrl();

  // ---- Edición / cambio de participante ----
  const [modoParticipante, setModoParticipante] = useState(false);
  const [busquedaParticipante, setBusquedaParticipante] = useState("");
  const [participantesEncontrados, setParticipantesEncontrados] = useState([]);
  const [buscandoParticipantes, setBuscandoParticipantes] = useState(false);
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null);
  const [errorParticipante, setErrorParticipante] = useState("");
  const [guardandoParticipante, setGuardandoParticipante] = useState(false);
  const [creandoParticipante, setCreandoParticipante] = useState(false);

  // ---- Edición de nombre legacy ----
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");

  // ---- Avisos / reportes ----
  const [aviso, setAviso] = useState(null);
  const [formatoAConfirmar, setFormatoAConfirmar] = useState(null);

  // ---- Datos de la sesión ----
  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};
  const respuestas = Array.isArray(sessionData?.respuestas) ? sessionData.respuestas : [];
  const eventos = Array.isArray(sessionData?.eventos) ? sessionData.eventos : [];

  const nombreAlumno = sesionData?.nombre || sessionData?.nombre || sessionData?.student_name || "Sin especificar";
  const edadValor = sesionData?.edad || sessionData?.edad || sessionData?.age;
  const edadAlumno = edadValor ? `${edadValor} años` : "Sin registrar";
  const cursoAlumno = sesionData?.curso || sessionData?.curso || sessionData?.course || sessionData?.grade || "No asignado";
  const generoAlumno = sesionData?.genero || sessionData?.genero || sessionData?.gender || "Sin registrar";
  const idSesion = sesionData?.session_id || id;
  const idParticipante = sesionData?.participant_id || sessionData?.participant_id || "__PENDING__";
  const dificultad = sesionData?.difficulty || sessionData?.difficulty_level || "No registrado";
  const inicioSesion = sessionData?.fechaInicio || `${sesionData?.fecha || ""} ${sesionData?.hora || ""}`.trim() || "Sin registro";
  const finSesion = sessionData?.fechaFin || "En curso / Sin registro";
  const sesionPendiente =
    idParticipante === "__PENDING__" ||
    sesionData?.status === "pendiente_identificacion" ||
    sesionData?.estado === "pendiente_identificacion";

  // ---- Participante actual ----
  const participanteActual = useMemo(() => {
    if (sesionPendiente) return null;
    return { participant_id: idParticipante, nombre: nombreAlumno };
  }, [sesionPendiente, idParticipante, nombreAlumno]);

  // ---- Reportes ----
  const solicitudes = solicitudesData?.items || [];
  const deEstaSesion = solicitudes.filter((s) => String(s.session_id) === String(idSesion));
  const solicitudPdf = obtenerSolicitudRelevante(deEstaSesion, "PDF");
  const solicitudExcel = obtenerSolicitudRelevante(deEstaSesion, "EXCEL");

  const abrirCambioParticipante = () => {
    setModoParticipante(true);
    setBusquedaParticipante("");
    setParticipantesEncontrados([]);
    setParticipanteSeleccionado(null);
    setErrorParticipante("");
  };

  const cancelarCambioParticipante = () => {
    if (sesionPendiente) return;
    setModoParticipante(false);
    setBusquedaParticipante("");
    setParticipantesEncontrados([]);
    setParticipanteSeleccionado(null);
    setErrorParticipante("");
  };

  // ---- Búsqueda de participantes ----
  useEffect(() => {
    if (!modoParticipante) return;

    const query = busquedaParticipante.trim();
    if (!query) {
      setParticipantesEncontrados([]);
      setBuscandoParticipantes(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setBuscandoParticipantes(true);
        setErrorParticipante("");

        const data = await api.get(`/participants/search?name=${encodeURIComponent(query)}`);
        const resultados = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.participants)
              ? data.participants
              : [];

        setParticipantesEncontrados(resultados);
      } catch (error) {
        console.error("Error buscando participantes:", error);
        setParticipantesEncontrados([]);
        setErrorParticipante(error?.message || "No se pudieron buscar los participantes.");
      } finally {
        setBuscandoParticipantes(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [busquedaParticipante, modoParticipante]);

  const seleccionarParticipante = (participante) => {
    setParticipanteSeleccionado(participante);
    setBusquedaParticipante(participante?.nombre || "");
    setParticipantesEncontrados([]);
    setErrorParticipante("");
  };

  const registrarNuevoParticipante = async () => {
    const nombre = busquedaParticipante.trim();
    if (!nombre) {
      setErrorParticipante("Ingresa el nombre completo del alumno.");
      return;
    }

    try {
      setCreandoParticipante(true);
      setErrorParticipante("");

      const data = await api.post("/participants", { nombre });
      const participante = data?.participant || data;

      if (!participante?.participant_id) {
        throw new Error("El servidor no devolvió el ID del participante.");
      }

      setParticipanteSeleccionado(participante);
      setBusquedaParticipante(participante.nombre || nombre);
      setParticipantesEncontrados([]);
    } catch (error) {
      console.error("Error registrando participante:", error);
      setErrorParticipante(error?.message || "No se pudo registrar el nuevo participante.");
    } finally {
      setCreandoParticipante(false);
    }
  };

  const guardarParticipante = async () => {
    if (!participanteSeleccionado?.participant_id) {
      setErrorParticipante("Selecciona un participante de la lista o registra uno nuevo.");
      return;
    }

    try {
      setGuardandoParticipante(true);
      setErrorParticipante("");

      await api.patch(`/sessions/${encodeURIComponent(idSesion)}`, {
        participant_id: participanteSeleccionado.participant_id,
      });

      setAviso({
        mensaje: `La sesión fue identificada correctamente como ${participanteSeleccionado.nombre}.`,
        tipo: "ok",
      });

      setModoParticipante(false);
      setParticipantesEncontrados([]);
      setParticipanteSeleccionado(null);
      setBusquedaParticipante("");

      // Recargar para obtener los datos definitivos.
      window.location.reload();
    } catch (error) {
      console.error("Error identificando participante:", error);
      setErrorParticipante(error?.message || "No se pudo identificar el participante.");
    } finally {
      setGuardandoParticipante(false);
    }
  };

  // ---- Edición simple del nombre ----
  const abrirEdicionNombre = () => {
    setNuevoNombre(nombreAlumno !== "Sin especificar" ? nombreAlumno : "");
    setErrorNombre("");
    setEditandoNombre(true);
  };

  const cancelarEdicionNombre = () => {
    setEditandoNombre(false);
    setErrorNombre("");
  };

  const cambiarNuevoNombre = (e) => {
    const val = e.target.value;

    if (val.length > 150) {
      setErrorNombre("El nombre no puede superar los 150 caracteres.");
      return;
    }

    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) {
      setErrorNombre("No se permiten caracteres especiales.");
      return;
    }

    setErrorNombre("");
    setNuevoNombre(val);
  };

  const guardarNombre = (e) => {
    e.preventDefault();

    if (!nuevoNombre.trim()) {
      setErrorNombre("El nombre no puede estar vacío.");
      return;
    }

    actualizarNombre.mutate(nuevoNombre.trim(), {
      onSuccess: () => setEditandoNombre(false),
      onError: (error) => setErrorNombre(error?.message || "No se pudo actualizar el nombre del alumno."),
    });
  };

  const resultadoIA = interpretarResultadoIA(sesionData);

  // ---- Reportes ----
  const handleAccionReporte = (tipo) => {
    const solicitud = tipo === "pdf" ? solicitudPdf : solicitudExcel;
    const estado = solicitud ? String(solicitud.status || "").toUpperCase() : null;

    if (!solicitud || estado === "REJECTED") {
      setFormatoAConfirmar(tipo);
      return;
    }

    if (estado === "PENDING") {
      setAviso({
        mensaje: `Tu solicitud de ${tipo.toUpperCase()} sigue pendiente de aprobación por el administrador.`,
        tipo: "pendiente",
      });
      return;
    }

    if (estado === "APPROVED") {
      setAviso({
        mensaje: `Tu solicitud de ${tipo.toUpperCase()} fue aprobada. El reporte oficial se está generando; podrás descargarlo aquí cuando esté listo.`,
        tipo: "pendiente",
      });
      return;
    }

    if (estado === "COMPLETED") {
      const idSolicitud = solicitud.request_id || solicitud.id;

      pedirUrlDescarga.mutate(idSolicitud, {
        onSuccess: (data) => {
          const url = data?.download_url;
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            setAviso({
              mensaje: `El reporte de ${tipo.toUpperCase()} fue generado, pero el servidor no devolvió un enlace de descarga válido.`,
              tipo: "pendiente",
            });
          }
        },
        onError: (error) => {
          setAviso({
            mensaje: error?.message || `No se pudo obtener el enlace de descarga del reporte de ${tipo.toUpperCase()}.`,
            tipo: "pendiente",
          });
        },
      });

      return;
    }

    setAviso({ mensaje: "No se pudo determinar el estado de la solicitud de reporte.", tipo: "pendiente" });
  };

  const confirmarSolicitudReporte = () => {
    const tipo = formatoAConfirmar;
    if (!tipo) return;

    crearSolicitud.mutate(
      { sessionId: idSesion, motivo: tipo.toUpperCase() },
      {
        onSuccess: () => {
          setFormatoAConfirmar(null);
          setAviso({ mensaje: `Solicitud de ${tipo.toUpperCase()} enviada al administrador exitosamente.`, tipo: "ok" });
        },
        onError: (error) => {
          setFormatoAConfirmar(null);
          setAviso({ mensaje: error?.message || "Hubo un error al comunicarse con el servidor.", tipo: "pendiente" });
        },
      },
    );
  };

  // ---- Exportar PDF ----
  const generarPDF = () => {
    try {
      if (!sesionData) return;

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(23, 49, 94);
      doc.text("Informe Detallado de Sesión", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`ID de Sesión: ${idSesion} | Fecha de Informe: ${new Date().toLocaleDateString("es-CL")}`, 14, 27);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("1. Datos del Alumno y Sesión", 14, 36);

      autoTable(doc, {
        startY: 40,
        theme: "grid",
        headStyles: { fillColor: [23, 49, 94] },
        head: [["Campo", "Valor"]],
        body: [
          ["Nombre del Alumno", nombreAlumno],
          ["Curso", cursoAlumno],
          ["Edad", edadAlumno],
          ["Género", generoAlumno],
          ["ID Participante", idParticipante],
          ["Nivel de Dificultad", dificultad],
          ["Inicio de Sesión", inicioSesion],
          ["Fin de Sesión", finSesion],
        ],
      });

      let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100;

      doc.setFontSize(12);
      doc.text("2. Resultado de IA (indicador de apoyo, no diagnóstico)", 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        head: [["Métrica / Evaluación", "Resultado"]],
        body: [
          ["Estado de Bienestar", resultadoIA.resultado],
          ["Confianza del Modelo", resultadoIA.confianza],
          ["Observaciones", resultadoIA.observaciones],
          ["Aviso de Responsabilidad", AVISO_IA],
        ],
      });

      nextY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text("3. Respuestas del Alumno", 14, nextY);

      const filasRespuestas = respuestas.map((r, index) => [
        `#${index + 1}`,
        r.textoPregunta || "—",
        r.respuestaLabel || "—",
        r.escena || "—",
        r.timestamp?.split(" ")[1] || "—",
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        theme: "striped",
        headStyles: { fillColor: [23, 49, 94] },
        head: [["#", "Pregunta", "Respuesta", "Escena", "Hora"]],
        body: filasRespuestas.length > 0 ? filasRespuestas : [["—", "Sin respuestas registradas", "—", "—", "—"]],
      });

      nextY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text("4. Eventos de la Sesión", 14, nextY);

      const filasEventos = eventos.map((e) => [e.fase || "—", e.nombre || "—", e.timestamp || "—"]);

      autoTable(doc, {
        startY: nextY + 4,
        theme: "striped",
        headStyles: { fillColor: [23, 49, 94] },
        head: [["Fase", "Nombre del Evento", "Timestamp"]],
        body: filasEventos.length > 0 ? filasEventos : [["—", "Sin eventos registrados", "—"]],
      });

      doc.save(`Sesion_${idSesion}.pdf`);
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      setAviso({ mensaje: "Ocurrió un error al generar el archivo PDF.", tipo: "pendiente" });
    }
  };

  // ---- Exportar Excel ----
  const generarExcel = () => {
    try {
      if (!sesionData) return;

      const resumenData = [
        { Campo: "ID Sesión", Valor: idSesion },
        { Campo: "ID Participante", Valor: idParticipante },
        { Campo: "Nombre Alumno", Valor: nombreAlumno },
        { Campo: "Curso", Valor: cursoAlumno },
        { Campo: "Edad", Valor: edadAlumno },
        { Campo: "Género", Valor: generoAlumno },
        { Campo: "Dificultad", Valor: dificultad },
        { Campo: "Inicio Sesión", Valor: inicioSesion },
        { Campo: "Fin Sesión", Valor: finSesion },
      ];

      const prediccionData = [
        { Métrica: "Estado de Bienestar", Valor: resultadoIA.resultado },
        { Métrica: "Confianza del Modelo", Valor: resultadoIA.confianza },
        { Métrica: "Observaciones Modelo", Valor: resultadoIA.observaciones },
        { Métrica: "Aviso de Responsabilidad", Valor: AVISO_IA },
      ];

      const respuestasData = respuestas.map((r, index) => ({
        "N°": index + 1,
        Pregunta: r.textoPregunta,
        Respuesta: r.respuestaLabel,
        Escena: r.escena,
        Timestamp: r.timestamp,
      }));

      const eventosData = eventos.map((e) => ({ Fase: e.fase, Evento: e.nombre, Timestamp: e.timestamp }));

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenData), "Resumen");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prediccionData), "Bienestar IA");
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(respuestasData.length > 0 ? respuestasData : [{ Info: "Sin respuestas" }]),
        "Respuestas",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(eventosData.length > 0 ? eventosData : [{ Info: "Sin eventos" }]),
        "Eventos",
      );

      XLSX.writeFile(wb, `Sesion_${idSesion}.xlsx`);
    } catch (err) {
      console.error("Error al generar el Excel:", err);
      setAviso({ mensaje: "Ocurrió un error al generar el Excel.", tipo: "pendiente" });
    }
  };

  if (isLoading) {
    return (
      <div className="el-session-detail">
        <SkeletonRows rows={8} columns={2} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="el-session-detail">
        <EmptyState
          title="No se pudo cargar la sesión"
          description="No se pudo cargar la información de la sesión."
          action={
            <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate(-1)}>
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="el-session-detail">
      {/* Cabecera */}
      <div className="el-session-detail-topbar">
        <button type="button" className="el-session-detail-back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          Volver a sesiones
        </button>
      </div>

      <PageHeader
        title="Detalle de la sesión"
        actions={
          <div className="el-session-detail-report-actions">
            <Button
              variant="secondary"
              size="sm"
              icon={FiFile}
              onClick={() => handleAccionReporte("pdf")}
              disabled={crearSolicitud.isPending || pedirUrlDescarga.isPending}
            >
              {obtenerEtiquetaSolicitud(solicitudPdf)} PDF
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={FiFileText}
              onClick={() => handleAccionReporte("excel")}
              disabled={crearSolicitud.isPending || pedirUrlDescarga.isPending}
            >
              {obtenerEtiquetaSolicitud(solicitudExcel)} Excel
            </Button>
          </div>
        }
      />

      {/* Información de exportación */}
      <div className="el-session-detail-export-bar">
        <div>
          <strong>Exportación local</strong>
          <span>No reemplaza el reporte oficial aprobado por el administrador.</span>
        </div>

        <div className="el-session-detail-local-export">
          <Button variant="ghost" size="sm" icon={FiFile} onClick={generarPDF}>
            PDF local
          </Button>
          <Button variant="ghost" size="sm" icon={FiFileText} onClick={generarExcel}>
            Excel local
          </Button>
        </div>
      </div>

      {/* Grid principal */}
      <div className="el-session-detail-grid">
        {/* Datos del alumno */}
        <section className="el-session-detail-card el-session-detail-card-main">
          <div className="el-session-detail-card-header">
            <div>
              <span className="el-session-detail-eyebrow">INFORMACIÓN</span>
              <h2 className="el-session-detail-card-title">Datos del alumno</h2>
            </div>

            <div className="el-session-detail-status">
              {sesionPendiente ? (
                <Badge tone="warning">Pendiente de identificación</Badge>
              ) : (
                <Badge tone="success">Identificada</Badge>
              )}
            </div>
          </div>

          {/* Participante */}
          <div className="el-session-detail-participant-section">
            <div className="el-session-detail-section-label">
              <FiUser />
              <span>Participante</span>
            </div>

            {modoParticipante ? (
              <div className="el-session-detail-participant-editor">
                <div className="el-session-detail-participant-input-wrap">
                  <FiSearch aria-hidden="true" />
                  <input
                    type="text"
                    value={busquedaParticipante}
                    onChange={(e) => {
                      setBusquedaParticipante(e.target.value);
                      setParticipanteSeleccionado(null);
                      setErrorParticipante("");
                    }}
                    className="el-session-detail-participant-input"
                    placeholder="Escribe el nombre del alumno..."
                    autoComplete="off"
                    autoFocus
                  />
                  {buscandoParticipantes && <span className="el-session-detail-search-status">Buscando...</span>}
                </div>

                {participantesEncontrados.length > 0 && (
                  <div className="el-session-detail-participant-results">
                    <div className="el-session-detail-results-title">Participantes registrados</div>

                    {participantesEncontrados.map((participante) => (
                      <button
                        key={participante.participant_id}
                        type="button"
                        className="el-session-detail-participant-result"
                        onClick={() => seleccionarParticipante(participante)}
                      >
                        <div className="el-session-detail-result-avatar">
                          <FiUser />
                        </div>
                        <div className="el-session-detail-result-content">
                          <strong>{participante.nombre}</strong>
                          <span>ID: {participante.participant_id}</span>
                        </div>
                        <FiCheck className="el-session-detail-result-check" />
                      </button>
                    ))}
                  </div>
                )}

                {busquedaParticipante.trim() &&
                  !buscandoParticipantes &&
                  participantesEncontrados.length === 0 &&
                  !participanteSeleccionado && (
                    <div className="el-session-detail-no-participant">
                      <div>
                        <strong>No encontramos ese participante</strong>
                        <span>Puedes registrarlo como un nuevo participante.</span>
                      </div>
                      <button
                        type="button"
                        className="el-session-detail-create-participant"
                        onClick={registrarNuevoParticipante}
                        disabled={creandoParticipante}
                      >
                        {creandoParticipante ? "Registrando..." : "+ Registrar nuevo participante"}
                      </button>
                    </div>
                  )}

                {participanteSeleccionado && (
                  <div className="el-session-detail-participant-selected">
                    <div className="el-session-detail-selected-icon">
                      <FiUser />
                    </div>
                    <div className="el-session-detail-selected-info">
                      <strong>{participanteSeleccionado.nombre}</strong>
                      <span>ID: {participanteSeleccionado.participant_id}</span>
                    </div>
                    <button
                      type="button"
                      className="el-session-detail-participant-clear"
                      onClick={() => {
                        setParticipanteSeleccionado(null);
                        setBusquedaParticipante("");
                        setErrorParticipante("");
                      }}
                      aria-label="Cambiar selección"
                      title="Cambiar selección"
                    >
                      <FiX />
                    </button>
                  </div>
                )}

                {errorParticipante && <div className="el-session-detail-inline-error">{errorParticipante}</div>}

                <div className="el-session-detail-editor-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={FiCheck}
                    onClick={guardarParticipante}
                    disabled={!participanteSeleccionado || guardandoParticipante}
                  >
                    {guardandoParticipante ? "Guardando..." : "Identificar alumno"}
                  </Button>

                  {!sesionPendiente && (
                    <Button variant="ghost" size="sm" icon={FiX} onClick={cancelarCambioParticipante}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="el-session-detail-participant-display">
                <div className="el-session-detail-participant-avatar">
                  <FiUser />
                </div>
                <div className="el-session-detail-participant-info">
                  <strong>{nombreAlumno}</strong>
                  <span>ID: {idParticipante === "__PENDING__" ? "Pendiente de identificación" : idParticipante}</span>
                </div>
                <button type="button" className="el-session-detail-change-btn" onClick={abrirCambioParticipante}>
                  <FiEdit2 />
                  {sesionPendiente ? "Identificar" : "Cambiar"}
                </button>
              </div>
            )}
          </div>

          <div className="el-session-detail-divider" />

          {/* Datos */}
          <div className="el-session-detail-facts">
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Curso</span>
              <strong>{cursoAlumno}</strong>
            </div>
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Edad</span>
              <strong>{edadAlumno}</strong>
            </div>
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Género</span>
              <strong>{generoAlumno}</strong>
            </div>
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Dificultad</span>
              <strong>{dificultad}</strong>
            </div>
            <div className="el-session-detail-fact el-session-detail-fact-wide">
              <span className="el-session-detail-fact-label">ID de sesión</span>
              <strong className="el-session-detail-mono">{idSesion}</strong>
            </div>
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Inicio</span>
              <strong>{inicioSesion}</strong>
            </div>
            <div className="el-session-detail-fact">
              <span className="el-session-detail-fact-label">Fin</span>
              <strong>{finSesion}</strong>
            </div>
          </div>
        </section>

        {/* Resultado IA */}
        <section className="el-session-detail-card">
          <div className="el-session-detail-card-header">
            <div>
              <span className="el-session-detail-eyebrow">ANÁLISIS</span>
              <h2 className="el-session-detail-card-title">Resultado de IA</h2>
            </div>
            <Badge tone="neutral">Modelo</Badge>
          </div>

          <AiResultCard sesionData={sesionData} />
        </section>

        {/* Respuestas */}
        <section className="el-session-detail-card el-session-detail-card-full">
          <div className="el-session-detail-card-header">
            <div>
              <span className="el-session-detail-eyebrow">REGISTRO</span>
              <h2 className="el-session-detail-card-title">Respuestas del alumno</h2>
            </div>
            <Badge tone="neutral">
              {respuestas.length} {respuestas.length === 1 ? "respuesta" : "respuestas"}
            </Badge>
          </div>

          {respuestas.length > 0 ? (
            <div className="el-session-detail-answers">
              {respuestas.map((resp, index) => (
                <div key={index} className="el-session-detail-answer">
                  <div className="el-session-detail-answer-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="el-session-detail-answer-content">
                    <div className="el-session-detail-answer-header">
                      <span>{resp.textoPregunta || `Pregunta ${index + 1}`}</span>
                    </div>
                    <div className="el-session-detail-answer-value">{resp.respuestaLabel || "Sin respuesta"}</div>
                    <div className="el-session-detail-answer-footer">
                      <span>{resp.escena ? `Escena: ${resp.escena}` : "Sin escena"}</span>
                      <span>{resp.timestamp || "Sin timestamp"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin respuestas registradas" description="Esta sesión todavía no contiene respuestas del alumno." />
          )}
        </section>

        {/* Eventos */}
        <section className="el-session-detail-card el-session-detail-card-full">
          <div className="el-session-detail-card-header">
            <div>
              <span className="el-session-detail-eyebrow">TRAZABILIDAD</span>
              <h2 className="el-session-detail-card-title">Eventos de la sesión</h2>
            </div>
            <Badge tone="neutral">
              {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
            </Badge>
          </div>

          {eventos.length > 0 ? (
            <div className="el-session-detail-events">
              {eventos.map((evt, index) => (
                <div key={index} className="el-session-detail-event">
                  <div className="el-session-detail-event-dot">
                    <FiCheckCircle />
                  </div>
                  <div className="el-session-detail-event-main">
                    <strong>{evt.nombre || "Evento sin nombre"}</strong>
                    <span>{evt.fase || "Sin fase"}</span>
                  </div>
                  <time>{evt.timestamp || "Sin timestamp"}</time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin eventos registrados" description="No hay eventos asociados a esta sesión." />
          )}
        </section>
      </div>

      {/* Aviso */}
      <Modal
        open={Boolean(aviso)}
        onClose={() => setAviso(null)}
        title="Aviso"
        footer={<Button onClick={() => setAviso(null)}>Entendido</Button>}
      >
        <p className="el-session-detail-aviso">
          {aviso?.tipo === "pendiente" ? <FiClock /> : <FiCheckCircle />}
          <span>{aviso?.mensaje}</span>
        </p>
      </Modal>

      {/* Solicitud de reporte */}
      <ReportRequestDialog
        open={Boolean(formatoAConfirmar)}
        formato={formatoAConfirmar === "pdf" ? "PDF" : "Excel"}
        loading={crearSolicitud.isPending}
        onConfirm={confirmarSolicitudReporte}
        onCancel={() => setFormatoAConfirmar(null)}
      />
    </div>
  );
}
