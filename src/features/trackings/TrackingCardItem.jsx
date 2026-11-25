import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Button from "../../ui/Button.jsx";
import { fetchSessionDetail } from "../sessions/sessionsApi.js";
import { validateTrackingDemographics } from "./trackingAnalysis.js";
import { fetchTrackingData, fetchTrackingSessionDetails } from "./trackingData.js";
import { fetchTrackingEvolution, fetchTrackingSessions } from "./trackingsApi.js";
import TrackingOverviewCard from "./TrackingOverviewCard.jsx";

export default function TrackingCardItem({ tracking, reloadRequest, busy, onAdd, onDelete, onRemove }) {
  const [sessions, setSessions] = useState([]);
  const [evolution, setEvolution] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [evolutionError, setEvolutionError] = useState(null);
  const [associationNotice, setAssociationNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEvolutionError(null);
    setAssociationNotice("");
    fetchTrackingData(tracking.tracking_id, fetchTrackingSessions, fetchTrackingEvolution, {
      expectedSessions: reloadRequest?.expectedSessions || [],
      excludedSessionIds: reloadRequest?.excludedSessionIds || [],
    })
      .then(async (result) => {
        const details = await fetchTrackingSessionDetails(result.sessions, fetchSessionDetail);
        if (!active) return;
        setSessions(result.sessions);
        setEvolution(result.evolution);
        setEvolutionError(result.evolutionError);
        if (result.missingExpected.length) {
          setAssociationNotice("La asociación se guardó. La lista de sesiones todavía se está actualizando.");
        } else if (result.excludedStillPresent.length) {
          setAssociationNotice("La desvinculación se guardó. La lista se está sincronizando y ya ocultamos esta sesión.");
        }
        setDetailsById(details);
      })
      .catch((error) => {
        if (!active) return;
        setEvolutionError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [tracking.tracking_id, reloadRequest, retryToken]);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);

  return (
    <TrackingOverviewCard
      trackingId={tracking.tracking_id}
      trackingCode={tracking.tracking_code}
      createdAt={tracking.created_at}
      sessions={sessions}
      evolution={evolution?.sessions || []}
      demographics={validateTrackingDemographics(sessions, detailsById)}
      evolutionError={evolutionError}
      associationNotice={associationNotice}
      loading={loading}
      onRemove={(sessionId) => onRemove(tracking, sessionId)}
      onRetry={retry}
      actions={(
        <>
          <Button variant="secondary" size="sm" icon={FiPlus} onClick={() => onAdd(tracking)} disabled={busy}>Agregar sesiones</Button>
          <Button variant="danger" size="sm" icon={FiTrash2} onClick={() => onDelete(tracking)} disabled={busy}>Eliminar</Button>
        </>
      )}
    />
  );
}
