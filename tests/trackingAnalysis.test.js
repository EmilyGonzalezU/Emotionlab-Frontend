import test from "node:test";
import assert from "node:assert/strict";
import { buildPhaseAnalysis, originalUnityResponses, responsesByV8Variable, validateTrackingDemographics } from "../src/features/trackings/trackingAnalysis.js";

const point = (session_id, session_number, date, dimension, phase, variable, value) => ({
  session_id, session_number, session_date: date, model_version: "1.0.0-experimental",
  observations: value == null ? [] : [{ dimension, phase, variable, value, type: "observed" }],
});

test("phase analysis returns only observed values and preserves missing sessions", () => {
  const sessions = [
    point("s1", 1, "2026-01-01", "nerviosismo", "PRE", "nerviosismo_pre", 2),
    point("s2", 2, "2026-02-01", "nerviosismo", "PRE", "nerviosismo_pre", 3),
    point("s3", 3, "2026-03-01", "nerviosismo", "PRE", "nerviosismo_pre", null),
    point("s4", 4, "2026-04-01", "nerviosismo", "PRE", "nerviosismo_pre", 7),
    point("s5", 5, "2026-05-01", "nerviosismo", "PRE", "nerviosismo_pre", 8),
    point("s6", 6, "2026-06-01", "nerviosismo", "PRE", "nerviosismo_pre", 9),
  ];
  const result = buildPhaseAnalysis(sessions, "nerviosismo", "PRE");
  assert.deepEqual(result.observations.map((entry) => entry.value), [2, 3, 7, 8, 9]);
  assert.equal(Object.hasOwn(result, "estimate"), false);
  assert.deepEqual(result.rows.map((row) => row.observed), [2, 3, null, 7, 8, 9]);
});

test("phase analysis keeps dimensions and phases independent without prediction state", () => {
  const sessions = [
    point("s1", 1, "2026-01-01", "nerviosismo", "PRE", "nerviosismo_pre", 2),
    point("s2", 2, "2026-02-01", "nerviosismo", "PRE", "nerviosismo_pre", 8),
    point("s3", 3, "2026-03-01", "nerviosismo", "FACIL", "nerviosismo_facil", 9),
    point("s4", 4, "2026-04-01", "satisfaccion", "PRE", "satisfaccion_pre", 9),
  ];
  assert.deepEqual(buildPhaseAnalysis(sessions, "nerviosismo", "PRE").observations.map((entry) => entry.value), [2, 8]);
  assert.deepEqual(buildPhaseAnalysis(sessions, "nerviosismo", "FACIL").observations.map((entry) => entry.value), [9]);
  assert.deepEqual(buildPhaseAnalysis(sessions, "satisfaccion", "FACIL").observations.map((entry) => entry.value), []);
});

test("chart rows keep missing sessions as gaps and contain no future estimate", () => {
  const sessions = [
    point("s1", 1, "2026-01-01", "nerviosismo", "PRE", "nerviosismo_pre", 4),
    point("s2", 2, "2026-02-01", "nerviosismo", "PRE", "nerviosismo_pre", 5),
    point("s3", 3, "2026-03-01", "nerviosismo", "PRE", "nerviosismo_pre", 6),
    point("s4", 4, "2026-04-01", "nerviosismo", "PRE", "nerviosismo_pre", null),
  ];
  const result = buildPhaseAnalysis(sessions, "nerviosismo", "PRE");
  assert.deepEqual(result.rows.map((row) => row.observed), [4, 5, 6, null]);
  assert.equal(Object.hasOwn(result, "estimate"), false);
});

test("demographic review accepts an age increase compatible with the dates and flags an implausible jump", () => {
  const sessions = [
    { session_id: "s1", session_date: "2025-02-01" },
    { session_id: "s2", session_date: "2025-10-01" },
  ];
  const consistent = validateTrackingDemographics(sessions, {
    s1: { edad: "12", genero: "Femenino" },
    s2: { edad: "13", genero: "Femenino" },
  });
  assert.equal(consistent.status, "consistent");
  const review = validateTrackingDemographics(sessions, {
    s1: { edad: "12", genero: "Femenino" },
    s2: { edad: "15", genero: "Masculino" },
  });
  assert.equal(review.status, "requires_review");
  assert.deepEqual(review.differences.map((row) => row.session_id), ["s1", "s2"]);
  assert.ok(review.differences.every((row) => row.age_difference && row.gender_difference));
});

test("birth date, when present, determines the expected age on each session date", () => {
  const result = validateTrackingDemographics([
    { session_id: "s1", session_date: "2025-06-10" },
    { session_id: "s2", session_date: "2026-06-10" },
  ], {
    s1: { edad: "12", genero: "X", fecha_nacimiento: "2013-05-01" },
    s2: { edad: "14", genero: "X", fecha_nacimiento: "2013-05-01" },
  });
  assert.equal(result.status, "requires_review");
  assert.ok(result.differences.some((row) => row.session_id === "s2" && row.age_difference));
});

test("missing demographics remain insufficient, never normalized into values", () => {
  const result = validateTrackingDemographics([{ session_id: "s1", session_date: "2025-01-01" }], { s1: { edad: "+17" } });
  assert.equal(result.status, "insufficient");
  assert.equal(result.sessions[0].age, null);
});

test("original answers omit name and demographic fields; V8 exports preserve missing values as blanks", () => {
  const detail = { raw_data: { session_data: { respuestas: [
    { idPregunta: "edad", respuestaLabel: "14" },
    { idPregunta: "genero", respuestaLabel: "Femenino" },
    { idPregunta: "nombre", respuestaLabel: "Nombre no exportar" },
    { idPregunta: "q-personal", pregunta: "¿Cuál es tu edad?", respuestaLabel: "14" },
    { idPregunta: "nerviosismo", respuestaLabel: "5", escena: "PRE" },
  ] } } };
  assert.deepEqual(originalUnityResponses(detail).map((response) => response.idPregunta), ["nerviosismo"]);
  const values = responsesByV8Variable([point("s1", 1, "2026-01-01", "nerviosismo", "PRE", "nerviosismo_pre", 5)]);
  assert.equal(values.get("s1").nerviosismo_pre, 5);
  assert.equal(values.get("s1").nerviosismo_facil, undefined);
});
