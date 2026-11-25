import React, { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/apiClient.js";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";

export default function ParticipantsPage() {
  const [items, setItems] = useState([]), [query, setQuery] = useState(""), [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState(""), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const load = useCallback(async (term = "") => { setLoading(true); setError(""); try { const data = await api.get(term.trim() ? `/participants/search?name=${encodeURIComponent(term.trim())}` : "/participants"); setItems(Array.isArray(data) ? data : []); } catch (e) { setError(e?.message || "No se pudieron cargar los participantes."); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const open = async (id) => { setError(""); try { const p = await api.get(`/participants/${encodeURIComponent(id)}`); setSelected(p); setNotes(p.observaciones || ""); } catch(e) { setError(e?.message || "No se pudo cargar el detalle."); } };
  const save = async () => { if (!selected || notes.length > 2000) return; setSaving(true); setError(""); setMessage(""); try { await api.patch(`/participants/${encodeURIComponent(selected.participant_id)}`, { observaciones: notes }); setMessage("Observaciones guardadas."); await open(selected.participant_id); } catch(e) { setError(e?.message || "No se pudieron guardar los cambios."); } finally { setSaving(false); } };
  const search = (e) => { e.preventDefault(); setSelected(null); load(query); };
  const create = async (e) => { e.preventDefault(); setError(""); setMessage(""); try { const p = await api.post("/participants", { nombre: newName }); setNewName(""); setMessage(`Participante creado: ${p.participant_id}`); await load(query); } catch(e) { setError(e?.message || "No se pudo crear el participante."); } };
  return <div><PageHeader title="Participantes" description="Participantes vinculados a tus sesiones. La búsqueda respeta los permisos del servidor." actions={<Button variant="secondary" size="sm" onClick={() => load(query)} loading={loading}>Actualizar</Button>} />
    <form onSubmit={search} style={{display:"flex",gap:8,marginBottom:16}}><input aria-label="Buscar participante" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre" maxLength={150}/><Button type="submit" loading={loading}>Buscar</Button></form>
    <form onSubmit={create} style={{display:"flex",gap:8,marginBottom:20}}><label>Crear participante (dos nombres y dos apellidos)<input aria-label="Nombre completo del participante" value={newName} onChange={e=>setNewName(e.target.value)} maxLength={150} required placeholder="Nombre Nombre Apellido Apellido" /></label><Button type="submit" disabled={newName.trim().split(/\s+/).length !== 4}>Crear</Button></form>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}{loading ? <SkeletonRows rows={5} columns={4} /> : items.length === 0 ? <p>No hay participantes disponibles con esos criterios.</p> : <div style={{overflowX:"auto"}}><table className="el-table"><thead><tr><th>ID</th><th>Nombre</th><th>Observaciones</th><th></th></tr></thead><tbody>{items.map(p=><tr key={p.participant_id}><td>{p.participant_id}</td><td>{p.nombre}</td><td>{p.observaciones || "—"}</td><td><button type="button" onClick={()=>open(p.participant_id)}>Detalle</button></td></tr>)}</tbody></table></div>}
    {selected && <section aria-label="Detalle del participante" style={{marginTop:24}}><h2>{selected.nombre}</h2><p>ID: {selected.participant_id}</p><label>Observaciones (máximo 2000 caracteres)<textarea value={notes} maxLength={2000} onChange={e=>setNotes(e.target.value)} /></label><Button onClick={save} loading={saving} disabled={saving}>Guardar observaciones</Button></section>}
  </div>;
}
