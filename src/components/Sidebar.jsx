import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import toast from "react-hot-toast";

const Sidebar = () => {
  const navigate = useNavigate();
  const handleCerrarSesion = () => {
    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: "#17315E",
            }}>
            ¿Seguro que quieres cerrar sesión?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-cuenta-alerta-confirmar"
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.clear();
                navigate("/", { replace: true });
              }}>
              Salir
            </button>

            <button
              className="btn-cuenta-alerta-cancelar"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  return (
    <aside className="sidebar-fijo">
      <div className="sidebar-top">
        <h1 className="sidebar-logo">EmotionLab</h1>
        <nav>
          <ul className="sidebar-menu">
            <li>
              <NavLink
                to="/teacher"
                end
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }>
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/teacher/sesiones"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }>
                Sesiones
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/teacher/cuenta"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }>
                Cuenta
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="btn-cerrar-sesion" onClick={handleCerrarSesion}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
