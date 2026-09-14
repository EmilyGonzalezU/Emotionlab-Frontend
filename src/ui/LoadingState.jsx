import React from "react";
import "./LoadingState.css";

export function SkeletonLine({ width = "100%", height = 14 }) {
  return <span className="el-skeleton-line" style={{ width, height }} />;
}

export function SkeletonBlock({ width = "100%", height = 80 }) {
  return <span className="el-skeleton-block" style={{ width, height }} />;
}

/**
 * Bloque de filas en carga. Reemplaza los textos sueltos
 * "Cargando..." que hoy producen saltos de layout cuando llegan los
 * datos reales.
 */
export function SkeletonRows({ rows = 4, columns = 3 }) {
  return (
    <div className="el-skeleton-rows" role="status" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="el-skeleton-row" key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <SkeletonLine key={c} width={c === 0 ? "30%" : "100%"} />
          ))}
        </div>
      ))}
    </div>
  );
}
