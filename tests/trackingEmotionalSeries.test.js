import test from "node:test";
import assert from "node:assert/strict";
import { areGeneralIndexPointsComparable, buildDimensionObservations, buildSessionGeneralIndex, buildSessionPhaseRows } from "../src/features/trackings/trackingEmotionalSeries.js";

const session = (id, date, observations, model_version = "1.0.0-experimental") => ({
  session_id: id,
  session_date: date,
  model_version,
  observations,
});

const obs = (dimension, phase, variable, value) => ({
  dimension, phase, variable, value, type: "observed",
});

test("nervousness retains PRE/easy/difficult phases and original values in date order", () => {
  const result = buildDimensionObservations([
    session("s2", "2026-11-02", [obs("nerviosismo", "PRE", "nerviosismo_pre", 4), obs("nerviosismo", "FACIL", "nerviosismo_facil", 3)]),
    session("s1", "2026-11-01", [obs("nerviosismo", "PRE", "nerviosismo_pre", 7), obs("nerviosismo", "FACIL", "nerviosismo_facil", 5), obs("nerviosismo", "DIFICIL", "nerviosismo_dificil", 6)]),
  ]);

  assert.equal(result.sessionCount, 2);
  assert.deepEqual(result.observations.map(({ session_id, phase, value }) => [session_id, phase, value]), [
    ["s1", "PRE", 7], ["s1", "FACIL", 5], ["s1", "DIFICIL", 6],
    ["s2", "PRE", 4], ["s2", "FACIL", 3],
  ]);
  assert.equal(result.observations[0].type, "observed");
  assert.equal(result.observations[0].session_date, "2026-11-01");
});

test("more sessions remain separate raw observations and are not averaged together", () => {
  const rows = Array.from({ length: 5 }, (_, index) => session(
    `s${index + 1}`,
    `2026-11-0${index + 1}`,
    [obs("satisfaccion", "FACIL", "satisfaccion_facil", index + 1), obs("satisfaccion", "DIFICIL", "satisfaccion_dificil", 9 - index)],
  ));
  const result = buildDimensionObservations(rows, "satisfaccion");
  assert.equal(result.sessionCount, 5);
  assert.equal(result.observations.length, 10);
  assert.deepEqual(result.observations.slice(0, 4).map((point) => [point.session_id, point.phase, point.value]), [
    ["s1", "FACIL", 1], ["s1", "DIFICIL", 9], ["s2", "FACIL", 2], ["s2", "DIFICIL", 8],
  ]);
});

test("missing and invalid original values stay absent instead of becoming zero", () => {
  const result = buildDimensionObservations([session("s1", "2026-11-01", [
    obs("alivio", "FACIL", "alivio_facil", 0),
    obs("alivio", "DIFICIL", "alivio_dificil", null),
    obs("alivio", "FACIL", "alivio_facil", 8.5),
  ])], "alivio");
  assert.equal(result.sessionCount, 0);
  assert.deepEqual(result.observations, []);
});

test("dimension phases are never combined and disallowed phases are ignored", () => {
  const result = buildDimensionObservations([session("s1", "2026-11-01", [
    obs("satisfaccion", "PRE", "satisfaccion_pre", 9),
    obs("satisfaccion", "FACIL", "satisfaccion_facil", 6),
    obs("satisfaccion", "DIFICIL", "satisfaccion_dificil", 7),
  ])], "satisfaccion");
  assert.deepEqual(result.observations.map((point) => point.phase), ["FACIL", "DIFICIL"]);
});

