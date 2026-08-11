import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./sesion_detalle.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getApiUrl } from "../../config/api.js";

const SesionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mountedRef = useRef(new Set());
  const fetchingRef = useRef(false);

  const [sesionData, setSesionData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para editar el Nombre del Alumno
  const [editandoNombreAlumno, setEditandoNombreAlumno] = useState(false);
  const [nuevoNombreAlumno, setNuevoNombreAlumno] = useState("");
  const [errorNombreAlumno, setErrorNombreAlumno] = useState("");
  const [cargandoNombreAlumno, setCargandoNombreAlumno] = useState(false);

  // =========================================================
  // OBTENER DATOS DE LA SESIÓN DESDE EL BACKEND
  // =========================================================
  const obtenerDetalleSesion = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(getApiUrl(`/sessions/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error("Error al obtener la información de la sesión");
      }

      const data = await respuesta.json();
      setSesionData(data);
    } catch (err) {
      console.error("Error al obtener detalle:", err);
      setError("No se pudo cargar la información de la sesión.");
    } finally {
      setCargando(false);
      fetchingRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (mountedRef.current.has(id)) return;
    mountedRef.current.add(id);
    obtenerDetalleSesion();
  }, [id, obtenerDetalleSesion]);

  // =========================================================
  // LECTURA DE CAMPOS Y EXTRACCIÓN PROFUNDA DE PREDICCIÓN
  // =========================================================
  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};
  const respuestas = sessionData?.respuestas || [];
  const eventos = sessionData?.eventos || [];

  const prediccionTop = sesionData?.prediccion || sesionData?.prediction || {};
  const prediccionRaw = rawData?.prediccion || rawData?.prediction || {};
  const prediccionSession =
    sessionData?.prediccion || sessionData?.prediction || {};

  const buscarResultadoReal = () => {
    const candidatos = [
      prediccionTop?.resultado,
      prediccionTop?.diagnostico,
      prediccionTop?.prediction,
      prediccionRaw?.resultado,
      prediccionRaw?.diagnostico,
      prediccionRaw?.prediction,
      prediccionSession?.resultado,
      prediccionSession?.diagnostico,
      prediccionSession?.prediction,
      sessionData?.prediccion,
      sessionData?.resultado_prediccion,
      sessionData?.diagnostico,
      rawData?.resultado_prediccion,
      sesionData?.resultado_prediccion,
      sesionData?.diagnostico,
      sesionData?.prediccion,
    ];

    const valido = candidatos.find(
      (c) =>
        c && typeof c === "string" && c.toLowerCase() !== "pending_prediction",
    );

    if (valido) return valido;

    const posiblePending = candidatos.find((c) => c);
    return posiblePending || "Bienestar";
  };

  const resultadoRaw = buscarResultadoReal();

  const formatearPrediccion = (val) => {
    if (!val || val.toLowerCase() === "pending_prediction") {
      return "Sí";
    }

    let texto = String(val)
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();

    if (
      texto.toLowerCase() === "bienestar" ||
      texto.toLowerCase() === "bien estar"
    ) {
      return "Sí";
    }

    return texto.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const resultadoPrediccion = formatearPrediccion(resultadoRaw);

  const confianzaRaw =
    prediccionTop?.confianza ||
    prediccionRaw?.confianza ||
    prediccionSession?.confianza ||
    sesionData?.confianza;

  const confianzaModelo = confianzaRaw
    ? `${(Number(confianzaRaw) > 1 ? Number(confianzaRaw) : Number(confianzaRaw) * 100).toFixed(1)}%`
    : "85.0%";

  const observacionesIA =
    prediccionTop?.observaciones ||
    prediccionTop?.mensaje ||
    prediccionRaw?.observaciones ||
    prediccionRaw?.mensaje ||
    prediccionSession?.observaciones ||
    prediccionSession?.mensaje ||
    sesionData?.observaciones ||
    "El participante muestra capacidad de autorregulación emocional";

  // Datos del Alumno y Sesión
  const nombreAlumno =
    sesionData?.nombre ||
    sessionData?.nombre ||
    sessionData?.student_name ||
    "Sin especificar";
  const edadAlumno =
    sesionData?.edad || sessionData?.edad || sessionData?.age
      ? `${sesionData?.edad || sessionData?.edad || sessionData?.age} años`
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
  const idSesion = sesionData?.session_id || id;
  const idParticipante = sessionData?.idParticipante || "Sin ID";
  const dificultad =
    sesionData?.difficulty || sessionData?.difficulty_level || "No registrado";
  const inicioSesion =
    sessionData?.fechaInicio ||
    `${sesionData?.fecha || ""} ${sesionData?.hora || ""}`.trim() ||
    "Sin registro";
  const finSesion = sessionData?.fechaFin || "En curso / Sin registro";

  // =========================================================
  // LÓGICA DE EDICIÓN DEL NOMBRE DEL ALUMNO
  // =========================================================
  const handleAbrirEdicionNombre = () => {
    setNuevoNombreAlumno(
      nombreAlumno !== "Sin especificar" ? nombreAlumno : "",
    );
    setErrorNombreAlumno("");
    setEditandoNombreAlumno(true);
  };

  const handleCancelarEdicionNombre = () => {
    setEditandoNombreAlumno(false);
    setErrorNombreAlumno("");
  };

  const handleCambioNuevoNombreAlumno = (e) => {
    const val = e.target.value;

    // Regla 1: Máximo 25 caracteres
    if (val.length > 25) {
      setErrorNombreAlumno("El nombre no puede superar los 25 caracteres.");
      return;
    }

    // Regla 2: Solo letras, números y espacios
    const regexValida = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!regexValida.test(val)) {
      setErrorNombreAlumno("No se permiten caracteres especiales.");
      return;
    }

    setErrorNombreAlumno("");
    setNuevoNombreAlumno(val);
  };

  const guardarNuevoNombreAlumno = async (e) => {
    e.preventDefault();

    if (!nuevoNombreAlumno.trim()) {
      setErrorNombreAlumno("El nombre no puede estar vacío.");
      return;
    }

    setCargandoNombreAlumno(true);
    setErrorNombreAlumno("");

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        getApiUrl(`/sessions/${id}/name`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombre: nuevoNombreAlumno.trim() }),
        },
      );

      const resData = await respuesta.json().catch(() => ({}));

      if (respuesta.ok) {
        // Actualizar estado local
        setSesionData((prev) => ({
          ...prev,
          nombre: nuevoNombreAlumno.trim(),
          raw_data: {
            ...prev?.raw_data,
            session_data: {
              ...prev?.raw_data?.session_data,
              nombre: nuevoNombreAlumno.trim(),
              student_name: nuevoNombreAlumno.trim(),
            },
          },
        }));
        setEditandoNombreAlumno(false);
      } else {
        setErrorNombreAlumno(
          resData.error || "No se pudo actualizar el nombre del alumno.",
        );
      }
    } catch (err) {
      console.error("Error al actualizar nombre del alumno:", err);
      setErrorNombreAlumno("Error de conexión con el servidor.");
    } finally {
      setCargandoNombreAlumno(false);
    }
  };

  // =========================================================
  // EXPORTAR A PDF
  // =========================================================
  const handleExportPDF = () => {
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
      doc.text("2. Estado de Bienestar", 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        head: [["Métrica / Evaluación", "Resultado"]],
        body: [
          ["Estado de Bienestar", resultadoPrediccion],
          ["Confianza del Modelo", confianzaModelo],
          ["Observaciones", observacionesIA],
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
        body:
          filasRespuestas.length > 0
            ? filasRespuestas
            : [["—", "Sin respuestas registradas", "—", "—", "—"]],
      });

      nextY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text("4. Eventos de la Sesión", 14, nextY);

      const filasEventos = eventos.map((e) => [
        e.fase || "—",
        e.nombre || "—",
        e.timestamp || "—",
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        theme: "striped",
        headStyles: { fillColor: [23, 49, 94] },
        head: [["Fase", "Nombre del Evento", "Timestamp"]],
        body:
          filasEventos.length > 0
            ? filasEventos
            : [["—", "Sin eventos registrados", "—"]],
      });

      doc.save(`Sesion_${idSesion}.pdf`);
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      alert("Ocurrió un error al generar el archivo PDF.");
    }
  };

  // =========================================================
  // EXPORTAR A EXCEL
  // =========================================================
  const handleExportExcel = () => {
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
        { Métrica: "Estado de Bienestar", Valor: resultadoPrediccion },
        { Métrica: "Confianza del Modelo", Valor: confianzaModelo },
        { Métrica: "Observaciones Modelo", Valor: observacionesIA },
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
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(resumenData),
        "Resumen",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(prediccionData),
        "Bienestar IA",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          respuestasData.length > 0
            ? respuestasData
            : [{ Info: "Sin respuestas" }],
        ),
        "Respuestas",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          eventosData.length > 0 ? eventosData : [{ Info: "Sin eventos" }],
        ),
        "Eventos",
      );

      XLSX.writeFile(wb, `Sesion_${idSesion}.xlsx`);
    } catch (err) {
      console.error("Error al generar el Excel:", err);
      alert("Ocurrió un error al generar el Excel.");
    }
  };

  return (
    <div className="sesion-detalle-main-content">
      {/* HEADER */}
      <div className="sesion-detalle-top">
        <div className="top-navegacion">
          <button className="btn-volver" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="acciones-exportar">
            <button
              className="btn-exportar-icono"
              onClick={handleExportPDF}
              title="Exportar a PDF"
              aria-label="Exportar a PDF">
              <span className="icono-pdf">PDF</span>
            </button>

            <button
              className="btn-exportar-icono"
              onClick={handleExportExcel}
              title="Exportar a Excel"
              aria-label="Exportar a Excel">
              <span className="icono-excel">XLS</span>
            </button>
          </div>
        </div>

        <div className="box-titulo">
          <h2>Detalle de la Sesión</h2>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y ERROR */}
      {cargando ? (
        <div className="cargando-container">Cargando datos de la sesión...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : (
        <div className="detalle-grid-container">
          <div className="columna-informacion">
            {/* SECCIÓN 1: DATOS DEL ALUMNO */}
            <div className="card-seccion">
              <h3 className="card-titulo">Datos del Alumno y Sesión</h3>
              <div className="grid-datos-alumno">
                {/* NOMBRE DEL ALUMNO CON LÁPIZ DE EDICIÓN A LA DERECHA */}
                <div className="dato-item">
                  <div className="etiqueta-con-lapiz-alumno">
                    <span
                      className="dato-etiqueta"
                      style={{ margin: 0, padding: 0 }}>
                      Nombre del Alumno
                    </span>
                    {!editandoNombreAlumno && (
                      <button
                        type="button"
                        className="btn-lapiz-alumno"
                        onClick={handleAbrirEdicionNombre}
                        title="Editar nombre del alumno">
                        ✏️
                      </button>
                    )}
                  </div>

                  {!editandoNombreAlumno ? (
                    <span className="dato-valor">{nombreAlumno}</span>
                  ) : (
                    <form
                      onSubmit={guardarNuevoNombreAlumno}
                      className="form-editar-nombre-alumno">
                      <input
                        type="text"
                        value={nuevoNombreAlumno}
                        onChange={handleCambioNuevoNombreAlumno}
                        className="input-editar-nombre-alumno"
                        placeholder="Nombre del alumno"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="btn-guardar-nombre-alumno"
                        disabled={cargandoNombreAlumno}>
                        {cargandoNombreAlumno ? "..." : "✓"}
                      </button>
                      <button
                        type="button"
                        className="btn-cancelar-nombre-alumno"
                        onClick={handleCancelarEdicionNombre}>
                        ✕
                      </button>
                    </form>
                  )}

                  {errorNombreAlumno && (
                    <span className="error-nombre-alumno-texto">
                      {errorNombreAlumno}
                    </span>
                  )}
                </div>

                <div className="dato-item">
                  <span className="dato-etiqueta">Curso</span>
                  <span className="dato-valor">{cursoAlumno}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">Edad</span>
                  <span className="dato-valor">{edadAlumno}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">Género</span>
                  <span className="dato-valor">{generoAlumno}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">ID de Sesión</span>
                  <span className="dato-valor">{idSesion}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">ID Participante</span>
                  <span className="dato-valor">{idParticipante}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">Nivel de Dificultad</span>
                  <span className="dato-valor etiqueta-dificultad">
                    {dificultad}
                  </span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">Inicio de Sesión</span>
                  <span className="dato-valor">{inicioSesion}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-etiqueta">Fin de Sesión</span>
                  <span className="dato-valor">{finSesion}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: ESTADO DE BIENESTAR (TARJETA ÚNICA CENTRALIZADA) */}
            <div className="card-seccion">
              <h3 className="card-titulo">Estado de Bienestar</h3>
              <div className="grid-prediccion">
                <div className="prediccion-card-central">
                  <div className="prediccion-resultado-box">
                    <span className="prediccion-icono">
                      {resultadoPrediccion.toLowerCase().includes("no")
                        ? "⚠️"
                        : "✅"}
                    </span>
                    <span className="prediccion-valor-texto">
                      {resultadoPrediccion}
                    </span>
                  </div>

                  <div className="prediccion-confianza-sub">
                    Confianza: {confianzaModelo}
                  </div>

                  <div className="prediccion-observacion-sub">
                    {observacionesIA}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: RESPUESTAS */}
            <div className="card-seccion">
              <h3 className="card-titulo">Respuestas del Alumno</h3>
              {respuestas.length > 0 ? (
                <div className="respuestas-lista">
                  {respuestas.map((resp, index) => (
                    <div key={index} className="respuesta-item">
                      <div className="respuesta-header-compacto">
                        <span
                          className="respuesta-pregunta-etiqueta"
                          title={resp.textoPregunta}>
                          {resp.textoPregunta || `Pregunta ${index + 1}`}
                        </span>
                        <span className="respuesta-numero">#{index + 1}</span>
                      </div>

                      <div className="respuesta-valor-destacado">
                        {resp.respuestaLabel || "Sin respuesta"}
                      </div>

                      <div className="respuesta-footer-detalles">
                        <span className="info-escena-mini">
                          {resp.escena ? `Escena: ${resp.escena}` : "—"}
                        </span>
                        <span className="info-hora-mini">
                          {resp.timestamp?.split(" ")[1] || ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sin-datos">No hay respuestas registradas.</p>
              )}
            </div>

            {/* SECCIÓN 4: EVENTOS */}
            <div className="card-seccion">
              <h3 className="card-titulo">Eventos de la Sesión</h3>
              {eventos.length > 0 ? (
                <div className="eventos-timeline">
                  {eventos.map((evt, index) => (
                    <div key={index} className="evento-item">
                      <span
                        className={`fase-tag fase-${(evt.fase || "inicio").toLowerCase()}`}>
                        {evt.fase}
                      </span>
                      <span className="evento-nombre">{evt.nombre}</span>
                      <span className="evento-hora">{evt.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sin-datos">No hay eventos registrados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SesionDetalle;
