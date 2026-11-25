export const TRACKING_DIMENSIONS = Object.freeze([
  { id: "nerviosismo", label: "Nerviosismo", phases: ["PRE", "FACIL", "DIFICIL"], variables: { PRE: "nerviosismo_pre", FACIL: "nerviosismo_facil", DIFICIL: "nerviosismo_dificil" } },
  { id: "satisfaccion", label: "Satisfacción", phases: ["FACIL", "DIFICIL"], variables: { FACIL: "satisfaccion_facil", DIFICIL: "satisfaccion_dificil" } },
  { id: "alivio", label: "Alivio", phases: ["FACIL", "DIFICIL"], variables: { FACIL: "alivio_facil", DIFICIL: "alivio_dificil" } },
  { id: "estado_emocional", label: "Estado emocional", phases: ["PRE", "FACIL", "DIFICIL"], variables: { PRE: "estado_pre", FACIL: "estado_facil", DIFICIL: "estado_dificil" } },
  { id: "preocupacion", label: "Preocupación", phases: ["PRE"], variables: { PRE: "preocupacion_pre" } },
  { id: "preparacion", label: "Preparación", phases: ["PRE"], variables: { PRE: "preparacion_pre" } },
]);

const V8_MODEL_VERSION = "1.0.0-experimental";
const PHASE_ORDER = { PRE: 0, FACIL: 1, DIFICIL: 2 };
const PHASE_LABEL = { PRE: "PRE", FACIL: "Modo fácil", DIFICIL: "Modo difícil" };

function validOriginalValue(value) {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}

/**
 * Extracts only observed V8 values for one dimension. It never averages phases,
 * fills missing answers, or reads V2/legacy wellbeing fields.
 */
