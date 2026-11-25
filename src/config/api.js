const viteEnv = import.meta.env || {};
const configuredApiUrl = viteEnv.VITE_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error(
    "Falta VITE_API_URL. Configure la URL del API Gateway antes de compilar para producción."
  );
}

export const API_BASE_URL = configuredApiUrl;

export function getApiUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
