import { useCallback, useEffect, useRef, useState } from "react";
import { FiRefreshCw, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import { getV8SessionSummary } from "../sessions/sessionModelDisplay.js";
import Button from "../../ui/Button.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonPage } from "../../ui/LoadingState.jsx";
import {
  addTrackingSessions,
  createTracking,
  deleteTracking,
  fetchAvailableSessions,
  fetchTrackingCode,
  fetchTrackings,
  removeTrackingSession,
} from "./trackingsApi.js";
import "./TrackingsPage.css";
import TrackingCardItem from "./TrackingCardItem.jsx";

const sessionLabel = (session) => `${session.session_id} · ${session.fecha || "Fecha no disponible"}${session.hora ? ` ${session.hora}` : ""}`;

const sessionOptionLabel = (session) => {
  const result = getV8SessionSummary(session);
  const modelLabel = result.group === null
    ? (result.isV8 ? result.statusLabel : "Sin resultado del cálculo")
    : `Grupo ${result.group} · cálculo con IA`;
  return `${sessionLabel(session)} ? ${modelLabel}`;
};
export default function TrackingsPage() {
  const [trackings, setTrackings] = useState([]);
  const [available, setAvailable] = useState([]);
  const [reloadTokens, setReloadTokens] = useState({});
  const [chosen, setChosen] = useState([]);
  const [code, setCode] = useState("");
  const [initialSession, setInitialSession] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addTracking, setAddTracking] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");
  const [removingTracking, setRemovingTracking] = useState(null);
  const [deletingTracking, setDeletingTracking] = useState(null);
  const codeRequestPending = useRef(false);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [trackingData, availableData] = await Promise.all([fetchTrackings(), fetchAvailableSessions()]);
      const rows = Array.isArray(trackingData) ? trackingData : trackingData?.items || [];
      setTrackings(rows);
      setAvailable(Array.isArray(availableData) ? availableData : availableData?.items || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las colecciones de experiencias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  async function refreshAll() {
    await refresh();
    setReloadTokens((current) => Object.fromEntries(trackings.map((item) => [
      item.tracking_id,
      {
        token: (current[item.tracking_id]?.token || 0) + 1,
        expectedSessions: [],
        excludedSessionIds: [],
      },
    ])));
  }

  function reloadTracking(trackingId, { expectedSessions = [], excludedSessionIds = [] } = {}) {
    setReloadTokens((current) => ({
      ...current,
      [trackingId]: {
        token: (current[trackingId]?.token || 0) + 1,
        expectedSessions,
        excludedSessionIds,
      },
    }));
  }

  function openAdd(tracking) {
    setAddTracking(tracking);
    setChosen([]);
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!code.trim() || !initialSession) return;
    setBusy(true); setError("");
    try {
      await createTracking(code.trim(), initialSession);
      setCode(""); setInitialSession("");
      setCreateOpen(false);
      await refresh();
    } catch (err) { setError(err.message || "No se pudo crear la colección."); }
    finally { setBusy(false); }
  }

  async function openCreate() {
    setCreateOpen(true); setError(""); setCodeMessage(""); setCode(""); setInitialSession("");
    await generateCode();
  }

  async function generateCode(event) {
    event?.preventDefault();
    if (codeRequestPending.current) return;
    codeRequestPending.current = true;
    const hadCode = Boolean(code);
    setCodeLoading(true); setError(""); setCodeMessage(""); setCode("");
    try {
      const result = await fetchTrackingCode();
      if (!result?.tracking_code) throw new Error("El backend no devolvió un código de seguimiento.");
      setCode(result.tracking_code);
      if (hadCode) setCodeMessage("Código actualizado.");
    } catch (err) {
      setCode("");
      setError(err.message || "No se pudo generar un código. Inténtalo nuevamente.");
    } finally {
      codeRequestPending.current = false;
      setCodeLoading(false);
    }
  }

  async function handleAdd() {
    if (!addTracking?.tracking_id || !chosen.length) return;
    setBusy(true); setError("");
    try {
      await addTrackingSessions(addTracking.tracking_id, chosen);
      const trackingId = addTracking.tracking_id;
      const expectedSessions = available.filter((session) => chosen.includes(session.session_id));
      setAddTracking(null);
      setChosen([]);
      setAvailable((current) => current.filter((session) => !chosen.includes(session.session_id)));
      reloadTracking(trackingId, { expectedSessions });
      await refresh();
    } catch (err) { setError(err.message || "No se pudieron incorporar las experiencias."); }
    finally { setBusy(false); }
  }

  async function handleRemove() {
    const { tracking, sessionId } = removingTracking || {};
    if (!tracking?.tracking_id || !sessionId) return;
    setBusy(true); setError("");
    try {
      await removeTrackingSession(tracking.tracking_id, sessionId);
      setRemovingTracking(null);
      reloadTracking(tracking.tracking_id, { excludedSessionIds: [sessionId] });
      await refresh();
    } catch (err) {
      setError(err.message || "No se pudo desvincular la experiencia.");
      setRemovingTracking(null);
    }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!deletingTracking?.tracking_id) return;
    setBusy(true); setError("");
    try { await deleteTracking(deletingTracking.tracking_id); setDeletingTracking(null); await refresh(); }
    catch (err) { setError(err.message || "No se pudo eliminar la colección."); setDeletingTracking(null); }
    finally { setBusy(false); }
  }

  return (
    <section className="el-trackings-page">
      <PageHeader title="Seguimiento" description="Revisa las experiencias asociadas y su evolución registrada." actions={<><Button icon={FiPlus} onClick={openCreate}>Crear seguimiento</Button><Button variant="secondary" icon={FiRefreshCw} onClick={refreshAll} loading={loading}>Actualizar</Button></>} />
      {error && <div className="el-trackings-error" role="alert"><span>{error}</span><Button variant="secondary" size="sm" onClick={() => refresh()}>Reintentar</Button></div>}

      <div className="el-trackings-cards" aria-live="polite">
        {loading && trackings.length === 0 ? <SkeletonPage variant="cards" showHeader={false} label="Cargando seguimientos" /> : trackings.length ? trackings.map((tracking) => (
          <TrackingCardItem
            key={tracking.tracking_id}
            tracking={tracking}
            reloadRequest={reloadTokens[tracking.tracking_id]}
            busy={busy}
            onAdd={openAdd}
            onRemove={(item, sessionId) => setRemovingTracking({ tracking: item, sessionId })}
            onDelete={setDeletingTracking}
          />
        )) : <EmptyState title="Aún no hay seguimientos" description="Crea un seguimiento para reunir sesiones y revisar su evolución en una tarjeta." />}
      </div>
      {createOpen && <div className="el-tracking-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy&&!codeLoading)setCreateOpen(false);}}><section className="el-tracking-modal" role="dialog" aria-modal="true" aria-labelledby="el-tracking-create-title"><button className="el-tracking-modal-close" onClick={()=>setCreateOpen(false)} aria-label="Cancelar y cerrar" disabled={busy||codeLoading}><FiX/></button><h2 id="el-tracking-create-title">Crear seguimiento</h2><form className="el-trackings-form" onSubmit={handleCreate}><label>Código generado por EmotionLab<div className="el-generated-code"><input value={codeLoading ? "Generando código…" : code} readOnly aria-label="Código de seguimiento generado"/><Button type="button" variant="secondary" size="sm" icon={FiRefreshCw} onClick={generateCode} loading={codeLoading}>Generar otro</Button></div></label>{codeMessage&&<p className="el-tracking-code-status" role="status">{codeMessage}</p>}{error&&<p className="el-tracking-modal-error" role="alert">{error}</p>}<label>Primera experiencia<select value={initialSession} onChange={event=>setInitialSession(event.target.value)} required><option value="">Selecciona una sesión procesada</option>{available.map(session=><option key={session.session_id} value={session.session_id}>{sessionOptionLabel(session)}</option>)}</select></label>{!available.length&&!loading&&<p className="el-trackings-hint">No hay sesiones disponibles que cumplan los requisitos de procesamiento.</p>}<div className="el-trackings-form-actions"><Button type="button" variant="ghost" onClick={()=>setCreateOpen(false)} disabled={busy||codeLoading}>Cancelar</Button><Button type="submit" icon={FiPlus} loading={busy} disabled={!available.length||!initialSession||!code||codeLoading}>Crear seguimiento</Button></div></form></section></div>}
      {addTracking && <div className="el-tracking-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setAddTracking(null);}}><section className="el-tracking-modal" role="dialog" aria-modal="true" aria-labelledby="el-tracking-add-title"><button className="el-tracking-modal-close" onClick={()=>setAddTracking(null)} aria-label="Cerrar" disabled={busy}><FiX/></button><h2 id="el-tracking-add-title">Agregar experiencias a {addTracking.tracking_code}</h2><div className="el-trackings-add"><span className="el-trackings-add-label">Selecciona las sesiones que quieras asociar</span><div className="el-trackings-session-options" role="group" aria-label="Sesiones disponibles">{available.length ? available.map((session) => {
        const result = getV8SessionSummary(session);
        const checked = chosen.includes(session.session_id);
        const label = result.group === null ? "Resultado no disponible" : `Grupo asignado: ${result.group}`;
        return <label className={`el-trackings-session-option${checked ? " is-selected" : ""}`} key={session.session_id}><input type="checkbox" checked={checked} onChange={() => setChosen((current) => checked ? current.filter((id) => id !== session.session_id) : [...current, session.session_id])} /><span><strong>{session.session_id}</strong><small>{session.fecha || "Fecha no disponible"} · {label}</small></span></label>;
      }) : <p className="el-trackings-no-available">No hay sesiones disponibles para asociar.</p>}</div><div className="el-trackings-add-footer"><span>{chosen.length} seleccionada{chosen.length === 1 ? "" : "s"}</span><Button size="sm" icon={FiPlus} onClick={handleAdd} disabled={!chosen.length} loading={busy}>Agregar sesiones</Button></div></div></section></div>}
      <ConfirmationDialog
        open={Boolean(removingTracking)}
        title="Desvincular sesión"
        message="La sesión dejará de pertenecer a este seguimiento. La sesión original y sus resultados se conservarán."
        confirmLabel="Desvincular"
        cancelLabel="Cancelar"
        tone="danger"
        loading={busy}
        onConfirm={handleRemove}
        onCancel={() => { if (!busy) setRemovingTracking(null); }}
      />
      <ConfirmationDialog
        open={Boolean(deletingTracking)}
        title="Eliminar seguimiento"
        message={`Se eliminará el seguimiento ${deletingTracking?.tracking_code || "seleccionado"}. Las sesiones originales y sus resultados se conservarán.`}
        confirmLabel="Eliminar seguimiento"
        cancelLabel="Cancelar"
        tone="danger"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => { if (!busy) setDeletingTracking(null); }}
      />
    </section>
  );
}
