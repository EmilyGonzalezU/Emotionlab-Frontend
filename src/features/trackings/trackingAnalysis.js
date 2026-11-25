import { buildDimensionObservations, TRACKING_DIMENSIONS } from "./trackingEmotionalSeries.js";
import { getExperiencePayloads } from "../sessions/sessionDisplay.js";

export const V8_VARIABLES = Object.freeze(TRACKING_DIMENSIONS.flatMap((dimension) =>
  dimension.phases.map((phase) => ({
    dimension: dimension.id,
    phase,
    variable: dimension.variables[phase],
  })),
));

const PERSONAL_QUESTION_IDS = new Set(["edad", "age", "student_age", "genero", "género", "gender", "student_gender", "nombre", "name", "student_name", "nombre_alumno"]);
const normalizeText = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function buildPhaseAnalysis(evolution = [], dimensionId = "nerviosismo", phase = "PRE") {
  const { dimension, observations } = buildDimensionObservations(evolution, dimensionId);
  if (!dimension || !dimension.phases.includes(phase)) return { dimension, phase, observations: [], rows: [] };
  const points = observations.filter((point) => point.phase === phase).sort((a, b) =>
    a.session_number - b.session_number || String(a.session_date || "").localeCompare(String(b.session_date || "")));
  const candidates = [...new Map((Array.isArray(evolution) ? evolution : [])
    .filter((session) => session?.model_version === "1.0.0-experimental" && typeof session?.session_id === "string" && session.session_id.trim())
    .sort((a, b) => String(a.session_date || "").localeCompare(String(b.session_date || "")) || String(a.session_id).localeCompare(String(b.session_id)))
    .map((session) => [session.session_id, session])).values()];
  const pointsById = new Map(points.map((point) => [point.session_id, point]));
  const rows = candidates.map((session, index) => {
    const point = pointsById.get(session.session_id);
    return {
      session_id: session.session_id,
      session_number: index + 1,
      session_date: session.session_date || null,
      observed: point?.value ?? null,
      point: point || null,
    };
  });
  return { dimension, phase, observations: points, rows };
}

function parseRawData(value) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

export function unityRecords(detail) {
  const raw = parseRawData(detail?.raw_data ?? detail?.raw_json);
  if (Array.isArray(raw)) return raw.flatMap((entry) => getExperiencePayloads(entry));
  const extracted = getExperiencePayloads(raw);
  if (extracted.length) return extracted;
  return raw && typeof raw === "object" && Array.isArray(raw.respuestas || raw.responses || raw.answers) ? [raw] : [];
}

export function originalUnityResponses(detail) {
  return unityRecords(detail).flatMap((record) => {
    const responses = record?.respuestas ?? record?.responses ?? record?.answers;
    return Array.isArray(responses) ? responses : [];
  }).filter((response) => {
    const id = normalizeText(response?.idPregunta ?? response?.id_pregunta ?? response?.question_id ?? response?.id);
    const label = normalizeText(response?.pregunta ?? response?.question ?? "");
    const personalLabel = /\b(edad|age|genero|gender|nombre|name)\b/.test(label);
    return !PERSONAL_QUESTION_IDS.has(id) && !personalLabel;
  });
}

function responseValue(detail, acceptedIds) {
  const accepted = new Set(acceptedIds.map(normalizeText));
  for (const record of unityRecords(detail)) {
    const responses = record?.respuestas ?? record?.responses ?? record?.answers;
    if (!Array.isArray(responses)) continue;
    for (const response of responses) {
      const id = normalizeText(response?.idPregunta ?? response?.id_pregunta ?? response?.question_id ?? response?.id);
      if (accepted.has(id)) return response?.respuestaLabel ?? response?.respuesta ?? response?.answer ?? response?.value ?? null;
    }
  }
  return null;
}

