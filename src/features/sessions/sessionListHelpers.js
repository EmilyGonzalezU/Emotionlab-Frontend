import { formatChileInstant } from "./sessionDisplay.js";

/**
 * Normalización y parseo de sesiones para el listado. Extraído
 * literalmente de sesiones_visor.jsx — mismo criterio, sin cambios de
 * comportamiento.
 */
export const normalizarGenero = (valor) =>
  (valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function procesarSesionRaw(item, index) {
  const student = item?.student_data || {};
  const name = item?.nombre || student?.nombre || item?.student_name || item?.raw_data?.nombre || "";
  const modelStatus = item?.model_processing?.status || item?.ai_status || "";
  const sessionStatus = String(item?.status || item?.estado || "").toLowerCase();
  const difficulty = item?.difficulty || item?.difficulty_level || item?.raw_data?.difficulty || "";
  const startedAt = item?.capture_started_at || item?.raw_data?.fechaInicio || null;
  const endedAt = item?.capture_ended_at || item?.capture_finished_at || item?.raw_data?.fechaFin || null;
  const explicitDuration = item?.duracion_estimada;
  let durationLabel = "Sin registrar";
  if (typeof explicitDuration === "number" && Number.isFinite(explicitDuration) && explicitDuration >= 0) {
    durationLabel = `${Math.round(explicitDuration)} min`;
  } else if (startedAt && endedAt) {
    const elapsed = (Date.parse(endedAt) - Date.parse(startedAt)) / 1000;
    if (Number.isFinite(elapsed) && elapsed >= 0) durationLabel = elapsed >= 60 ? `${Math.round(elapsed / 60)} min` : `${Math.round(elapsed)} s`;
  }
  const sessionStatusLabel = ({ completed: "Completada", identified: "Completada", identificada: "Completada", captured: "Completada", capturing: "En proceso", finalizing: "En proceso", importing: "En proceso", imported: "Incompleta", pending_assignment: "Incompleta", pendiente_identificacion: "Incompleta", capture_import_error: "Error de procesamiento", import_error: "Error de procesamiento", processing_error: "Error de procesamiento", error: "Error de procesamiento" })[sessionStatus] || "Sin estado";
  const analysisLabel = modelStatus === "analyzed" ? "Disponible" : modelStatus === "insufficient_data" ? "Datos insuficientes" : ["error", "processing_error"].includes(modelStatus) ? "Error del cálculo" : modelStatus ? "Pendiente" : "Sin cálculo";
  if (item?.capture_started_at) {
    const instant = new Date(item.capture_started_at);
    if (!Number.isNaN(instant.getTime())) {
      const chileParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(instant);
      const values = Object.fromEntries(chileParts.map(({ type, value }) => [type, value]));
      const fechaISO = `${values.year}-${values.month}-${values.day}`;
      const fechaTexto = `${values.day}/${values.month}/${values.year}`;
      const fechaFormateada = formatChileInstant(item.capture_started_at);
      return {
        id: item.id || item.session_id || `SES-${index + 1}`,
        _raw: item,
        fechaRaw: instant,
        fechaFormateada: fechaFormateada || "Sin fecha",
        fechaComparar: fechaTexto.replaceAll("/", "-"),
        fechaISO,
        curso: item.curso || item.course || "Curso no asignado",
        cursoNormalizado: (item.curso || item.course || "Curso no asignado").toLowerCase().trim(),
        genero: item.genero || item.gender || item.participante_genero || item.student_data?.genero || "",
        nombre: name,
        estadoSesion: sessionStatus,
        estadoSesionLabel: sessionStatusLabel,
        dificultad: difficulty,
        duracion: durationLabel,
        analisisLabel: analysisLabel,
        modelStatus,
      };
    }
  }

  // Fecha real de la sesión.
  // created_at corresponde a la importación y no debe utilizarse.
  const fechaSesion = item.fecha || "";
  const horaSesion = item.hora || "";

  const fechaISO = fechaSesion ? String(fechaSesion).split("T")[0].slice(0, 10) : "";

  let objetoFecha = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    let horaNormalizada = String(horaSesion || "00:00:00");

    if (/^\d{2}:\d{2}$/.test(horaNormalizada)) {
      horaNormalizada += ":00";
    }

    if (!/^\d{2}:\d{2}:\d{2}$/.test(horaNormalizada)) {
      horaNormalizada = "00:00:00";
    }

    const fechaConstruida = new Date(`${fechaISO}T${horaNormalizada}`);
    if (!Number.isNaN(fechaConstruida.getTime())) {
      objetoFecha = fechaConstruida;
    }
  }

  const fechaTexto = objetoFecha
    ? objetoFecha.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : fechaISO
      ? `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}/${fechaISO.slice(0, 4)}`
      : "Sin fecha";

  const horaTexto = horaSesion
    ? String(horaSesion).slice(0, 5)
    : objetoFecha
      ? objetoFecha.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "";

  const cursoRaw = item.curso || item.course || "Curso no asignado";

  return {
    id: item.id || item.session_id || `SES-${index + 1}`,
    _raw: item,
    fechaRaw: objetoFecha,
    fechaFormateada: `${fechaTexto} ${horaTexto}`.trim(),
    fechaComparar: fechaTexto.replaceAll("/", "-"),
    fechaISO: fechaISO,
    curso: cursoRaw,
    cursoNormalizado: cursoRaw.toLowerCase().trim(),
    genero: item.genero || item.gender || item.participante_genero || "",
    nombre: name,
    estadoSesion: sessionStatus,
    estadoSesionLabel: sessionStatusLabel,
    dificultad: difficulty,
    duracion: durationLabel,
    analisisLabel: analysisLabel,
    modelStatus,
  };
}
