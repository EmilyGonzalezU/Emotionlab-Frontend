import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FiArrowLeft,
  FiEdit2,
  FiCheck,
  FiX,
  FiFileText,
  FiFile,
  FiClock,
  FiCheckCircle,
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
import {
  useCreateReportRequest,
  useMyReportRequests,
  useReportDownloadUrl,
} from "../reports/useReports.js";
import ReportRequestDialog from "../reports/ReportRequestDialog.jsx";
import { obtenerEtiquetaSolicitud, obtenerSolicitudRelevante } from "../reports/reportHelpers.js";
import "./SessionDetail.css";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sesionData, isLoading, isError } = useSessionDetail(id);
  const { data: solicitudesData } = useMyReportRequests();
  const actualizarNombre = useUpdateStudentName(id);
  const crearSolicitud = useCreateReportRequest();
  const pedirUrlDescarga = useReportDownloadUrl();

  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [aviso, setAviso] = useState(null); // { mensaje, tipo: "ok" | "pendiente" }
  const [formatoAConfirmar, setFormatoAConfirmar] = useState(null); // "pdf" | "excel" | null

  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};
  const respuestas = sessionData?.respuestas || [];
  const eventos = sessionData?.eventos || [];

  const nombreAlumno =
    sesionData?.nombre || sessionData?.nombre || sessionData?.student_name || "Sin especificar";
  const edadAlumno =
    sesionData?.edad || sessionData?.edad || sessionData?.age
      ? `${sesionData?.edad || sessionData?.edad || sessionData?.age} años`
      : "Sin registrar";
  const cursoAlumno =
    sesionData?.curso || sessionData?.curso || sessionData?.course || sessionData?.grade || "No asignado";
  const generoAlumno = sesionData?.genero || sessionData?.genero || sessionData?.gender || "Sin registrar";
  const idSesion = sesionData?.session_id || id;
  const idParticipante = sessionData?.idParticipante || "Sin ID";
  const dificultad = sesionData?.difficulty || sessionData?.difficulty_level || "No registrado";
  const inicioSesion =
    sessionData?.fechaInicio ||
    `${sesionData?.fecha || ""} ${sesionData?.hora || ""}`.trim() ||
    "Sin registro";
  const finSesion = sessionData?.fechaFin || "En curso / Sin registro";

  const solicitudes = solicitudesData?.items || [];
  const deEstaSesion = solicitudes.filter((s) => String(s.session_id) === String(idSesion));
  const solicitudPdf = obtenerSolicitudRelevante(deEstaSesion, "PDF");
  const solicitudExcel = obtenerSolicitudRelevante(deEstaSesion, "EXCEL");

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
    if (val.length > 25) {
      setErrorNombre("El nombre no puede superar los 25 caracteres.");
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

  // Estado real de la solicitud -> acción del botón. Nunca dispara la
  // generación local (jsPDF/xlsx) como sustituto del reporte oficial:
  // APPROVED ya no habilita ninguna descarga (antes sí lo hacía, ver
  // auditoría de Fase 4) y COMPLETED solo descarga si además existe
  // una URL de descarga real en la solicitud.
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
      // La URL de descarga no viene en la solicitud: se pide una nueva
      // cada vez (GET /report-requests/:id/download), válida solo 300
      // segundos. Nunca se guarda ni se reutiliza una URL vieja.
      const idSolicitud = solicitud.request_id || solicitud.id;
      pedirUrlDescarga.mutate(idSolicitud, {
        onSuccess: (data) => {
          const url = data?.download_url;
          if (url) {
            // URL prefirmada de S3: nunca se adjunta un header Authorization.
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            setAviso({
              mensaje: `El reporte de ${tipo.toUpperCase()} fue generado, pero el servidor no devolvió un enlace de descarga válido. Contacta al administrador.`,
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

    setAviso({
      mensaje: "No se pudo determinar el estado de la solicitud de reporte.",
      tipo: "pendiente",
    });
  };

  const confirmarSolicitudReporte = () => {
    const tipo = formatoAConfirmar;
    if (!tipo) return;

    crearSolicitud.mutate(
      { sessionId: idSesion, motivo: tipo.toUpperCase() },
      {
        onSuccess: () => {
          setFormatoAConfirmar(null);
          setAviso({
            mensaje: `Solicitud de ${tipo.toUpperCase()} enviada al administrador exitosamente.`,
            tipo: "ok",
          });
        },
        onError: (error) => {
          setFormatoAConfirmar(null);
          setAviso({
            mensaje: error?.message || "Hubo un error al comunicarse con el servidor.",
            tipo: "pendiente",
          });
        },
      },
    );
  };

  const generarPDF = () => {
    try {
      if (!sesionData) return;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(23, 49, 94);
      doc.text("Informe Detallado de Sesión", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `ID de Sesión: ${idSesion} | Fecha de Informe: ${new Date().toLocaleDateString("es-CL")}`,
        14,
        27,
      );

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

      const eventosData = eventos.map((e) => ({
        Fase: e.fase,
        Evento: e.nombre,
        Timestamp: e.timestamp,
      }));

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
      <button type="button" className="el-session-detail-back" onClick={() => navigate(-1)}>
        <FiArrowLeft aria-hidden="true" /> Volver
      </button>

      <PageHeader
        title="Detalle de la sesión"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={FiFile}
              onClick={() => handleAccionReporte("pdf")}
              disabled={crearSolicitud.isPending || pedirUrlDescarga.isPending}
              title={`${obtenerEtiquetaSolicitud(solicitudPdf)} (PDF)`}
            >
              {obtenerEtiquetaSolicitud(solicitudPdf)} (PDF)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FiFileText}
              onClick={() => handleAccionReporte("excel")}
              disabled={crearSolicitud.isPending || pedirUrlDescarga.isPending}
              title={`${obtenerEtiquetaSolicitud(solicitudExcel)} (Excel)`}
            >
              {obtenerEtiquetaSolicitud(solicitudExcel)} (Excel)
            </Button>
          </>
        }
      />

      <p className="el-session-detail-local-export-label">
        Exportación local (no reemplaza el reporte oficial aprobado por el administrador):
      </p>
      <div className="el-session-detail-local-export">
        <Button variant="ghost" size="sm" icon={FiFile} onClick={generarPDF}>
          Exportar copia local en PDF
        </Button>
        <Button variant="ghost" size="sm" icon={FiFileText} onClick={generarExcel}>
          Exportar copia local en Excel
        </Button>
      </div>

      <div className="el-session-detail-grid">
        <section className="el-session-detail-card">
          <h3 className="el-session-detail-card-title">Datos del alumno y la sesión</h3>
          <div className="el-session-detail-facts">
            <div className="el-session-detail-fact el-session-detail-fact-name">
              <div className="el-session-detail-fact-label-row">
                <span>Nombre del alumno</span>
                {!editandoNombre && (
                  <button
                    type="button"
                    className="el-session-detail-edit-btn"
                    onClick={abrirEdicionNombre}
                    title="Editar nombre del alumno"
                    aria-label="Editar nombre del alumno"
                  >
                    <FiEdit2 />
                  </button>
                )}
              </div>

              {!editandoNombre ? (
                <span className="el-session-detail-fact-value">{nombreAlumno}</span>
              ) : (
                <form onSubmit={guardarNombre} className="el-session-detail-edit-form">
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={cambiarNuevoNombre}
                    className="el-session-detail-edit-input"
                    placeholder="Nombre del alumno"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="el-session-detail-edit-confirm"
                    disabled={actualizarNombre.isPending}
                    aria-label="Guardar nombre"
                  >
                    <FiCheck />
                  </button>
                  <button
                    type="button"
                    className="el-session-detail-edit-cancel"
                    onClick={cancelarEdicionNombre}
                    aria-label="Cancelar edición"
                  >
                    <FiX />
                  </button>
                </form>
              )}

              {errorNombre && <span className="el-session-detail-fact-error">{errorNombre}</span>}
            </div>

            <div className="el-session-detail-fact">
              <span>Curso</span>
              <span className="el-session-detail-fact-value">{cursoAlumno}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>Edad</span>
              <span className="el-session-detail-fact-value">{edadAlumno}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>Género</span>
              <span className="el-session-detail-fact-value">{generoAlumno}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>ID de sesión</span>
              <span className="el-session-detail-fact-value">{idSesion}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>ID participante</span>
              <span className="el-session-detail-fact-value">{idParticipante}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>Nivel de dificultad</span>
              <span className="el-session-detail-fact-value">{dificultad}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>Inicio de sesión</span>
              <span className="el-session-detail-fact-value">{inicioSesion}</span>
            </div>
            <div className="el-session-detail-fact">
              <span>Fin de sesión</span>
              <span className="el-session-detail-fact-value">{finSesion}</span>
            </div>
          </div>
        </section>

        <section className="el-session-detail-card">
          <h3 className="el-session-detail-card-title">Resultado de IA</h3>
          <AiResultCard sesionData={sesionData} />
        </section>

        <section className="el-session-detail-card">
          <h3 className="el-session-detail-card-title">Respuestas del alumno</h3>
          {respuestas.length > 0 ? (
            <div className="el-session-detail-answers">
              {respuestas.map((resp, index) => (
                <div key={index} className="el-session-detail-answer">
                  <div className="el-session-detail-answer-header">
                    <span title={resp.textoPregunta}>{resp.textoPregunta || `Pregunta ${index + 1}`}</span>
                    <Badge tone="neutral">#{index + 1}</Badge>
                  </div>
                  <div className="el-session-detail-answer-value">{resp.respuestaLabel || "Sin respuesta"}</div>
                  <div className="el-session-detail-answer-footer">
                    <span>{resp.escena ? `Escena: ${resp.escena}` : "—"}</span>
                    <span>{resp.timestamp?.split(" ")[1] || ""}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin respuestas registradas" />
          )}
        </section>

        <section className="el-session-detail-card">
          <h3 className="el-session-detail-card-title">Eventos de la sesión</h3>
          {eventos.length > 0 ? (
            <div className="el-session-detail-events">
              {eventos.map((evt, index) => (
                <div key={index} className="el-session-detail-event">
                  <Badge tone="neutral">{evt.fase || "—"}</Badge>
                  <span className="el-session-detail-event-name">{evt.nombre}</span>
                  <span className="el-session-detail-event-time">{evt.timestamp}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin eventos registrados" />
          )}
        </section>
      </div>

      <Modal
        open={Boolean(aviso)}
        onClose={() => setAviso(null)}
        title="Aviso"
        footer={<Button onClick={() => setAviso(null)}>Entendido</Button>}
      >
        <p className="el-session-detail-aviso">
          {aviso?.tipo === "pendiente" ? <FiClock aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}
          <span>{aviso?.mensaje}</span>
        </p>
      </Modal>

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