export function buildDimensionObservations(sessions = [], dimensionId = "nerviosismo") {
  const dimension = TRACKING_DIMENSIONS.find((item) => item.id === dimensionId);
  if (!dimension || !Array.isArray(sessions)) {
    return { dimension: dimension || null, observations: [], sessionCount: 0 };
  }

  const sortedCandidates = sessions
    .filter((session) => session?.model_version === V8_MODEL_VERSION)
    .sort((a, b) => String(a.session_date || "").localeCompare(String(b.session_date || ""))
      || String(a.session_id || "").localeCompare(String(b.session_id || "")));
  const candidates = [...new Map(sortedCandidates
    .filter((session) => typeof session?.session_id === "string" && session.session_id.trim())
    .map((session) => [session.session_id, session])).values()];
  const sessionNumbers = new Map(candidates.map((session, index) => [session.session_id, index + 1]));
  const observations = [];
  const seen = new Set();

  for (const session of candidates) {
    if (typeof session?.session_id !== "string" || !session.session_id.trim()) continue;
    const rawObservations = Array.isArray(session.observations) ? session.observations : [];
    for (const observation of rawObservations) {
      const { dimension: observedDimension, phase, variable, value } = observation || {};
      if (observedDimension !== dimensionId || !dimension.phases.includes(phase)
        || variable !== dimension.variables[phase] || !validOriginalValue(value)) continue;
      const identity = `${session.session_id}\u0000${phase}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      observations.push({
        session_id: session.session_id,
        session_number: sessionNumbers.get(session.session_id),
        session_date: session.session_date || null,
        phase,
        phase_label: PHASE_LABEL[phase],
        variable: typeof variable === "string" ? variable : null,
        value,
        type: "observed",
        x_label: `S${sessionNumbers.get(session.session_id)} · ${phase}`,
      });
    }
  }

  observations.sort((a, b) => a.session_number - b.session_number
    || PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]);

  return {
    dimension,
    observations,
    sessionCount: new Set(observations.map((point) => point.session_id)).size,
  };
}

/** Rows retain every V8 session so missing phase values create visible gaps. */
export function buildSessionPhaseRows(sessions = [], dimensionId = "nerviosismo") {
  const result = buildDimensionObservations(sessions, dimensionId);
  if (!result.dimension) return { ...result, rows: [], phaseRows: [] };

  const sortedCandidates = sessions
    .filter((session) => session?.model_version === V8_MODEL_VERSION
      && typeof session?.session_id === "string" && session.session_id.trim())
    .sort((a, b) => String(a.session_date || "").localeCompare(String(b.session_date || ""))
      || String(a.session_id).localeCompare(String(b.session_id)));
  const candidates = [...new Map(sortedCandidates.map((session) => [session.session_id, session])).values()];
  const observations = new Map(result.observations.map((point) => [`${point.session_id}\u0000${point.phase}`, point]));
  const rows = candidates.map((session, index) => {
    const row = { session_id: session.session_id, session_number: index + 1, session_date: session.session_date || null };
    for (const phase of result.dimension.phases) {
      const point = observations.get(`${session.session_id}\u0000${phase}`);
      row[phase] = point?.value ?? null;
      if (point) row[`${phase}_point`] = point;
    }
    return row;
  });

  const phaseRows = result.observations.map((point) => {
    const row = rows.find((item) => item.session_id === point.session_id);
    const position = Math.max(0, (row?.session_number || 1) - 1);
    const spread = Math.min(0.34, 0.34 / Math.max(1, rows.length - 1));
    const offset = rows.length > 1 ? (position - (rows.length - 1) / 2) * spread : 0;
    return { ...point, phase_index: result.dimension.phases.indexOf(point.phase), display_phase_index: result.dimension.phases.indexOf(point.phase) + offset };
  });

  return {
    ...result,
    rows,
    phaseRows,
  };
}

/**
 * Descriptive, dimension-balanced summary of original V8 responses.
 * It preserves the 1–9 numerical direction without interpreting polarity:
 * average available phases within each dimension, then average dimensions,
 * then retain the resulting mean on its original 1–9 numerical range. Missing values are omitted.
 */
export function buildSessionGeneralIndex(sessions = []) {
  if (!Array.isArray(sessions)) return [];
  const candidates = [...new Map(sessions
    .filter((session) => session?.model_version === V8_MODEL_VERSION
      && typeof session?.session_id === "string" && session.session_id.trim())
    .sort((a, b) => String(a.session_date || "").localeCompare(String(b.session_date || ""))
      || String(a.session_id).localeCompare(String(b.session_id)))
    .map((session) => [session.session_id, session])).values()];

  return candidates.map((session, index) => {
    const dimensions = [];
    const availablePhases = [];
    for (const dimension of TRACKING_DIMENSIONS) {
      const { observations } = buildDimensionObservations([session], dimension.id);
      const phaseMeans = dimension.phases.flatMap((phase) => {
        const value = observations.find((point) => point.phase === phase)?.value;
        if (!validOriginalValue(value)) return [];
        availablePhases.push(`${dimension.id}:${phase}`);
        return [value];
      });
      if (phaseMeans.length) dimensions.push(phaseMeans.reduce((sum, value) => sum + value, 0) / phaseMeans.length);
    }
    if (!dimensions.length) return {
      session_id: session.session_id,
      session_number: index + 1,
      session_date: session.session_date || null,
      value: null,
      dimensions_used: [],
      phases_used: [],
      coverage_key: "",
    };
    const responseMean = dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length;
    return {
      session_id: session.session_id,
      session_number: index + 1,
      session_date: session.session_date || null,
      value: responseMean,
      response_mean: responseMean,
      dimensions_used: dimensions.length,
      phases_used: availablePhases.length,
      coverage_key: availablePhases.sort().join("|"),
    };
  });
}

export function areGeneralIndexPointsComparable(previous, current) {
  return Number.isFinite(previous?.value) && Number.isFinite(current?.value)
    && Boolean(previous?.coverage_key)
    && previous.coverage_key === current?.coverage_key
    && current?.session_number === previous.session_number + 1;
}
