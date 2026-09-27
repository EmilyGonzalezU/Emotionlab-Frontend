import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReportRequest,
  fetchMyReportRequests,
  fetchPendingReportRequests,
  fetchReportDownloadUrl,
  fetchSessionContextForAdmin,
  fetchUsers,
  reviewReportRequest,
} from "./reportsApi.js";

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
 *                                         cruzar el nombre del especialista)
 *   ["sessions", "adminContext", id]  -> contexto de sesión para la
 *                                         revisión del administrador
 */
export function useMyReportRequests() {
  return useQuery({
    queryKey: ["reportRequests", "mine"],
    queryFn: fetchMyReportRequests,
  });
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

export function usePendingReportRequests() {
  return useQuery({
    queryKey: ["reportRequests", "pending"],
    queryFn: fetchPendingReportRequests,
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

export function useSessionContextForAdmin(sessionId) {
  return useQuery({
    queryKey: ["sessions", "adminContext", sessionId],
    queryFn: () => fetchSessionContextForAdmin(sessionId),
    enabled: Boolean(sessionId),
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
