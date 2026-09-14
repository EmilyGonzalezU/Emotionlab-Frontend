/**
 * Lectura e interpretación del resultado de IA de una sesión.
 *
 * IMPORTANTE:
 * - Nunca inventa un resultado.
 * - Nunca inventa una confianza.
 * - Utiliza únicamente valores entregados por el backend/modelo.
 * - Soporta las distintas ubicaciones/nombres utilizados por el backend.
 */

const ESTADOS_EN_PROCESO = new Set([
  "pending_prediction",
  "pending",
  "processing",
  "en_proceso",
  "pendiente",
]);

function formatearPrediccion(val) {
  return String(val)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function obtenerObjetoPrediccion(sesionData) {
  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};

  const candidatos = [
    sesionData?.prediccion,
    sesionData?.prediction,
    rawData?.prediccion,
    rawData?.prediction,
    sessionData?.prediccion,
    sessionData?.prediction,
  ];

  return candidatos.find(
    (valor) => valor && typeof valor === "object" && !Array.isArray(valor),
  ) || {};
}

function obtenerPrimerValor(...valores) {
  return valores.find(
    (valor) =>
      valor !== undefined &&
      valor !== null &&
      valor !== "",
  );
}

/**
 * Recibe el objeto de sesión tal como lo entrega GET /sessions/:id.
 *
 * Devuelve:
 *   estado: "resultado" | "en_proceso" | "no_disponible"
 *   resultado: texto real de la predicción o estado explícito
 *   confianza: porcentaje real o "No disponible"
 *   observaciones: observaciones reales o mensaje de estado
 *   esNegativo: utilizado únicamente para el tono visual
 */
export function interpretarResultadoIA(sesionData) {
  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};
  const prediccion = obtenerObjetoPrediccion(sesionData);

  const estadoSesionRaw = String(
    obtenerPrimerValor(
      sesionData?.status,
      sesionData?.estado,
      sessionData?.status,
      sessionData?.estado,
    ) || "",
  )
    .toLowerCase()
    .trim();

  /*
   * Resultado de IA.
   *
   * "bienestar" es un campo REAL del resultado del modelo en el
   * flujo actual. No debe confundirse con una etiqueta genérica.
   *
   * Se priorizan campos específicos de resultado y luego bienestar.
   */
  const resultadoRaw = obtenerPrimerValor(
    prediccion?.resultado,
    prediccion?.bienestar,
    prediccion?.prediction,
    prediccion?.prediccion,
    prediccion?.diagnostico,

    sesionData?.resultado_prediccion,
    sesionData?.bienestar,
    sesionData?.prediction,
    sesionData?.prediccion,

    rawData?.resultado_prediccion,
    rawData?.bienestar,
    rawData?.prediction,
    rawData?.prediccion,

    sessionData?.resultado_prediccion,
    sessionData?.bienestar,
    sessionData?.prediction,
    sessionData?.prediccion,
  );

  const resultadoNormalizado =
    resultadoRaw !== undefined && resultadoRaw !== null
      ? String(resultadoRaw).toLowerCase().trim()
      : "";

  /*
   * Si el propio resultado indica que la predicción está pendiente,
   * se mantiene como "IA evaluando".
   */
  const sesionEnProceso =
    ESTADOS_EN_PROCESO.has(estadoSesionRaw) ||
    ESTADOS_EN_PROCESO.has(resultadoNormalizado);

  let estado;
  let resultado;

  if (sesionEnProceso) {
    estado = "en_proceso";
    resultado = "IA evaluando";
  } else if (
    resultadoRaw === undefined ||
    resultadoRaw === null ||
    resultadoRaw === ""
  ) {
    estado = "no_disponible";
    resultado = "No disponible";
  } else {
    estado = "resultado";
    resultado = formatearPrediccion(resultadoRaw);
  }

  /*
   * Confianza del modelo.
   *
   * Se acepta tanto:
   *   confidence
   *   confianza
   *
   * y también las ubicaciones donde el backend puede entregar
   * estos valores.
   *
   * probability NO se utiliza como sustituto de confidence:
   * son métricas diferentes y no debemos confundirlas.
   */
  const confianzaRaw = obtenerPrimerValor(
    prediccion?.confidence,
    prediccion?.confianza,

    sesionData?.confidence,
    sesionData?.confianza,

    rawData?.confidence,
    rawData?.confianza,

    sessionData?.confidence,
    sessionData?.confianza,
  );

  const confianzaNumero =
    confianzaRaw !== undefined &&
    confianzaRaw !== null &&
    confianzaRaw !== ""
      ? Number(confianzaRaw)
      : NaN;

  const confianza =
    estado === "resultado" && Number.isFinite(confianzaNumero)
      ? `${(
          confianzaNumero > 1
            ? confianzaNumero
            : confianzaNumero * 100
        ).toFixed(1)}%`
      : "No disponible";

  /*
   * Observaciones del modelo.
   */
  const observacionesRaw = obtenerPrimerValor(
    prediccion?.observaciones,
    prediccion?.mensaje,

    sesionData?.observaciones,
    sesionData?.mensaje,

    rawData?.observaciones,
    rawData?.mensaje,

    sessionData?.observaciones,
    sessionData?.mensaje,
  );

  const observaciones =
    estado === "resultado"
      ? observacionesRaw !== undefined
        ? String(observacionesRaw)
        : "Sin observaciones adicionales del modelo."
      : estado === "en_proceso"
        ? "El modelo todavía está procesando esta sesión."
        : "El modelo no entregó observaciones para esta sesión.";

  /*
   * Para el tono visual:
   * SI / NO son resultados reales del modelo.
   *
   * No se modifica el texto mostrado.
   */
  const resultadoTexto = String(resultadoRaw || "").toLowerCase().trim();

  const esNegativo =
    estado === "resultado" &&
    (
      resultadoTexto === "no" ||
      resultadoTexto === "n" ||
      resultadoTexto === "false" ||
      resultadoTexto === "negativo" ||
      resultadoTexto.includes("no bienestar")
    );

  return {
    estado,
    resultado,
    confianza,
    observaciones,
    esNegativo,
  };
}

export const AVISO_IA =
  "Este resultado es una estimación generada por el modelo de análisis de EmotionLab. Es información de apoyo complementario y no corresponde a un diagnóstico médico ni reemplaza la evaluación profesional.";