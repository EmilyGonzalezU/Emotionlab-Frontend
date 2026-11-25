import React, { useState } from "react";
import { FiFilter, FiChevronRight } from "react-icons/fi";
import Button from "../../ui/Button.jsx";

const STATUSES = ["Completada", "En proceso", "Incompleta", "Error de procesamiento", "Sin estado"];

export default function SessionsFilters({ fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, filtroEstado, setFiltroEstado, onLimpiar }) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState(null);
  const hasFilters = Boolean(fechaDesde || fechaHasta || filtroEstado);
  const toggle = (key) => setSubmenu((current) => current === key ? null : key);
  const option = (label, value, selected, setSelected) => <button type="button" key={value} className={`el-sessions-filters-option${selected ? " active" : ""}`} aria-pressed={selected} onClick={() => setSelected(selected ? "" : value)}>{label}</button>;
  return <div className="el-sessions-filters">
    <Button variant="secondary" size="sm" icon={FiFilter} onClick={() => setOpen((value) => !value)} aria-expanded={open}>Filtros{hasFilters ? " · activos" : ""}</Button>
    {open && <div className="el-sessions-filters-panel"><div className="el-sessions-filters-menu">
      {[ ["fecha", "Por fecha"], ["estado", `Por estado${filtroEstado ? ` (${filtroEstado})` : ""}`] ].map(([key, label]) => <button type="button" key={key} className={`el-sessions-filters-item${submenu === key ? " active" : ""}`} onClick={() => toggle(key)}><span>{label}</span><FiChevronRight/></button>)}
      {hasFilters && <button type="button" className="el-sessions-filters-clear" onClick={onLimpiar}>Limpiar filtros</button>}
    </div>
    {submenu === "fecha" && <div className="el-sessions-filters-submenu"><p className="el-sessions-filters-submenu-title">Rango de fechas</p><label className="el-sessions-filters-date">Desde<input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)}/></label><label className="el-sessions-filters-date">Hasta<input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)}/></label></div>}
    {submenu === "estado" && <div className="el-sessions-filters-submenu"><p className="el-sessions-filters-submenu-title">Estado de sesión</p>{STATUSES.map((value) => option(value, value, filtroEstado === value, setFiltroEstado))}</div>}
    </div>}
  </div>;
}
