const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error(
    "Falta VITE_API_URL. Configure la URL del API Gateway antes de compilar para producción."
  );
}

export const API_BASE_URL = configuredApiUrl || "http://127.0.0.1:5000";

export function getApiUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
