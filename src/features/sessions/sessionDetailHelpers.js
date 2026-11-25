const STAGES = [
  { id: "inicial", label: "Etapa inicial" },
  { id: "facil", label: "Experiencia fácil" },
  { id: "dificil", label: "Experiencia difícil" },
];

function responseStage(response) {
  const value = [response?.etapa, response?.fase, response?.modo, response?.escena, response?.scene]
    .filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/dificil|salon|hard/.test(value)) return "dificil";
  if (/facil|oficina|easy/.test(value)) return "facil";
  if (/inicial|waiting|pre|inicio/.test(value)) return "inicial";
  return "sin_etapa";
}

export function groupOriginalResponses(responses = []) {
  const groups = [...STAGES.map((stage) => ({ ...stage, responses: [] })), { id: "sin_etapa", label: "Etapa sin identificar", responses: [] }];
  responses.forEach((response, index) => {
    groups.find((group) => group.id === responseStage(response)).responses.push({ ...response, _originalIndex: index });
  });
  return groups.filter((group) => group.responses.length > 0);
}

const PERSONAL_RESPONSE_IDS = new Set(["edad", "genero", "gender", "age", "nombre", "name"]);

export function nonPersonalOriginalResponses(responses = []) {
  return responses.filter((response) => {
    const id = String(response?.idPregunta || response?.id_pregunta || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    return !PERSONAL_RESPONSE_IDS.has(id);
  });
}

const EVENT_LABELS = {
  session_started: "Sesión iniciada",
  modo_completado: "Modo completado",
  visita_retroalimentacion: "Visita a la retroalimentación",
  breathing_technique_used: "Técnica de respiración utilizada",
  session_completed: "Sesión finalizada",
};

export function describeSessionEvent(event) {
  const raw = String(event?.nombre || event?.event || event?.tipo || event?.event_name || "Evento registrado");
  return EVENT_LABELS[raw] || raw.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export function chronologicalEvents(events = []) {
  return events.map((event, index) => ({ ...event, _originalIndex: index }))
    .sort((left, right) => {
      const a = Date.parse(left?.timestamp || left?.created_at || "");
      const b = Date.parse(right?.timestamp || right?.created_at || "");
      if (Number.isFinite(a) && Number.isFinite(b)) return a - b || left._originalIndex - right._originalIndex;
      if (Number.isFinite(a)) return -1;
      if (Number.isFinite(b)) return 1;
      return left._originalIndex - right._originalIndex;
    });
}

export function formatElapsed(start, end) {
  const seconds = (Date.parse(end || "") - Date.parse(start || "")) / 1000;
  if (!Number.isFinite(seconds) || seconds < 0) return "Sin registrar";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`;
}
