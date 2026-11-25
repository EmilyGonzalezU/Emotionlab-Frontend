import test from "node:test";
import assert from "node:assert/strict";
import { buildTrackingWorkbook, createTrackingPdf } from "../src/features/trackings/trackingExport.js";

test("XLSX workbook has five sheets and keeps all V8 variables in independent columns", async () => {
  const workbook = await buildTrackingWorkbook({
    tracking: { tracking_code: "SEG-ANON", created_at: "2026-01-01T00:00:00Z" },
    sessions: [{ session_id: "opaque-session-id", fecha: "2026-01-01", status: "analyzed" }],
    evolution: [{ session_id: "opaque-session-id", model_version: "1.0.0-experimental", observations: [
      { variable: "nerviosismo_pre", value: 5 },
    ] }],
    detailsById: { "opaque-session-id": { session_id: "opaque-session-id", model_processing: { model_version: "1.0.0-experimental", algorithm: "KMeans", status: "analyzed", grupo: 0 } } },
    demographics: { label: "Información insuficiente", sessions: [], differences: [] },
  });
  assert.deepEqual(workbook.SheetNames, ["Resumen", "Sesiones", "Respuestas Unity", "Cálculo con IA", "Validación"]);
  const answers = workbook.Sheets["Respuestas Unity"];
  assert.equal(answers.C2.v, 5);
  assert.equal(answers.D2.v, "");
  assert.equal(workbook.Sheets["Respuestas Unity"].N1.v, "preparacion_pre");
  assert.ok(workbook.Sheets["Cálculo con IA"].H2.v.includes('"grupo":0'));
});

test("PDF report generator creates a readable PDF document without downloading in tests", async () => {
  const pdf = await createTrackingPdf({
    tracking: { tracking_code: "SEG-ANON" },
    sessions: [],
    evolution: [],
    detailsById: {},
    demographics: { label: "Información insuficiente", differences: [], sessions: [], notice: "Sin datos" },
    generatedAt: new Date("2026-11-01T12:00:00Z"),
    download: false,
  });
  const bytes = pdf.output("arraybuffer");
  assert.ok(bytes.byteLength > 1000);
  assert.equal(pdf.getNumberOfPages(), 1);
});

test("PDF includes per-session original Unity and V8 data without exposing names", async () => {
  const pdf = await createTrackingPdf({
    tracking: { tracking_code: "SEG-ANON" },
    sessions: [{ session_id: "internal-id", fecha: "2026-10-12", hora: "10:00", status: "analyzed" }],
    evolution: [{ session_id: "internal-id", model_version: "1.0.0-experimental", observations: [{ dimension: "nerviosismo", phase: "PRE", variable: "nerviosismo_pre", value: 6 }] }],
    detailsById: { "internal-id": {
      session_id: "internal-id",
      model_processing: { model_version: "1.0.0-experimental", algorithm: "KMeans", status: "analyzed", grupo: 1 },
      student_data: { edad: "15", genero: "Femenino" },
      raw_data: { session_data: { respuestas: [
        { idPregunta: "nerviosismo", pregunta: "¿Te sientes nervioso?", respuestaLabel: "6", escena: "waiting_room_inicial" },
        { idPregunta: "nombre", pregunta: "Nombre", respuestaLabel: "No exportar" },
      ] } },
    } },
    demographics: { label: "Consistente", differences: [], sessions: [], notice: "Validación descriptiva" },
    generatedAt: new Date("2026-11-01T12:00:00Z"),
    download: false,
  });
  assert.ok(pdf.output("arraybuffer").byteLength > 2000);
  assert.ok(pdf.getNumberOfPages() >= 4, "incluye portada, gráfico de dimensión/fase, resumen de sesiones y detalle");
});
