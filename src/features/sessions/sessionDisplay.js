const CHILE_TIME_ZONE = "America/Santiago";

/** Formatea únicamente instantes ISO con zona; no adivina la zona de fechas antiguas. */
export function formatChileInstant(value, options = {}) {
  if (typeof value !== "string" || !value.trim()) return "";
  const text = value.trim();
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...options,
  }).format(date);
}

export function formatChileDate(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const text = value.trim();
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Obtiene datos de Unity tanto del formato histórico como del contenedor actual de captura. */
export function getExperiencePayloads(rawData) {
  if (!rawData || typeof rawData !== "object") return [];
  if (rawData.session_data && typeof rawData.session_data === "object") {
    return [rawData.session_data];
  }
  return (Array.isArray(rawData.records) ? rawData.records : [])
    .map((entry) => entry?.record)
    .filter((record) => record && typeof record === "object")
    .map((record) => record.session_data && typeof record.session_data === "object"
      ? record.session_data
      : record);
}

/** Use the backend's recorded normalization for display without changing raw Unity data. */
export function getResponsesForDisplay(rawData, modelProcessing) {
  if (!rawData || typeof rawData !== "object") return [];
  const records = Array.isArray(rawData.records) ? rawData.records : null;
  if (!records) {
    return getExperiencePayloads(rawData)
      .flatMap((payload) => Array.isArray(payload?.respuestas) ? payload.respuestas : []);
  }

  const normalizationRecords = modelProcessing?.response_normalization?.records;
  return records.flatMap((entry, recordIndex) => {
    const record = entry?.record;
    if (!record || typeof record !== "object") return [];
    const payload = record.session_data && typeof record.session_data === "object"
      ? record.session_data
      : record;
    const answers = Array.isArray(payload.respuestas) ? payload.respuestas : [];
    const audit = entry?.response_normalization
      || (Array.isArray(normalizationRecords)
        ? normalizationRecords.find((item) => item?.record_index === recordIndex)
        || normalizationRecords.find((item) => item?.identity && item.identity === entry?.identity)
        || normalizationRecords.find((item) => item?.unity_session_id && item.unity_session_id === entry?.unity_session_id)
        : null);

    return answers.map((answer, position) => {
      const normalized = audit?.answers?.find((item) => (
        item?.position === position
        && item?.idPregunta === answer?.idPregunta
        && item?.escena === answer?.escena
      ));
      if (!normalized) return answer;
      if (["normalized", "already_normalized"].includes(normalized.status)
        && Number.isInteger(normalized.respuesta_normalizada)
        && normalized.respuesta_normalizada >= 1
        && normalized.respuesta_normalizada <= 9) {
        return { ...answer, _displayRespuestaLabel: String(normalized.respuesta_normalizada) };
      }
      if (normalized.status === "not_normalized") {
        return { ...answer, _displayRespuestaLabel: "No se pudo normalizar", _normalizacionFallida: true };
      }
      return answer;
    });
  });
}

export function getSessionWallTime(session) {
  const instant = formatChileInstant(session?.capture_started_at);
  if (instant) return instant;
  const date = session?.fecha || "";
  const time = session?.hora || "";
  return [date, time].filter(Boolean).join(" ") || "Sin registro";
}

/**
 * Normaliza el promedio de bienestar del seguimiento.
 *
 * El backend entrega `wellbeing` (evolución) y `bienestar_promedio` (resumen
 * de sesión) como un número ya calculado en la escala 1-9, o `null` cuando
 * falta algún indicador. Por compatibilidad con registros históricos también
 * se acepta el objeto `{ promedio }` de versiones previas de la interfaz.
 * Nunca calcula un valor: solo lee lo que el backend ya entregó.
 */
export function normalizarBienestar(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value && typeof value === "object") {
    const promedio = value.promedio;
    return typeof promedio === "number" && Number.isFinite(promedio) ? promedio : null;
  }
  return null;
}
