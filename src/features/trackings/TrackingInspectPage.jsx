import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchTracking, fetchTrackingEvolution, fetchTrackingSessions } from "./trackingsApi.js";
import { fetchSessionDetail } from "../sessions/sessionsApi.js";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonPage } from "../../ui/LoadingState.jsx";
import { trackingSessionsOf } from "./trackingData.js";
import TrackingDetailWorkspace from "./TrackingDetailWorkspace.jsx";
import "./TrackingsPage.css";

export default function TrackingInspectPage() {
  const { trackingId } = useParams();
  const queryClient = useQueryClient();
  const [data, setData] = useState({ tracking: null, sessions: [], evolution: [], detailsById: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData((current) => current.tracking?.tracking_id === trackingId
      ? { ...current, detailsById: null }
      : { tracking: null, sessions: [], evolution: [], detailsById: null });

    async function loadTracking() {
      try {
        const [tracking, sessionsResult] = await Promise.all([
          fetchTracking(trackingId),
          fetchTrackingSessions(trackingId),
        ]);
        if (!active) return;
        const sessions = trackingSessionsOf(sessionsResult);
        setData({ tracking, sessions, evolution: [], detailsById: null });
        setLoading(false);

        // Show the tracking and session list before optional chart/detail
        // hydration finishes. Cached session details are reused across routes.
        const [evolutionResult, detailResults] = await Promise.allSettled([
          fetchTrackingEvolution(trackingId),
          Promise.allSettled(sessions.map((session) => queryClient.fetchQuery({
            queryKey: ["sessions", session.session_id],
            queryFn: () => fetchSessionDetail(session.session_id),
            staleTime: 20_000,
            retry: false,
          }))),
        ]);
        if (!active) return;
        const settledDetails = detailResults.status === "fulfilled" ? detailResults.value : [];
        const detailsById = Object.fromEntries(settledDetails.map((result, index) => [
          sessions[index].session_id,
          result.status === "fulfilled" && result.value && typeof result.value === "object"
            ? result.value
            : { detail_error: true },
        ]));
        setData((current) => ({
          ...current,
          evolution: evolutionResult.status === "fulfilled" && Array.isArray(evolutionResult.value?.sessions)
            ? evolutionResult.value.sessions
            : [],
          detailsById,
        }));
        if (evolutionResult.status === "rejected") {
          setError({ message: "No se pudieron recuperar las observaciones del gr?fico.", status: evolutionResult.reason?.status });
        }
      } catch (fetchError) {
        if (active) {
          setData({ tracking: null, sessions: [], evolution: [], detailsById: null });
          setError({ message: fetchError?.message || "No se pudo cargar el seguimiento.", status: fetchError?.status });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTracking();
    return () => { active = false; };
  }, [trackingId, retryKey, queryClient]);

  return <section className="el-tracking-inspect-page">
    {error && <div className="el-trackings-error" role="alert"><span>{error.message}{Number.isInteger(error.status) && error.status > 0 ? ` (HTTP ${error.status})` : ""}</span><Button variant="secondary" size="sm" onClick={() => setRetryKey((value) => value + 1)}>Reintentar</Button></div>}
    {loading && data.tracking?.tracking_id !== trackingId ? <SkeletonPage variant="detail" label="Cargando detalle del seguimiento" /> : !data.tracking
      ? <EmptyState title="Seguimiento no disponible" description={error?.message || "No se pudo recuperar este seguimiento."} />
      : <TrackingDetailWorkspace
        tracking={data.tracking}
        sessions={data.sessions}
        evolution={data.evolution}
        detailsById={data.detailsById || {}}
        detailsLoading={data.detailsById === null}
        onRefresh={() => setRetryKey((value) => value + 1)}
        refreshing={loading}
      />}
  </section>;
}
