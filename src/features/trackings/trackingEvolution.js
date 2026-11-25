export const MIN_SESSIONS_FOR_REFERENCE = 3;
export const V8_MODEL_VERSION = "1.0.0-experimental";

const isRating = (value) => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 9;

/**
 * Build cumulative points for the legacy homogeneous wellbeing metric only.
 * V8 original dimensions are handled separately by trackingEmotionalSeries.js;
 * they must never be folded into a composite wellbeing average here.
 */
export function buildCumulativeEvolution(sessions = [], minimum = MIN_SESSIONS_FOR_REFERENCE) {
  const records = Array.isArray(sessions) ? sessions : [];
  const usesV8 = records.some((session) => session?.model_version === V8_MODEL_VERSION);
  if (usesV8) {
    return { metric: "v8_pending", valid_session_count: 0, points: [] };
  }
  const metric = "wellbeing";
  const valid = records.filter((session) => (
    session?.model_version !== V8_MODEL_VERSION && isRating(session?.[metric])
  ));
  let cumulative = 0;
  const points = [];
  const included = [];
  valid.forEach((session) => {
    cumulative += session[metric];
    included.push(session);
    const count = included.length;
    if (count < minimum) return;
    const difficulties = [...new Set(included.map((item) => item?.difficulty).filter((value) => typeof value === "string" && value.trim()))];
    points.push({
      session_id: session.session_id,
      session_date: session.session_date,
      valid_session_number: count,
      cumulative_average: cumulative / count,
      difficulty: session.difficulty || null,
      difficulties_included: difficulties,
    });
  });
  return {
    metric: "bienestar_heredado",
    valid_session_count: valid.length,
    points,
  };
}
