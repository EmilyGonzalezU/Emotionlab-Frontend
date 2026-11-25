import test from "node:test";
import assert from "node:assert/strict";
import { buildCumulativeEvolution } from "../src/features/trackings/trackingEvolution.js";

const v8Session = (id, nervousness, difficulty = "facil") => ({
  session_id: id,
  model_version: "1.0.0-experimental",
  nervousness_session_average: nervousness,
  difficulty,
});

const legacySession = (id, wellbeing, difficulty = "facil") => ({
  session_id: id,
  model_version: "legacy",
  wellbeing,
  difficulty,
});

test("V8 is excluded from the legacy cumulative wellbeing composite", () => {
  for (const rows of [
    [],
    [v8Session("1", 2)],
    [v8Session("1", 2), v8Session("2", 4)],
    [v8Session("1", 2), v8Session("2", 4), v8Session("3", 6)],
    Array.from({ length: 5 }, (_, index) => v8Session(String(index + 1), index + 1)),
  ]) {
    const result = buildCumulativeEvolution(rows);
    assert.equal(result.metric, rows.length ? "v8_pending" : "bienestar_heredado");
    assert.equal(result.valid_session_count, 0);
    assert.deepEqual(result.points, []);
  }
});

test("legacy first point averages three valid sessions and stays on its original scale", () => {
  const result = buildCumulativeEvolution([
    legacySession("1", 2), legacySession("2", 4), legacySession("3", 6),
  ]);
  assert.equal(result.metric, "bienestar_heredado");
  assert.deepEqual(result.points.map((point) => point.cumulative_average), [4]);
  assert.equal(result.points[0].valid_session_number, 3);
});

test("legacy cumulative points add one valid session at a time; difficulty remains context only", () => {
  const result = buildCumulativeEvolution([
    legacySession("1", 2, "facil"),
    legacySession("2", 4, "dificil"),
    legacySession("3", 6, "facil"),
    legacySession("4", 8, "dificil"),
    legacySession("5", 4, "medio"),
  ]);
  assert.deepEqual(result.points.map((point) => point.cumulative_average), [4, 5, 4.8]);
  assert.deepEqual(result.points.map((point) => point.valid_session_number), [3, 4, 5]);
  assert.deepEqual(result.points[0].difficulties_included, ["facil", "dificil"]);
  assert.deepEqual(result.points[2].difficulties_included, ["facil", "dificil", "medio"]);
});

test("mixed V2 and V8 records never blend; a V8 record disables the series", () => {
  const result = buildCumulativeEvolution([
    legacySession("old", 8),
    v8Session("1", 2), v8Session("2", 4), v8Session("3", 6),
  ]);
  assert.equal(result.metric, "v8_pending");
  assert.equal(result.valid_session_count, 0);
  assert.deepEqual(result.points, []);
});

test("legacy wellbeing ignores missing and nonnumeric results", () => {
  const result = buildCumulativeEvolution([
    legacySession("1", 4),
    legacySession("2", null),
    legacySession("3", "invalid"),
    legacySession("4", 8),
  ]);
  assert.equal(result.valid_session_count, 2);
  assert.deepEqual(result.points, []);
});
