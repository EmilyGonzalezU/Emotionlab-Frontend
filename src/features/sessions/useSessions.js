import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessionDetail,
  fetchSessions,
  importSessions,
  updateSessionStudentName,
} from "./sessionsApi.js";

/**
 * Hooks de React Query para Sesiones. Primera adopción real de
 * React Query en la app (el QueryClientProvider ya estaba montado
 * desde la Fase 0, pero ninguna pantalla lo usaba todavía).
 *
 * Se adopta aquí porque el beneficio es concreto y acotado: listado y
 * detalle de sesión se piden en más de una pantalla / con más de un
 * disparador (import de sesiones, edición de nombre, navegación
 * entre lista y detalle), y React Query evita refetch manual y
 * duplicado en cada uno de esos casos. No se migra el resto de la
 * app — Cuenta, Auditoría, Usuarios, etc. siguen con su propio fetch
 * o con apiClient directo.
 *
 * Query keys:
 *   ["sessions"]              -> listado completo
 *   ["sessions", id]          -> detalle de una sesión
 *
 * (Los hooks de solicitudes de reporte — useMyReportRequests y
 * useCreateReportRequest — vivían aquí en la Fase 3 y se movieron a
 * features/reports/useReports.js en la Fase 4, junto con el resto del
 * flujo de reportes.)
 */
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
}

export function useImportSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useSessionDetail(id) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => fetchSessionDetail(id),
    enabled: Boolean(id),
  });
}

export function useUpdateStudentName(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nombre) => updateSessionStudentName(id, nombre),
    onSuccess: () => {
      // El backend es la fuente de verdad del nombre guardado; se
      // vuelve a pedir el detalle en vez de asumir localmente que el
      // valor enviado quedó exactamente así guardado.
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
    },
  });
}
