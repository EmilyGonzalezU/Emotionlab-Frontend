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
  };
}
