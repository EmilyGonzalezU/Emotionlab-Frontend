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
        <div className="el-skeleton-row" key={r} style={{ "--el-skeleton-columns": columns }}>
          {Array.from({ length: columns }).map((__, c) => (
            <SkeletonLine key={c} width={c === 0 ? "30%" : "100%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Page-shaped placeholder for route and dashboard loading states. */
export function SkeletonPage({ variant = "dashboard", label = "Cargando página", showHeader = true }) {
  return (
    <div className={`el-skeleton-page el-skeleton-page--${variant}`} role="status" aria-label={label} aria-busy="true">
      {showHeader && <div className="el-skeleton-page__header" aria-hidden="true">
        <SkeletonBlock width="34%" height={28} />
        <SkeletonLine width="52%" />
      </div>}

      {variant === "detail" ? (
        <>
          <div className="el-skeleton-page__grid" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => <div className="el-skeleton-page__card" key={item}>
              <SkeletonLine width="38%" />
              <SkeletonBlock height={76} />
              <SkeletonLine width="74%" />
            </div>)}
          </div>
          <div className="el-skeleton-page__card el-skeleton-page__chart" aria-hidden="true">
            <SkeletonLine width="28%" />
            <SkeletonBlock height={220} />
          </div>
        </>
      ) : variant === "cards" ? (
        <div className="el-skeleton-page__grid" aria-hidden="true">
          {[0, 1, 2].map((item) => <div className="el-skeleton-page__card" key={item}>
            <SkeletonBlock width={44} height={44} />
            <SkeletonLine width="62%" />
            <SkeletonLine width="86%" />
          </div>)}
        </div>
      ) : (
        <>
          <div className="el-skeleton-page__metrics" aria-hidden="true">
            {[0, 1, 2].map((item) => <div className="el-skeleton-page__card" key={item}>
              <SkeletonLine width="50%" />
              <SkeletonBlock width="42%" height={34} />
              <SkeletonLine width="78%" />
            </div>)}
          </div>
          <div className="el-skeleton-page__card el-skeleton-page__chart" aria-hidden="true">
            <SkeletonLine width="28%" />
            <SkeletonBlock height={220} />
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonChart({ label = "Cargando gráfico" }) {
  return <div className="el-skeleton-chart" role="status" aria-label={label} aria-busy="true">
    <SkeletonBlock height={230} />
  </div>;
}
