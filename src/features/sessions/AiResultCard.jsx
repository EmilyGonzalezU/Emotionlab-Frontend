import React from "react";
import { FiCheckCircle, FiAlertTriangle, FiClock, FiInfo } from "react-icons/fi";
import Badge from "../../ui/Badge.jsx";
import "./AiResultCard.css";

const V8_VERSION = "1.0.0-experimental";
const LABELS = {
  analyzed: "Cálculo con IA completado",
  insufficient_data: "Datos insuficientes",
  processing_error: "Error en el cálculo",
  error: "Error en el cálculo",
  pending: "Cálculo pendiente",
  unavailable: "Resultado del cálculo no disponible",
  capturing: "Sesión en proceso",
  finalizing: "Finalizando sesión",
  importing: "Recuperando registros",
  captured: "Sesión recopilada",
};
// Nombres comprensibles para cualquier persona; no son diagnósticos.
const PROFILES = {
  mayor_tension_relativa: "Tendencia a mayor tensión emocional",
  menor_tension_relativa: "Tendencia a menor tensión emocional",
};

function V8Result({ model, analyzed }) {
  const group = model.prediction?.group ?? model.grupo;
  const groupIsValid = analyzed && Number.isInteger(group) && group >= 0 && group <= 1;
  const profileLabel = groupIsValid
    ? (PROFILES[model.perfil_tension] || "Descripción del grupo no disponible")
    : null;
  const observed = Number.isInteger(model.observadas) ? model.observadas + " de 12" : "No informado";
  const missing = Array.isArray(model.variables_sin_datos_suficientes) ? model.variables_sin_datos_suficientes : [];
  const normalization = model.response_normalization;

  return <>
    {groupIsValid ? <div className="el-ai-result-profile"><span>{profileLabel}</span><small>Grupo {group}</small></div> : <p className="el-ai-result-no-profile">{model.status === "insufficient_data" ? "No hay datos suficientes para asignar un grupo." : "Este análisis todavía no tiene un resultado disponible."}</p>}
    {missing.length > 0 && <p className="el-ai-result-disclaimer"><FiInfo aria-hidden="true"/><span>Faltan respuestas para completar algunos datos: {missing.join(", ")}.</span></p>}
    {!analyzed && model.status === "insufficient_data" && <p className="el-ai-result-disclaimer"><FiInfo aria-hidden="true"/><span>No se asignó un grupo porque los datos disponibles no permiten completar las variables requeridas.</span></p>}
    {normalization && <p className="el-ai-result-disclaimer"><FiInfo aria-hidden="true"/><span>Este grupo resume el patrón de respuestas de esta sesión: el grupo 0 suele relacionarse con más tensión y el grupo 1 con menos. Puede servir como punto de partida para conversar sobre cómo se vivió la experiencia, teniendo en cuenta lo ocurrido durante la sesión.</span></p>}
    <details className="el-ai-result-variables">
      <summary>Detalles del cálculo</summary>
      <dl className="el-ai-result-details">
        <div><dt>Grupo asignado</dt><dd>{groupIsValid ? group : "Sin asignar"}</dd></div>
        <div><dt>Respuestas utilizadas</dt><dd>{observed}</dd></div>
      </dl>
    </details>
    <p className="el-ai-result-disclaimer el-ai-result-support-note"><FiInfo aria-hidden="true"/><span>Este cálculo es información de apoyo complementaria. No constituye un diagnóstico.</span></p>
  </>;
}

function LegacyResult({ model, analyzed }) {
  return <>
    <p className="el-ai-result-no-profile">{analyzed || Object.keys(model).length ? "Este resultado corresponde a un cálculo anterior y no se puede mostrar en este formato." : "No hay un cálculo complementario disponible para esta sesión."}</p>
  </>;
}

export default function AiResultCard({ sesionData }) {
  const model = sesionData?.model_processing || sesionData?.raw_data?.model_processing || {};
  const status = model.status || sesionData?.ai_status || "unavailable";
  const analyzed = status === "analyzed";
  const failed = ["processing_error", "error"].includes(status);
  const v8 = model.model_version === V8_VERSION && model.algorithm === "KMeans" && model.n_clusters === 2;
  const Icon = analyzed ? FiCheckCircle : failed ? FiAlertTriangle : status === "pending" ? FiClock : FiInfo;
  const error = failed;
  return <div className="el-ai-result">
    <div className="el-ai-result-headline"><Icon className="el-ai-result-icon" aria-hidden="true"/><Badge tone={analyzed ? "success" : failed ? "warning" : "neutral"}>{LABELS[status] || "Estado de análisis no disponible"}</Badge></div>
    {v8 ? <V8Result model={model} analyzed={analyzed}/> : <LegacyResult model={model} analyzed={analyzed}/>}
    {error && <p className="el-ai-result-disclaimer"><FiAlertTriangle aria-hidden="true"/><span>No se pudo completar el cálculo complementario. La información de la sesión se conserva.</span></p>}
  </div>;
}
