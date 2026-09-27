import { useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "el_report_requests_read";

function leerStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function escribirStorage(datos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos || {}));
  } catch {
    // storage no disponible (modo privado, etc.) — se ignora silenciosamente
  }
}

function extraerId(solicitud) {
  return String(
    solicitud?.report_request_id ||
    solicitud?.request_id ||
    solicitud?.id ||
    ""
  );
}

export function marcarSolicitudVista(solicitud) {
  const id = extraerId(solicitud);
  if (!id) return;

  const estado = String(solicitud?.status || "").toUpperCase();
  const store = leerStorage();

  const revisadaEn = solicitud?.reviewed_at || null;

  store[id] = {
    status: estado,
    reviewed_at: revisadaEn ? new Date(revisadaEn).toISOString() : null,
    read_at: new Date().toISOString(),
  };

  escribirStorage(store);
}

export function esCambioNoVisto(solicitud, store) {
  const id = extraerId(solicitud);
  if (!id) return false;

  const estadoActual = String(solicitud?.status || "").toUpperCase();

  if (estadoActual === "PENDING") {
    return false;
  }

  const revisadaEn = solicitud?.reviewed_at
    ? new Date(solicitud.reviewed_at).toISOString()
    : null;

  const previo = store[id];
  if (!previo) {
    if (estadoActual === "APPROVED" || estadoActual === "REJECTED" || estadoActual === "COMPLETED") {
      return true;
    }
    return false;
  }

  if (previo.status !== estadoActual) {
    return true;
  }

  if (revisadaEn && (!previo.reviewed_at || previo.reviewed_at !== revisadaEn)) {
    return true;
  }

  return false;
}

export function useReadTracking(solicitudes) {
  const lista = solicitudes || [];

  const store = useMemo(() => leerStorage(), []);

  const contarNoVistos = useCallback(() => {
    const s = leerStorage();
    let cuenta = 0;
    lista.forEach((solicitud) => {
      if (esCambioNoVisto(solicitud, s)) {
        cuenta += 1;
      }
    });
    return cuenta;
  }, [lista]);

  const noVistos = useMemo(() => {
    let cuenta = 0;
    lista.forEach((solicitud) => {
      if (esCambioNoVisto(solicitud, store)) {
        cuenta += 1;
      }
    });
    return cuenta;
  }, [lista, store]);

  useEffect(() => {
    const onStorage = () => {
      // No es necesario forzar rerender; el store se recalcula al montar.
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    noVistos,
    contarNoVistos,
    marcarVista: marcarSolicitudVista,
  };
}
