import assert from "node:assert/strict";
import test from "node:test";
import { getV8SessionSummary, isV8Model } from "../src/features/sessions/sessionModelDisplay.js";

const completeV8 = {
  model_version: "1.0.0-experimental",
  algorithm: "KMeans",
  n_clusters: 2,
  status: "analyzed",
  grupo: 0,
  prediction: { group: 0, n_clusters: 2 },
  indice_relativo_centroides: 100,
  observadas: 12,
  estimadas: [],
};

test("V8 session summary reads only the V8 group and centroid fields", () => {
  assert.equal(isV8Model(completeV8), true);
  const summary = getV8SessionSummary({ session_id: "s1", model_processing: completeV8 });
  assert.equal(summary.isV8, true);
  assert.equal(summary.statusLabel, "Cálculo con IA completado");
  assert.equal(summary.group, 0);
  assert.equal(summary.groupLabel, "Grupo 0");
  assert.equal(summary.centroidIndex, 100);
  assert.equal(summary.observed, 12);
  assert.equal(summary.estimatedCount, 0);
});

test("insufficient V8 data never displays a cluster from legacy fields", () => {
  const summary = getV8SessionSummary({
    model_processing: {
      ...completeV8,
      status: "insufficient_data",
      grupo: null,
      prediction: { group: null, n_clusters: 2 },
      classification_final: 1,
      indice_relativo_centroides: null,
      observadas: 4,
      estimadas: [],
      variables_sin_datos_suficientes: ["estado_facil"],
    },
  });
  assert.equal(summary.statusLabel, "Datos insuficientes");
  assert.equal(summary.group, null);
  assert.equal(summary.groupLabel, "—");
  assert.equal(summary.centroidIndex, null);
  assert.deepEqual(summary.missing, ["estado_facil"]);
});

test("legacy model data is not reinterpreted as V8", () => {
  const summary = getV8SessionSummary({
    model_processing: {
      status: "analyzed",
      classification_final: 1,
      prediction: { group: 1, n_clusters: 3 },
      bienestar_promedio: 8,
      indice_relativo_centroides: 99,
    },
  });
  assert.equal(summary.isV8, false);
  assert.equal(summary.statusLabel, "Formato anterior/no identificado");
  assert.equal(summary.group, null);
  assert.equal(summary.centroidIndex, null);
  assert.equal(summary.observed, null);
});
