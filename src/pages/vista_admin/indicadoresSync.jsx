import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiArrowRight, FiUserCheck, FiUserX, FiUsers } from "react-icons/fi";
import { useUsers } from "../../features/users/useUsers.js";
import { SkeletonPage } from "../../ui/LoadingState.jsx";
import Button from "../../ui/Button.jsx";
import "./indicadoresSync.css";

const DIAS_INACTIVIDAD = 30;
const DIA_MS = 24 * 60 * 60 * 1000;

function fechaValida(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function fechaCorta(valor) {
  const fecha = fechaValida(valor);
  return fecha ? fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }) : "Sin registro";
}

export default function IndicadoresSync() {
  const { data, isLoading, isError } = useUsers();
  const navigate = useNavigate();
  const usuarios = useMemo(() => data || [], [data]);
  const { activos, conectadosRecientemente, inactivos, actividad } = useMemo(() => {
    const ahora = Date.now();
    const rangos = [
      { label: "Últimos 7 días", value: 0 },
      { label: "8–30 días", value: 0 },
      { label: "Más de 30 días", value: 0 },
      { label: "Sin registro", value: 0 },
    ];
    let recientes = 0;
    let antiguos = 0;
    usuarios.forEach((usuario) => {
      if (!usuario.activo) return;
      const fecha = fechaValida(usuario.ultimo_login);
      if (!fecha) rangos[3].value += 1;
      else {
        const dias = Math.max(0, (ahora - fecha.getTime()) / DIA_MS);
        if (dias <= 7) { rangos[0].value += 1; recientes += 1; }
        else if (dias <= DIAS_INACTIVIDAD) { rangos[1].value += 1; recientes += 1; }
        else { rangos[2].value += 1; antiguos += 1; }
      }
    });
    return {
      activos: usuarios.filter((usuario) => usuario.activo).length,
      conectadosRecientemente: recientes,
      inactivos: antiguos,
      actividad: rangos,
    };
  }, [usuarios]);

  const maxActividad = Math.max(1, ...actividad.map((item) => item.value));
  const usuariosInactivos = useMemo(() => usuarios
    .filter((usuario) => {
      if (!usuario.activo) return false;
      const fecha = fechaValida(usuario.ultimo_login);
      return fecha && Date.now() - fecha.getTime() > DIAS_INACTIVIDAD * DIA_MS;
    })
    .sort((a, b) => new Date(a.ultimo_login) - new Date(b.ultimo_login))
    .slice(0, 5), [usuarios]);

  if (isLoading) return <SkeletonPage variant="dashboard" showHeader={false} label="Cargando resumen de usuarios" />;
  if (isError) return <div className="admin-dashboard-error" role="alert">No se pudo cargar el resumen de usuarios. Intenta actualizar la página.</div>;

  return (
    <section className="admin-dashboard" aria-label="Resumen de usuarios">
      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon--blue"><FiUsers /></span>
          <div><span className="admin-stat-label">Usuarios registrados</span><strong>{usuarios.length}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon--green"><FiUserCheck /></span>
          <div><span className="admin-stat-label">Cuentas activas</span><strong>{activos}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon--teal"><FiActivity /></span>
          <div><span className="admin-stat-label">Conectados en 30 días</span><strong>{conectadosRecientemente}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon--amber"><FiUserX /></span>
          <div><span className="admin-stat-label">Sin conexión hace 30+ días</span><strong>{inactivos}</strong></div>
        </article>
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-panel" aria-labelledby="activity-title">
          <div className="admin-panel-heading">
            <div><h2 id="activity-title">Actividad de acceso</h2><p>Última conexión de las cuentas activas</p></div>
          </div>
          <div className="admin-activity-chart" role="img" aria-label={actividad.map((item) => `${item.label}: ${item.value}`).join("; ")}>
            {actividad.map((item) => (
              <div className="admin-chart-row" key={item.label}>
                <span className="admin-chart-label">{item.label}</span>
                <div className="admin-chart-track"><span style={{ width: `${(item.value / maxActividad) * 100}%` }} /></div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <p className="admin-chart-note">Las cuentas sin registro todavía no tienen una conexión guardada.</p>
        </section>

        <section className="admin-panel admin-inactive-panel" aria-labelledby="inactive-title">
          <div className="admin-panel-heading admin-panel-heading--row">
            <div><h2 id="inactive-title">Requieren seguimiento</h2><p>Activos sin conexión en más de 30 días</p></div>
            <span className="admin-inactive-count">{inactivos}</span>
          </div>
          {usuariosInactivos.length ? (
            <ul className="admin-inactive-list">
              {usuariosInactivos.map((usuario) => <li key={usuario.uid}>
                <span className="admin-user-avatar">{(usuario.nombre || usuario.email || "U").trim().charAt(0).toUpperCase()}</span>
                <span className="admin-inactive-user"><strong>{usuario.nombre || "Usuario"}</strong><small>{usuario.email}</small></span>
                <time>{fechaCorta(usuario.ultimo_login)}</time>
              </li>)}
            </ul>
          ) : <p className="admin-empty-state">No hay cuentas activas con más de 30 días sin conexión.</p>}
          <Button className="admin-users-link" variant="ghost" size="sm" icon={FiArrowRight} onClick={() => navigate("/admin/visualizadores")}>
            Ir a gestión de usuarios
          </Button>
        </section>
      </div>
    </section>
  );
}
