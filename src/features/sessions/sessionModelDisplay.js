const V8_VERSION = "1.0.0-experimental";
const STATUS_LABELS = {
  analyzed: "Cálculo con IA completado",
  insufficient_data: "Datos insuficientes",
  processing_error: "Error en el cálculo con IA",
  error: "Error en el cálculo con IA",
  pending: "Cálculo con IA pendiente",
  capturing: "Capturando sesión",
  finalizing: "Finalizando sesión",
  importing: "Recuperando registros",
  captured: "Captura persistida",
};

export function isV8Model(model) {
  return Boolean(
    model
    && model.model_version === V8_VERSION
    && model.algorithm === "KMeans"
    && model.n_clusters === 2
  );
}

/** Read only fields returned by the V8 model contract; never treats V2 fields as V8. */
export function getV8SessionSummary(session) {
  const model = session?.model_processing
    || session?.raw_data?.model_processing
    || {};
  const hasModelData = Object.keys(model).length > 0;
  const isV8 = isV8Model(model);
  const status = model.status || session?.ai_status || "";
  const analyzed = isV8 && status === "analyzed";
  const rawGroup = model.prediction?.group ?? model.grupo;
  const group = analyzed
    && Number.isInteger(rawGroup)
    && rawGroup >= 0
    && rawGroup < 2
    ? rawGroup
    : null;
  const rawIndex = model.indice_relativo_centroides;
  const centroidIndex = analyzed
    && typeof rawIndex === "number"
    && Number.isFinite(rawIndex)
    && rawIndex >= 0
    && rawIndex <= 100
    ? rawIndex
    : null;
  const observed = isV8 && Number.isInteger(model.observadas)
    ? model.observadas
    : null;
  const estimatedCount = isV8 && Array.isArray(model.estimadas)
    ? model.estimadas.length
    : null;

  let statusLabel;
  if (isV8) {
    statusLabel = STATUS_LABELS[status] || status || "Estado del cálculo no informado";
  } else if (hasModelData) {
    statusLabel = "Resultado automatizado anterior no disponible";
  } else if (status === "analyzed") {
    statusLabel = "Resultado automatizado sin identificar";
  } else {
    statusLabel = STATUS_LABELS[status] || "Sin resultado del cálculo";
  }

  const statusTone = analyzed
    ? "success"
    : ["insufficient_data", "processing_error", "error"].includes(status)
      ? "warning"
      : "neutral";

  const missing = isV8 && Array.isArray(model.variables_sin_datos_suficientes)
    ? model.variables_sin_datos_suficientes
    : [];

  return {
    isV8,
    status,
    statusLabel,
    statusTone,
    group,
    groupLabel: group === null ? "—" : "Grupo " + group,
    centroidIndex,
    centroidIndexLabel: centroidIndex === null ? "—" : String(centroidIndex),
    observed,
    estimatedCount,
    profile: isV8 ? model.perfil_tension || null : null,
    missing,
    error: typeof model.error === "string"
      ? model.error
      : model.error?.message || model.error?.type || "",
  };
}
