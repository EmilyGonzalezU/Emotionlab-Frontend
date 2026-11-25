import assert from "node:assert/strict";
import React from "react";
import { after, before, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import react from "@vitejs/plugin-react";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let vite;
let tempViteCache;
let AiResultCard;
before(async () => {
  tempViteCache = mkdtempSync(join(tmpdir(), "emotionlab-vite-ssr-"));
  vite = await createServer({ configFile: false, root, cacheDir: join(tempViteCache, "cache"), plugins: [react()], mode: "development", server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
  ({ default: AiResultCard } = await vite.ssrLoadModule("/src/features/sessions/AiResultCard.jsx"));
});
after(async () => {
  await vite?.close();
  if (tempViteCache) rmSync(tempViteCache, { recursive: true, force: true });
});
function render(model) {
  return renderToStaticMarkup(React.createElement(AiResultCard, { sesionData: { session_id: "fixture-session", model_processing: model } }));
}

const complete = {
  model_version: "1.0.0-experimental", algorithm: "KMeans", n_clusters: 2,
  version_contrato: "1.1.0-experimental", status: "analyzed", grupo: 0,
  prediction: { group: 0, n_clusters: 2 }, perfil_tension: "mayor_tension_relativa",
  indice_relativo_centroides: 100, observadas: 12, estimadas: [], variables_sin_datos_suficientes: [],
  variables_originales: { estado_pre: 9, nerviosismo_pre: 5, preocupacion_pre: 7, preparacion_pre: 9, estado_facil: 9, nerviosismo_facil: 2, satisfaccion_facil: 6, alivio_facil: 9, estado_dificil: 1, nerviosismo_dificil: 7, satisfaccion_dificil: 7, alivio_dificil: 9 },
  variables_procesadas: { estado_pre: 9, nerviosismo_pre: 5, preocupacion_pre: 7, preparacion_pre: 9, estado_facil: 9, nerviosismo_facil: 2, satisfaccion_facil: 6, alivio_facil: 9, estado_dificil: 1, nerviosismo_dificil: 7, satisfaccion_dificil: 7, alivio_dificil: 9 },
  tension_index: { status: "pending_validation", value: null },
  session_id: "fixture-session", model_artifact_sha256: "a".repeat(64), scaler_artifact_sha256: "b".repeat(64),
};

test("V8 complete prioritizes its relative profile and keeps trace details secondary", () => {
  const html = render(complete);
  assert.match(html, /Mayor.*tensi.n relativa/);
  assert.match(html, /Grupo 0/);
  assert.match(html, /resultado exploratorio/);
  assert.match(html, /Detalles del an.lisis/);
  assert.match(html, /12 de 12/);
  assert.match(html, /Variables originales mapeadas por V8 \(12\)/);
  assert.match(html, /scaler Joblib/);
  assert.match(html, /no constituye un diagn.stico/i);
  assert.doesNotMatch(html, /tension_index|ndice de tensi.n|Bienestar global descriptivo|Indicador inicial|Clasificaci.n final/);
});

test("V8 insufficient data never assigns a group or shows an old model classification", () => {
  const html = render({
    model_version: "1.0.0-experimental", algorithm: "KMeans", n_clusters: 2,
    status: "insufficient_data", grupo: null, prediction: { group: null, n_clusters: 2 },
    observadas: 4, estimadas: [], variables_sin_datos_suficientes: ["estado_facil"],
    variables_originales: { estado_pre: 9, nerviosismo_pre: 5, preocupacion_pre: 7, preparacion_pre: 9 },
    variables_procesadas: null, tension_index: { status: "pending_validation", value: null },
    classification_final: 1, wellbeing: { valido: true, promedio: 8 },
  });
  assert.match(html, /Datos insuficientes/);
  assert.match(html, /Sin asignar/);
  assert.match(html, /estado_facil/);
  assert.match(html, /4 de 12/);
  assert.doesNotMatch(html, /Grupo 1|>8<|bienestar|se requieren las cuatro respuestas/i);
});
