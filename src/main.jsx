import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx"; // aca importamos la funcion App de app.jsx que tiene toda la lógica de rutas

// creamos un root, aca se llama el root del index html, hace qye todo lo que creamos se vea en la pantalla
createRoot(document.getElementById("root")).render(
  // el strict mode slo hace que avisa si hay codigo desctualizado o problemas
  <StrictMode>
    <App />
  </StrictMode>,
);
