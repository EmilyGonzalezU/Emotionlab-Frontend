import { getApiUrl } from "../config/api.js";
import { clearAuthStorage } from "./authStorage.js";

/**
 * Error tipado para respuestas del backend. Permite distinguir un
 * error de red (status 0) de un error HTTP real (status del backend).
 */
export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

// Un 401 invalida la sesión; un 403 es una denegación de permisos y
// nunca debe cerrar una sesión válida.
function handleSessionExpired() {
  clearAuthStorage();
  window.dispatchEvent(new Event("emotionlab:session-expired"));
  window.location.hash = "#/";
}

/**
 * Cliente HTTP central para EmotionLab.
 *
 * Objetivo: reemplazar gradualmente los `fetch` manuales repetidos en
 * cada pantalla (armar headers, adjuntar token, parsear JSON, manejar
 * errores) por un único punto de entrada. No cambia ningún endpoint,
 * método ni forma del payload — es una envoltura, no una migración
 * de contrato.
 *
 * Los errores 401 limpian la sesión y la caché privada; los errores 403
 * se devuelven al consumidor sin alterar la autenticación.
 */
export async function apiRequest(
  path,
  { method = "GET", body, headers, skipAuth = false, responseType = "json" } = {},
) {
  const finalHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(getApiUrl(path), {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", {
      status: 0,
      data: null,
    });
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (responseType === "blob" && response.ok) {
    data = await response.blob();
  } else if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (response.status === 401 && !skipAuth) {
    handleSessionExpired();
  }

  if (!response.ok) {
    const message =
      data?.error || data?.message || `Error del servidor (${response.status})`;
    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};