test("all six V8 dimensions expose only their official phases", () => {
  const cases = [
    ["nerviosismo", { PRE: "nerviosismo_pre", FACIL: "nerviosismo_facil", DIFICIL: "nerviosismo_dificil" }, ["PRE", "FACIL", "DIFICIL"]],
    ["satisfaccion", { FACIL: "satisfaccion_facil", DIFICIL: "satisfaccion_dificil" }, ["FACIL", "DIFICIL"]],
    ["alivio", { FACIL: "alivio_facil", DIFICIL: "alivio_dificil" }, ["FACIL", "DIFICIL"]],
    ["estado_emocional", { PRE: "estado_pre", FACIL: "estado_facil", DIFICIL: "estado_dificil" }, ["PRE", "FACIL", "DIFICIL"]],
    ["preocupacion", { PRE: "preocupacion_pre" }, ["PRE"]],
    ["preparacion", { PRE: "preparacion_pre" }, ["PRE"]],
  ];
  for (const [dimension, variables, phases] of cases) {
    const sessionObservations = ["PRE", "FACIL", "DIFICIL"].map((phase) => (
      obs(dimension, phase, variables[phase] || `${dimension}_${phase.toLowerCase()}`, 5)
    ));
    const result = buildDimensionObservations([
      session("s1", "2026-11-01", sessionObservations),
    ], dimension);
    assert.deepEqual(result.observations.map((point) => point.phase), phases);
  }
});

test("a value with a mismatched Unity variable cannot enter another dimension or phase", () => {
  const result = buildDimensionObservations([session("s1", "2026-11-01", [
    obs("nerviosismo", "FACIL", "satisfaccion_facil", 7),
  ])]);
  assert.deepEqual(result.observations, []);
});

test("switching the supplied tracking data cannot retain observations from the prior tracking", () => {
  const first = buildDimensionObservations([
    session("a1", "2026-11-01", [obs("estado_emocional", "PRE", "estado_pre", 4)]),
  ], "estado_emocional");
  const second = buildDimensionObservations([
    session("b1", "2026-11-02", [obs("estado_emocional", "PRE", "estado_pre", 8)]),
  ], "estado_emocional");
  assert.deepEqual(first.observations.map(({ session_id, value }) => [session_id, value]), [["a1", 4]]);
  assert.deepEqual(second.observations.map(({ session_id, value }) => [session_id, value]), [["b1", 8]]);
});

test("V2 and unknown model records never enter the V8 dimension series", () => {
  const result = buildDimensionObservations([
    session("v8", "2026-11-01", [obs("alivio", "FACIL", "alivio_facil", 5)]),
    session("legacy", "2026-11-02", [obs("alivio", "FACIL", "alivio_facil", 9)], "2.0.0"),
  ], "alivio");
  assert.deepEqual(result.observations.map((point) => point.session_id), ["v8"]);
});

test("duplicate session-phase observations do not create duplicate chart points", () => {
  const result = buildDimensionObservations([session("s1", "2026-11-01", [
    obs("nerviosismo", "PRE", "nerviosismo_pre", 5),
    obs("nerviosismo", "PRE", "nerviosismo_pre", 7),
  ])]);
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].value, 5);
});

test("chart rows order all V8 sessions and retain nulls for missing phases", () => {
  const result = buildSessionPhaseRows([
    session("s3", "2026-11-03", [obs("nerviosismo", "PRE", "nerviosismo_pre", 6)]),
    session("s1", "2026-11-01", [obs("nerviosismo", "PRE", "nerviosismo_pre", 4), obs("nerviosismo", "FACIL", "nerviosismo_facil", 3)]),
    session("s2", "2026-11-02", [], "2.0.0"),
    session("s2", "2026-11-02", [obs("nerviosismo", "DIFICIL", "nerviosismo_dificil", 8)]),
  ]);
  assert.deepEqual(result.rows.map(({ session_id, session_number }) => [session_id, session_number]), [["s1", 1], ["s2", 2], ["s3", 3]]);
  assert.deepEqual(result.rows.map(({ PRE, FACIL, DIFICIL }) => [PRE, FACIL, DIFICIL]), [[4, 3, null], [null, null, 8], [6, null, null]]);
  assert.deepEqual(result.phaseRows.map(({ phase_index, value }) => [phase_index, value]), [[0, 4], [1, 3], [2, 8], [0, 6]]);
});

