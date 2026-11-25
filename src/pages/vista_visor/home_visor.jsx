import React, { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiCheckCircle, FiClock, FiLayers, FiRefreshCw } from "react-icons/fi";
import { api } from "../../lib/apiClient.js";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import { SkeletonPage } from "../../ui/LoadingState.jsx";
import "./home_visor.css";

// Paleta del gráfico: Recharts requiere colores concretos (no acepta var(--...)),
// por lo que se declaran aquí como constantes mapeadas a los tokens del design system.
const COLOR_GRUPO_0 = "#3B82F6"; // --color-info
const COLOR_GRUPO_1 = "#18A6A0"; // --color-accent

export default function HomeEspecialista() {
  const [data, setData] = useState({ summary: null, chart: [] });
  const [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError("");
    try {
      const [summary, chart] = await Promise.all([api.get("/dashboard"), api.get("/dashboard/chart")]);
      setData({ summary, chart: Array.isArray(chart) ? chart : [] });
    } catch (e) { setError(e?.message || "No se pudo cargar el panel del especialista."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const registered = (data.summary?.dates || []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  const classified = data.chart.reduce((sum, row) => sum + (Number(row.grupo_0) || 0) + (Number(row.grupo_1) || 0), 0);
  const chartRows = data.chart.map(row => ({ ...row, fechaLabel: row.fecha }));
  return <main className="home-container el-specialist-dashboard">
    <PageHeader title="Panel del especialista" description="Resumen de las experiencias registradas en tus sesiones." actions={<Button variant="secondary" size="sm" icon={FiRefreshCw} onClick={() => load(true)} loading={loading || refreshing}>Actualizar</Button>} />
    {error && <div role="alert" className="dashboard-error">{error}</div>}
    {loading ? <SkeletonPage variant="dashboard" showHeader={false} label="Cargando resumen del especialista" /> : !error && <>
      <section className="dashboard-cards">
        <article><span className="el-dashboard-card-icon"><FiLayers/></span><h2>Sesiones registradas</h2><strong>{registered}</strong><p>{data.summary?.dates?.length ?? 0} días con actividad; el total suma sesiones con fecha disponible</p></article>
        <article><span className="el-dashboard-card-icon"><FiCheckCircle/></span><h2>Sesiones clasificadas por V2</h2><strong>{classified}</strong></article>
        <article><span className="el-dashboard-card-icon"><FiClock/></span><h2>Sesiones de hoy</h2><strong>{data.summary?.today?.total ?? 0}</strong><p>{data.summary?.today?.fecha || "Fecha no disponible"}</p></article>
      </section>
      <section className="logs-container el-dashboard-chart-card">
        <header><div><h2>Distribución temporal de clasificaciones</h2><p>Recuento diario por grupo final del modelo V2. Los grupos son categorías exploratorias; no representan bienestar, estrés ni resultados clínicos.</p></div></header>
        {chartRows.length === 0 ? <p className="el-dashboard-empty">Aún no hay sesiones con clasificaciones disponibles para graficar.</p> : <div className="el-dashboard-chart"><ResponsiveContainer><AreaChart data={chartRows} margin={{top:12,right:16,left:0,bottom:4}}><defs><linearGradient id="groupZero" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_GRUPO_0} stopOpacity={0.68}/><stop offset="95%" stopColor={COLOR_GRUPO_0} stopOpacity={0.08}/></linearGradient><linearGradient id="groupOne" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_GRUPO_1} stopOpacity={0.68}/><stop offset="95%" stopColor={COLOR_GRUPO_1} stopOpacity={0.08}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="fechaLabel" tick={{fontSize:12}}/><YAxis allowDecimals={false} tick={{fontSize:12}}/><Tooltip labelFormatter={label=>`Fecha: ${label}`} formatter={(value,name)=>[value, name]}/><Legend/><Area type="monotone" dataKey="grupo_0" name="Clasificación IA · grupo 0" stackId="classified" stroke={COLOR_GRUPO_0} fill="url(#groupZero)" activeDot={{r:5}}/><Area type="monotone" dataKey="grupo_1" name="Clasificación IA · grupo 1" stackId="classified" stroke={COLOR_GRUPO_1} fill="url(#groupOne)" activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div>}
      </section>
    </>}
  </main>;
}
