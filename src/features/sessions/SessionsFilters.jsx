import React, { useState } from "react";
import { FiFilter, FiChevronRight } from "react-icons/fi";
import Button from "../../ui/Button.jsx";

const OPCIONES_GENERO = ["Femenino", "Masculino", "No binario", "Prefiero no decir"];

/**
 * Menú de filtros del listado de sesiones (fecha / género / curso).
 * Mismo comportamiento y mismos filtros que existían en
 * sesiones_visor.jsx — solo se rediseña la presentación (antes con
 * flechas "▸" y "✓" como texto; ahora con react-icons y tokens).
 */
export default function SessionsFilters({
  filtroGenero,
  setFiltroGenero,
  filtroCurso,
  setFiltroCurso,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  cursosDisponibles,
  normalizarGenero,
  onLimpiar,
}) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState(null);

  const hayFiltrosActivos = Boolean(filtroGenero || filtroCurso || fechaDesde || fechaHasta);

  const alternarSubmenu = (nombre) => setSubmenu((prev) => (prev === nombre ? null : nombre));

  return (
    <div className="el-sessions-filters">
      <Button
        variant="secondary"
        size="sm"
        icon={FiFilter}
        onClick={() => {
          setAbierto((v) => !v);
          setSubmenu(null);
        }}
      >
        Filtros{hayFiltrosActivos ? " · activos" : ""}
      </Button>

      {abierto && (
        <div className="el-sessions-filters-panel">
          <div className="el-sessions-filters-menu">
            <button
              type="button"
              className={`el-sessions-filters-item${submenu === "fecha" ? " active" : ""}`}
              onClick={() => alternarSubmenu("fecha")}
            >
              <span>Por fecha{(fechaDesde || fechaHasta) ? " (activo)" : ""}</span>
              <FiChevronRight aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`el-sessions-filters-item${submenu === "genero" ? " active" : ""}`}
              onClick={() => alternarSubmenu("genero")}
            >
              <span>Por género{filtroGenero ? ` (${filtroGenero})` : ""}</span>
              <FiChevronRight aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`el-sessions-filters-item${submenu === "curso" ? " active" : ""}`}
              onClick={() => alternarSubmenu("curso")}
            >
              <span>Por curso{filtroCurso ? ` (${filtroCurso})` : ""}</span>
              <FiChevronRight aria-hidden="true" />
            </button>

            {hayFiltrosActivos && (
              <button type="button" className="el-sessions-filters-clear" onClick={onLimpiar}>
                Limpiar filtros
              </button>
            )}
          </div>

          {submenu === "fecha" && (
            <div className="el-sessions-filters-submenu">
              <p className="el-sessions-filters-submenu-title">Rango de fechas</p>
              <label className="el-sessions-filters-date">
                Desde
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </label>
              <label className="el-sessions-filters-date">
                Hasta
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </label>
            </div>
          )}

          {submenu === "genero" && (
            <div className="el-sessions-filters-submenu">
              <p className="el-sessions-filters-submenu-title">Seleccionar género</p>
              {OPCIONES_GENERO.map((genero) => (
                <button
                  type="button"
                  key={genero}
                  className={`el-sessions-filters-option${
                    normalizarGenero(filtroGenero) === normalizarGenero(genero) ? " active" : ""
                  }`}
                  onClick={() => setFiltroGenero(filtroGenero === genero ? "" : genero)}
                >
                  {genero}
                </button>
              ))}
            </div>
          )}

          {submenu === "curso" && (
            <div className="el-sessions-filters-submenu">
              <p className="el-sessions-filters-submenu-title">Seleccionar curso</p>
              {cursosDisponibles.length === 0 ? (
                <p className="el-sessions-filters-empty">Sin cursos registrados.</p>
              ) : (
                cursosDisponibles.map((curso) => (
                  <button
                    type="button"
                    key={curso}
                    className={`el-sessions-filters-option${filtroCurso === curso ? " active" : ""}`}
                    onClick={() => setFiltroCurso(filtroCurso === curso ? "" : curso)}
                  >
                    {curso}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