test("single-phase dimensions expose only their actual phase for both chart layouts", () => {
  const result = buildSessionPhaseRows([session("s1", "2026-11-01", [
    obs("preocupacion", "PRE", "preocupacion_pre", 7),
  ])], "preocupacion");
  assert.deepEqual(result.dimension.phases, ["PRE"]);
  assert.deepEqual(result.rows.map(({ PRE }) => PRE), [7]);
  assert.deepEqual(result.phaseRows.map(({ phase_index, phase }) => [phase_index, phase]), [[0, "PRE"]]);
});

test("general index produces one chronologically ordered value per unique V8 session and preserves empty sessions", () => {
  const values = buildSessionGeneralIndex([
    session("s2", "2026-11-02", [obs("satisfaccion", "FACIL", "satisfaccion_facil", 5)]),
    session("s1", "2026-11-01", [obs("nerviosismo", "PRE", "nerviosismo_pre", 9)]),
    session("s3", "2026-11-03", []),
    session("s2", "2026-11-02", [obs("satisfaccion", "FACIL", "satisfaccion_facil", 5)]),
  ]);
  assert.deepEqual(values.map(({ session_id, value }) => [session_id, value]), [
    ["s1", 9], ["s2", 5], ["s3", null],
  ]);
  assert.equal(new Set(values.map((point) => point.session_id)).size, values.length);
});

test("general index balances phases within each dimension and dimensions equally", () => {
  const result = buildSessionGeneralIndex([session("s1", "2026-11-01", [
    obs("nerviosismo", "PRE", "nerviosismo_pre", 9),
    obs("nerviosismo", "FACIL", "nerviosismo_facil", 9),
    obs("nerviosismo", "DIFICIL", "nerviosismo_dificil", 9),
    obs("satisfaccion", "FACIL", "satisfaccion_facil", 1),
    obs("satisfaccion", "DIFICIL", "satisfaccion_dificil", 1),
    obs("alivio", "FACIL", "alivio_facil", 1),
  ])])[0];
  assert.equal(result.dimensions_used, 3);
  assert.equal(result.phases_used, 6);
  assert.ok(Math.abs(result.response_mean - (11 / 3)) < 1e-10);
  assert.ok(Math.abs(result.value - (11 / 3)) < 1e-10);
});

test("general index ignores invalid values, unknown phases, V2 and mismatched variables without imputing zero", () => {
  const result = buildSessionGeneralIndex([
    session("s1", "2026-11-01", [
      obs("nerviosismo", "PRE", "nerviosismo_pre", 0),
      obs("nerviosismo", "PRE", "nerviosismo_pre", 10),
      obs("nerviosismo", "FACIL", "nerviosismo_pre", 5),
    ]),
    session("v2", "2026-11-02", [obs("nerviosismo", "PRE", "nerviosismo_pre", 9)], "2.0"),
  ]);
  assert.deepEqual(result.map(({ session_id, value }) => [session_id, value]), [["s1", null]]);
});

test("general index marks coverage so the chart can leave gaps between incomparable sessions", () => {
  const results = buildSessionGeneralIndex([
    session("s1", "2026-11-01", [obs("nerviosismo", "PRE", "nerviosismo_pre", 5)]),
    session("s2", "2026-11-02", [obs("nerviosismo", "PRE", "nerviosismo_pre", 6)]),
    session("s3", "2026-11-03", [obs("nerviosismo", "FACIL", "nerviosismo_facil", 7)]),
  ]);
  assert.equal(results[0].coverage_key, results[1].coverage_key);
  assert.notEqual(results[1].coverage_key, results[2].coverage_key);
  assert.equal(areGeneralIndexPointsComparable(results[0], results[1]), true);
  assert.equal(areGeneralIndexPointsComparable(results[1], results[2]), false);
  assert.equal(areGeneralIndexPointsComparable(results[0], { ...results[1], session_number: 3 }), false);
});