function sessionDate(session, detail) {
  const raw = session?.session_date || session?.fecha || detail?.fecha || detail?.capture_started_at || "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOfBirth(detail) {
  const candidates = [detail?.fecha_nacimiento, detail?.birth_date, detail?.date_of_birth, detail?.student_data?.fecha_nacimiento];
  for (const record of unityRecords(detail)) {
    candidates.push(record?.fecha_nacimiento, record?.birth_date, record?.date_of_birth);
  }
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function ageOn(birthDate, atDate) {
  let age = atDate.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = atDate.getMonth() < birthDate.getMonth()
    || (atDate.getMonth() === birthDate.getMonth() && atDate.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function getDemographics(session, detail) {
  const ageRaw = detail?.student_data?.edad ?? detail?.edad ?? responseValue(detail, ["edad", "age"]);
  const genderRaw = detail?.student_data?.genero ?? detail?.genero ?? responseValue(detail, ["genero", "género", "gender"]);
  const ageText = typeof ageRaw === "string" ? ageRaw.trim() : ageRaw;
  const exactAge = (typeof ageText === "number" && Number.isInteger(ageText))
    ? ageText
    : (typeof ageText === "string" && /^\d{1,3}$/.test(ageText) ? Number(ageText) : null);
  return {
    session_id: session?.session_id,
    session_date: sessionDate(session, detail),
    age: exactAge !== null && exactAge >= 1 && exactAge <= 120 ? exactAge : null,
    age_label: ageText === null || ageText === undefined || ageText === "" ? null : String(ageText),
    birth_date: dateOfBirth(detail),
    gender: typeof genderRaw === "string" && genderRaw.trim() ? genderRaw.trim() : null,
    detail_error: Boolean(detail?.detail_error),
  };
}

export function validateTrackingDemographics(sessions = [], detailsById = {}) {
  const records = [...sessions].sort((a, b) =>
    String(a.fecha || a.session_date || "").localeCompare(String(b.fecha || b.session_date || ""))
    || String(a.hora || "").localeCompare(String(b.hora || ""))
    || String(a.session_id || "").localeCompare(String(b.session_id || "")))
    .map((session, index) => ({ ...getDemographics(session, detailsById[session.session_id] || null), session_number: index + 1 }));

  const genderValues = new Set(records.map((record) => normalizeText(record.gender)).filter(Boolean));
  const genderDiffIds = genderValues.size > 1
    ? records.filter((record) => record.gender).map((record) => record.session_id)
    : [];
  const allGenderPresent = records.length > 0 && records.every((record) => Boolean(record.gender));

  const ageDiffIds = new Set();
  const exactAgeRecords = records.filter((record) => record.age !== null && record.session_date);
  const recordsWithBirthDate = records.filter((record) => record.birth_date && record.session_date);
  let ageEvaluable = records.length > 1 && exactAgeRecords.length === records.length;
  for (const record of recordsWithBirthDate) {
    if (record.age !== null && record.age !== ageOn(record.birth_date, record.session_date)) ageDiffIds.add(record.session_id);
  }
  if (recordsWithBirthDate.length === records.length && records.length > 1) {
    ageEvaluable = records.every((record) => record.age !== null);
  } else {
    for (let index = 1; index < exactAgeRecords.length; index += 1) {
      const previous = exactAgeRecords[index - 1];
      const current = exactAgeRecords[index];
      if (previous.birth_date && current.birth_date) continue;
      const calendarYearDelta = current.session_date.getFullYear() - previous.session_date.getFullYear();
      const previousMonthDay = previous.session_date.getMonth() * 32 + previous.session_date.getDate();
      const currentMonthDay = current.session_date.getMonth() * 32 + current.session_date.getDate();
      const lower = Math.max(0, calendarYearDelta - (currentMonthDay < previousMonthDay ? 1 : 0));
      const upper = Math.max(0, calendarYearDelta + (currentMonthDay > previousMonthDay ? 1 : 0));
      const delta = current.age - previous.age;
      if (delta < lower || delta > upper) {
        ageDiffIds.add(previous.session_id);
        ageDiffIds.add(current.session_id);
      }
    }
    if (exactAgeRecords.length < records.length) ageEvaluable = false;
  }

  const ageDiscrepancy = ageDiffIds.size > 0;
  const genderDiscrepancy = genderDiffIds.length > 0;
  const requiresReview = ageDiscrepancy || genderDiscrepancy;
  const complete = allGenderPresent && ageEvaluable;
  const status = requiresReview ? "requires_review" : complete ? "consistent" : "insufficient";
  const affected = new Set([...ageDiffIds, ...genderDiffIds]);
  return {
    status,
    label: status === "consistent" ? "Consistente" : status === "requires_review" ? "Requiere revisión" : "Información insuficiente",
    age_evaluable: ageEvaluable,
    gender_evaluable: allGenderPresent,
    sessions: records.map((record) => ({ ...record, date_label: record.session_date?.toLocaleDateString("es-CL", { timeZone: "America/Santiago" }) || "Fecha no disponible", has_difference: affected.has(record.session_id) })),
    differences: records.filter((record) => affected.has(record.session_id)).map((record) => ({
      session_id: record.session_id,
      session_number: record.session_number,
      age: record.age_label,
      gender: record.gender,
      age_difference: ageDiffIds.has(record.session_id),
      gender_difference: genderDiffIds.includes(record.session_id),
    })),
    notice: "La consistencia de edad y género revisa los datos registrados; no verifica la identidad de una persona.",
  };
}

export function responsesByV8Variable(evolutionSessions = []) {
  const bySession = new Map();
  for (const session of evolutionSessions) {
    const values = {};
    for (const observation of Array.isArray(session?.observations) ? session.observations : []) {
      if (V8_VARIABLES.some((entry) => entry.variable === observation?.variable)
        && Number.isInteger(observation.value) && observation.value >= 1 && observation.value <= 9) {
        values[observation.variable] = observation.value;
      }
    }
    bySession.set(session.session_id, values);
  }
  return bySession;
}
