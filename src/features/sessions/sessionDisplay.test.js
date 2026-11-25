import test from "node:test";
import assert from "node:assert/strict";
import { getResponsesForDisplay } from "./sessionDisplay.js";

function capturedRecord(answer) {
  return {
    identity: "unity-record-1",
    unity_session_id: "unity-session-1",
    record: { session_data: { respuestas: [answer] } },
  };
}

test("shows the normalized answer recorded for the V8 input", () => {
  const raw = capturedRecord({ escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuestaLabel: "9", respuestaIndex: 0 });
  const result = getResponsesForDisplay({ records: [raw] }, {
    response_normalization: { records: [{
      record_index: 0,
      answers: [{ position: 0, escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuesta_normalizada: 1, status: "normalized" }],
    }] },
  });

  assert.equal(result[0]._displayRespuestaLabel, "1");
  assert.equal(raw.record.session_data.respuestas[0].respuestaLabel, "9");
});

test("clearly marks a mapped answer that could not be normalized", () => {
  const result = getResponsesForDisplay({ records: [capturedRecord({
    escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuestaLabel: "9", respuestaIndex: 7,
  })] }, {
    response_normalization: { records: [{
      record_index: 0,
      answers: [{ position: 0, escena: "waiting_room_inicial", idPregunta: "sentir_hoy", status: "not_normalized" }],
    }] },
  });

  assert.equal(result[0]._displayRespuestaLabel, "No se pudo normalizar");
  assert.equal(result[0]._normalizacionFallida, true);
});

test("uses per-record normalization metadata when the model summary is absent", () => {
  const raw = capturedRecord({ escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuestaLabel: "9", respuestaIndex: 0 });
  raw.response_normalization = {
    version: "unity-inverted-1-to-9-v1",
    status: "normalized",
    answers: [{ position: 0, escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuesta_normalizada: 1, status: "normalized" }],
  };
  const result = getResponsesForDisplay({ records: [raw] }, {});

  assert.equal(result[0]._displayRespuestaLabel, "1");
});

test("keeps historical values as received when there is no normalization audit", () => {
  const raw = capturedRecord({ escena: "waiting_room_inicial", idPregunta: "sentir_hoy", respuestaLabel: "9" });
  const result = getResponsesForDisplay({ records: [raw] }, { model_version: "1.0.0-experimental" });

  assert.equal(result[0].respuestaLabel, "9");
  assert.equal(result[0]._displayRespuestaLabel, undefined);
});
