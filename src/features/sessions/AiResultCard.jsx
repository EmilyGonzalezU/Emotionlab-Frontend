import React from "react";
import { FiCheckCircle, FiAlertTriangle, FiClock, FiInfo } from "react-icons/fi";
import Badge from "../../ui/Badge.jsx";
import { interpretarResultadoIA, AVISO_IA } from "./predictionHelpers.js";
import "./AiResultCard.css";

const ESTADO_UI = {
  resultado_positivo: { tone: "success", Icon: FiCheckCircle },
  resultado_negativo: { tone: "warning", Icon: FiAlertTriangle },
  en_proceso: { tone: "brand", Icon: FiClock },
  no_disponible: { tone: "neutral", Icon: FiInfo },
};

/**
 * Presenta el resultado de IA de una sesión, siempre en uno de estos
 * cuatro estados explícitos — nunca un quinto estado "inventado":
 *
 *   1. Resultado disponible  -> Badge de éxito/atención + valor real
 *   2. Predicción pendiente  -> "IA evaluando"
 *   3. Resultado no disponible -> "No disponible"
 *   4. (el backend no expone hoy un estado de error distinto de
 *      "pendiente"/"no disponible" — ver nota en el informe de Fase 3)
 *
 * La IA no diagnostica: el aviso de responsabilidad se muestra
 * siempre, no solo cuando hay resultado.
 */
export default function AiResultCard({ sesionData }) {
  const { estado, resultado, confianza, observaciones, esNegativo } =
    interpretarResultadoIA(sesionData);

  const claveEstado =
    estado === "resultado" ? (esNegativo ? "resultado_negativo" : "resultado_positivo") : estado;
  const { tone, Icon } = ESTADO_UI[claveEstado] || ESTADO_UI.no_disponible;

  return (
    <div className="el-ai-result">
      <div className="el-ai-result-headline">
        <Icon className="el-ai-result-icon" aria-hidden="true" />
        <Badge tone={tone}>{resultado}</Badge>
      </div>

      <dl className="el-ai-result-details">
        <div>
          <dt>Confianza</dt>
          <dd>{confianza}</dd>
        </div>
        <div>
          <dt>Observaciones</dt>
          <dd>{observaciones}</dd>
        </div>
      </dl>

      <p className="el-ai-result-disclaimer">
        <FiInfo aria-hidden="true" />
        <span>{AVISO_IA}</span>
      </p>
    </div>
  );
}
