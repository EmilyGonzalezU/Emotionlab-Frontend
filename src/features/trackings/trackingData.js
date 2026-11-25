export function trackingSessionsOf(value) {
  const records = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  const byId = new Map();
  for (const session of records) {
    const id = typeof session?.session_id === "string" ? session.session_id.trim() : "";
    if (id) byId.set(id, { ...(byId.get(id) || {}), ...session, session_id: id });
  }
  return [...byId.values()];
}

export function mergeTrackingSessions(current, incoming) {
  return trackingSessionsOf([...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]);
}

export async function fetchTrackingSessionDetails(sessions = [], fetchDetail) {
  if (typeof fetchDetail !== "function") return {};
  const records = trackingSessionsOf(sessions);
  const results = await Promise.allSettled(records.map((session) => fetchDetail(session.session_id)));
  return Object.fromEntries(results.map((result, index) => [
    records[index].session_id,
    result.status === "fulfilled" && result.value && typeof result.value === "object"
      ? result.value
      : { detail_error: true },
  ]));
}

export function validTrackingEvolutionPoints(evolution, normalizeValue) {
  const points = Array.isArray(evolution?.sessions) ? evolution.sessions : [];
  return points.map((point) => ({ ...point, value: normalizeValue(point?.wellbeing) }))
    .filter((point) => typeof point.value === "number" && Number.isFinite(point.value));
}

export async function fetchTrackingData(trackingId, fetchSessions, fetchEvolution, { expectedSessions = [], excludedSessionIds = [], retries = 3, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  if (!trackingId) return { sessions: [], evolution: null, missingExpected: [], excludedStillPresent: [] };
  let sessions = [];
  let evolution = null;
  let evolutionError = null;
  let missingExpected = [];
  let excludedStillPresent = [];
  const shouldVerifyIndex = expectedSessions.length > 0 || excludedSessionIds.length > 0;
  for (let attempt = 0; attempt <= (shouldVerifyIndex ? retries : 0); attempt += 1) {
    const [sessionsResult, evolutionResult] = await Promise.allSettled([
      fetchSessions(trackingId),
      fetchEvolution(trackingId),
    ]);
    if (sessionsResult.status === "rejected") throw sessionsResult.reason;
    sessions = trackingSessionsOf(sessionsResult.value);
    evolutionError = evolutionResult.status === "rejected" ? evolutionResult.reason : null;
    evolution = evolutionResult.status === "fulfilled" ? evolutionResult.value : null;
    const returnedIds = new Set(sessions.map((session) => session.session_id));
    missingExpected = expectedSessions.filter((session) => !returnedIds.has(session.session_id));
    excludedStillPresent = excludedSessionIds.filter((sessionId) => returnedIds.has(sessionId));
    if ((!missingExpected.length && !excludedStillPresent.length) || attempt === retries || !shouldVerifyIndex) break;
    await wait(150 * (attempt + 1));
  }
  const observedEvolution = evolution && typeof evolution === "object" ? { ...evolution } : evolution;
  if (observedEvolution && typeof observedEvolution === "object") delete observedEvolution.prediction;
  return {
    sessions: mergeTrackingSessions(sessions.filter((session) => !excludedSessionIds.includes(session.session_id)), missingExpected),
    evolution: evolution && typeof evolution === "object" ? observedEvolution : evolution,
    evolutionError,
    missingExpected,
    excludedStillPresent,
  };
}
