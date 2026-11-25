import test from "node:test";
import assert from "node:assert/strict";
import { fetchTrackingData, fetchTrackingSessionDetails, mergeTrackingSessions, trackingSessionsOf, validTrackingEvolutionPoints } from "../src/features/trackings/trackingData.js";

test("normalizes API arrays and removes repeated session_id values", () => {
  const rows = trackingSessionsOf([
    { session_id: " s-1 ", fecha: "2026-01-01" },
    { session_id: "s-1", status: "completed" },
    { session_id: "s-2" },
    { fecha: "missing-id" },
  ]);
  assert.deepEqual(rows, [
    { session_id: "s-1", fecha: "2026-01-01", status: "completed" },
    { session_id: "s-2" },
  ]);
  assert.deepEqual(trackingSessionsOf({ items: [{ session_id: "s-3" }] }).map((item) => item.session_id), ["s-3"]);
});

test("merges a confirmed association into current UI state exactly once", () => {
  const merged = mergeTrackingSessions([{ session_id: "s-1", fecha: "old" }], [{ session_id: "s-1", fecha: "new" }, { session_id: "s-2" }]);
  assert.deepEqual(merged, [{ session_id: "s-1", fecha: "new" }, { session_id: "s-2" }]);
});

test("only real, finite, normalized backend values are eligible for evolution charts", () => {
  const points = validTrackingEvolutionPoints({ sessions: [
    { session_id: "s-1", wellbeing: 7.5 },
    { session_id: "s-2", wellbeing: null, kmeans_group: 0, centroid_relative_index: 35, tension_index: null },
    { session_id: "s-3", wellbeing: "not-a-number" },
  ] }, (value) => typeof value === "number" && Number.isFinite(value) ? value : null);
  assert.deepEqual(points.map((point) => [point.session_id, point.value]), [["s-1", 7.5]]);
});

test("retries a delayed tracking index and returns persisted sessions after refresh", async () => {
  let reads = 0;
  const result = await fetchTrackingData("tracking-1", async () => {
    reads += 1;
    return reads < 2 ? [] : [{ session_id: "session-1" }];
  }, async () => ({ tracking_id: "tracking-1", sessions: [] }), { expectedSessions: [{ session_id: "session-1", fecha: "2026-01-01" }], wait: async () => {} });
  assert.equal(reads, 2);
  assert.deepEqual(result.sessions, [{ session_id: "session-1" }]);
  assert.deepEqual(result.missingExpected, []);
});

test("keeps a confirmed association visible when the index is still catching up", async () => {
  const expected = { session_id: "session-1", fecha: "2026-01-01" };
  const result = await fetchTrackingData("tracking-1", async () => [], async () => null, { expectedSessions: [expected], retries: 1, wait: async () => {} });
  assert.deepEqual(result.sessions, [expected]);
  assert.deepEqual(result.missingExpected, [expected]);
});

test("keeps sessions when evolution endpoint fails, and exposes the endpoint error", async () => {
  const rows = [{ session_id: "session-1", difficulty: "facil" }];
  const result = await fetchTrackingData("tracking-1", async () => rows, async () => {
    throw Object.assign(new Error("No se pudo obtener la evolución del bienestar."), { status: 500 });
  });
  assert.deepEqual(result.sessions, rows);
  assert.equal(result.evolution, null);
  assert.equal(result.evolutionError.status, 500);
});

test("requests the session list and evolution contracts once each", async () => {
  let sessionReads = 0;
  let evolutionReads = 0;
  const rows = [{ session_id: "session-1", difficulty: "facil" }];
  const graph = { sessions: [{ session_id: "session-1", wellbeing: 5 }] };
  const result = await fetchTrackingData("tracking-1", async () => {
    sessionReads += 1;
    return rows;
  }, async () => {
    evolutionReads += 1;
    return graph;
  });
  assert.equal(sessionReads, 1);
  assert.equal(evolutionReads, 1);
  assert.deepEqual(result.sessions, rows);
  assert.deepEqual(result.evolution, graph);
});

test("fetches individual details by the associated session ID and tolerates individual failures", async () => {
  const result = await fetchTrackingSessionDetails([
    { session_id: "s1" }, { session_id: "s2" },
  ], async (id) => {
    if (id === "s2") throw new Error("unavailable");
    return { session_id: id, student_data: { edad: "12" } };
  });
  assert.equal(result.s1.session_id, "s1");
  assert.equal(result.s1.student_data.edad, "12");
  assert.equal(result.s2.detail_error, true);
});

test("a fresh load restores original phase observations without prediction state", async () => {
  const response = {
    tracking_id: "tracking-1",
    total_sessions: 1,
    sessions: [{
      session_id: "session-1",
      session_date: "2026-11-01 10:00",
      model_version: "1.0.0-experimental",
      observations: [
        { dimension: "nerviosismo", phase: "PRE", variable: "nerviosismo_pre", value: 7, type: "observed" },
        { dimension: "nerviosismo", phase: "FACIL", variable: "nerviosismo_facil", value: 4, type: "observed" },
      ],
    }],
  };
  const loadAgain = () => fetchTrackingData("tracking-1", async () => [{ session_id: "session-1" }], async () => response);
  const first = await loadAgain();
  const afterReload = await loadAgain();
  assert.deepEqual(afterReload.evolution.sessions[0].observations, first.evolution.sessions[0].observations);
  assert.equal(Object.hasOwn(afterReload.evolution, "prediction"), false);
  assert.deepEqual(afterReload.evolution.sessions[0].observations.map(({ phase, value }) => [phase, value]), [["PRE", 7], ["FACIL", 4]]);
});
