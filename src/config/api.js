// URL base del backend. Viene de VITE_API_URL (Vite carga
// automáticamente .env.development en `npm run dev` y .env.production
// en `npm run build`, según el modo — no hace falta tocar
// vite.config.js para esto). Si por algún motivo la variable no está
// definida, se usa el backend local como respaldo para no romper el
// flujo de desarrollo existente.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export function getApiUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
