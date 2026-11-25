import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createReportRequest,
  createTrackingReportRequest,
  fetchMyReportRequests,
  fetchPendingReportRequests,
  fetchReportDownloadUrl,
  fetchUsers,
  reviewReportRequest,
} from "./reportsApi.js";

const avisosInformesListos = new Set();

/**
 * Hooks de React Query para Reportes (Fase 4). Mismo criterio de
 * adopción que features/sessions/useSessions.js: se usa donde el
 * beneficio es concreto y acotado — la cola de pendientes y la
 * revisión del administrador se refrescan solas tras aprobar/
 * rechazar, y la solicitud propia del especialista se refresca tras
 * pedir un reporte, sin refetch manual repetido en cada pantalla.
 *
 * Query keys:
 *   ["reportRequests", "mine"]        -> solicitudes propias del especialista
 *   ["reportRequests", "pending"]     -> cola de revisión del administrador
 *   ["users"]                         -> usuarios registrados (solo para
 *                                         identificar al especialista solicitante)
 */
export function useMyReportRequests({ enabled = true } = {}) {
  const estadosPrevios = useRef(null);
  const query = useQuery({
    queryKey: ["reportRequests", "mine"],
    queryFn: fetchMyReportRequests,
    staleTime: 5_000,
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    const requests = Array.isArray(query.data) ? query.data : query.data?.items || [];
    const estadosActuales = new Map();
    for (const request of requests) {
      const id = request.report_request_id || request.request_id || request.id;
      if (!id) continue;
      const status = String(request.status || "").toUpperCase();
      const idKey = String(id);
      const estadoAnterior = estadosPrevios.current?.get(idKey);
      if (status === "REJECTED" && estadoAnterior && estadoAnterior !== "REJECTED") {
        const reason = request.rejection_reason || request.reason;
        toast.error(`Tu solicitud de informe fue rechazada.${reason ? ` Motivo: ${reason}` : ""}`, { duration: 8000 });
      }
      estadosActuales.set(idKey, status);
      if (status !== "COMPLETED" || request.downloaded_at || avisosInformesListos.has(id)) continue;
      avisosInformesListos.add(id);
      const resource = request.report_type === "TRACKING"
        ? `el seguimiento ${request.tracking_code || request.tracking_id || "solicitado"}`
        : `la sesión ${request.session_id || "solicitada"}`;
      toast.success(`Se aprobó la descarga de: ${resource}. El informe está listo para descargar.`, { duration: 7000 });
    }
    estadosPrevios.current = estadosActuales;
  }, [query.data]);
  return query;
}

export function useCreateReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, motivo }) => createReportRequest(sessionId, motivo),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "mine"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "pending"], refetchType: "all" }),
      ]);
    },
  });
}

export function useCreateTrackingReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackingId, reportFormat }) => createTrackingReportRequest(trackingId, reportFormat),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "mine"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "pending"], refetchType: "all" }),
      ]);
    },
  });
}

export function usePendingReportRequests({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["reportRequests", "pending"],
    queryFn: fetchPendingReportRequests,
    enabled,
  });
}

export function useReviewReportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved, reason }) => reviewReportRequest(id, { approved, reason }),
    onSuccess: async () => {
      // Reforzar invalidación + refetch para que el cambio sea
      // inmediatamente visible tanto para el admin como para el
      // especialista (REJECTED / APPROVED debe aparecer sin F5).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "pending"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "mine"], refetchType: "all" }),
      ]);
    },
  });
}

export function useUsersDirectory() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

/**
 * Pide una URL de descarga nueva cada vez (nunca se cachea como
 * query: es un recurso de un solo uso, válido 300 segundos).
 *
 * Tras una descarga exitosa se invalidan las solicitudes propias
 * para que el backend refleje downloaded_at y el estado actual
 * sin necesitar F5.
 */
export function useReportDownloadUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetchReportDownloadUrl(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "mine"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reportRequests", "pending"], refetchType: "all" }),
      ]);
    },
  });
}
