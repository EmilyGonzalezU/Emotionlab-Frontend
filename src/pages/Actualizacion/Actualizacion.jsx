import React from "react";
import emotionLabLogo from "../../assets/emotionlab-logo.png";
import "./Actualizacion.css";

export default function Actualizacion({
  version,
  percent = 0,
  status = "downloading",
}) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  let message = "Estamos preparando la actualización.";

  if (status === "checking") {
    message = "Estamos comprobando si existe una nueva versión.";
  }

  if (status === "downloading") {
    message = "Estamos descargando una nueva versión de EmotionLab.";
  }

  if (status === "downloaded") {
    message = "La actualización está lista para instalarse.";
  }

  return (
    <main className="update-page">
      <section className="update-panel">
        <div className="update-brand">
          <img className="update-brand-mark" src={emotionLabLogo} alt="" />

          <span>EmotionLab</span>
        </div>

        <div className="update-content">
          <div className="update-indicator">
            <span />
            <span />
            <span />
          </div>

          <h1>Estamos actualizando</h1>

          <p className="update-description">
            {message}
          </p>

          <div className="update-progress-wrapper">
            <div className="update-progress-track">
              <div
                className="update-progress-bar"
                style={{ width: `${safePercent}%` }}
              />
            </div>

            <div className="update-progress-meta">
              <span>
                {safePercent}%
              </span>

              {version && (
                <span>
                  Versión {version}
                </span>
              )}
            </div>
          </div>

          <p className="update-note">
            No cierres esta ventana mientras finaliza el proceso.
          </p>
        </div>
      </section>
    </main>
  );
}
