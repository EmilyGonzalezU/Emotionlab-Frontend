import assert from "node:assert/strict";
import test from "node:test";

import { formatChileInstant, getExperiencePayloads } from "../src/features/sessions/sessionDisplay.js";
import { procesarSesionRaw } from "../src/features/sessions/sessionListHelpers.js";

test("ISO timestamps are presented in America/Santiago, independent of host timezone", () => {
  const timestamp = "2026-11-17T00:10:00Z";
  assert.equal(formatChileInstant(timestamp), "16-11-2026, 21:10");
  const session = procesarSesionRaw({ session_id: "synthetic", capture_started_at: timestamp }, 0);
  assert.equal(session.fechaISO, "2026-11-16");
  assert.equal(session.fechaFormateada, "16-11-2026, 21:10");
});

test("capture record envelope exposes Unity answers and events to the detail view", () => {
  const payloads = getExperiencePayloads({
    records: [{
      record: {
        session_data: {
          respuestas: [{ label: "5" }],
          eventos: [{ name: "start" }],
        },
      },
    }],
  });
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].respuestas.length, 1);
  assert.equal(payloads[0].eventos.length, 1);
});

test("legacy timestamps without timezone are left unconverted", () => {
  assert.equal(formatChileInstant("2026-11-16 21:10:00"), "2026-11-16 21:10:00");
});
