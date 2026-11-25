import test from "node:test";
import assert from "node:assert/strict";
import { chronologicalEvents, describeSessionEvent, formatElapsed, groupOriginalResponses, nonPersonalOriginalResponses } from "../src/features/sessions/sessionDetailHelpers.js";
import { procesarSesionRaw } from "../src/features/sessions/sessionListHelpers.js";

test("groups every original Unity answer by stage without changing its text or order", () => {
  const responses = [
    { textoPregunta: "Q1", respuestaLabel: "9", escena: "waiting_room_inicial" },
    { textoPregunta: "Q2", respuestaLabel: "2", escena: "Retroalimentacion_Oficina" },
    { textoPregunta: "Q3", respuestaLabel: "7", escena: "Retroalimentacion_Salon" },
    { textoPregunta: "Q4", respuestaLabel: "dato", escena: "otra" },
  ];
  const groups = groupOriginalResponses(responses);
  assert.deepEqual(groups.map((group) => group.id), ["inicial", "facil", "dificil", "sin_etapa"]);
  assert.deepEqual(groups.map((group) => group.responses[0].respuestaLabel), ["9", "2", "7", "dato"]);
  assert.deepEqual(groups.map((group) => group.responses[0]._originalIndex), [0, 1, 2, 3]);
});

test("analysis detail excludes demographic and name responses while retaining emotional answers", () => {
  const responses = [
    { idPregunta: "edad", respuestaLabel: "+17" },
    { idPregunta: "genero", respuestaLabel: "Masculino" },
    { idPregunta: "nerviosismo", respuestaLabel: "5" },
    { id_pregunta: "nombre", respuestaLabel: "Participante" },
  ];
  assert.deepEqual(nonPersonalOriginalResponses(responses), [responses[2]]);
});

test("orders timestamped events and preserves event identifiers for display", () => {
  const sorted = chronologicalEvents([{ nombre: "session_completed", timestamp: "2026-01-01T02:00:00Z" }, { nombre: "session_started", timestamp: "2026-01-01T01:00:00Z" }]);
  assert.equal(sorted[0].nombre, "session_started");
  assert.equal(describeSessionEvent(sorted[0]), "Sesión iniciada");
  assert.equal(describeSessionEvent({ nombre: "new_event_type" }), "New event type");
});

test("duration uses only provided start/end instants and list searches can use student names", () => {
  assert.equal(formatElapsed("2026-01-01T00:00:00Z", "2026-01-01T00:02:04Z"), "2 min 4 s");
  assert.equal(formatElapsed(null, null), "Sin registrar");
  const session = procesarSesionRaw({ session_id: "session-1", nombre: "Emilia", status: "completed", capture_started_at: "2026-01-01T00:00:00Z", capture_ended_at: "2026-01-01T00:02:04Z" }, 0);
  assert.equal(session.nombre, "Emilia");
  assert.equal(session.estadoSesionLabel, "Completada");
  assert.equal(session.duracion, "2 min");
});
