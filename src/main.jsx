import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx"; // aca importamos la funcion App de app.jsx que tiene toda la lógica de rutas
import { AuthProvider } from "./context/AuthContext.jsx";

// Cliente único de React Query (Fase 0). Las pantallas existentes no
// cambian todavía: se migran gradualmente a hooks de React Query en
// las fases siguientes, en vez de sus `fetch` manuales actuales.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// creamos un root, aca se llama el root del index html, hace qye todo lo que creamos se vea en la pantalla
createRoot(document.getElementById("root")).render(
  // el strict mode slo hace que avisa si hay codigo desctualizado o problemas
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
