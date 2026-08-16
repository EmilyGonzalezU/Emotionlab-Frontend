import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./SidebarAdmin.css";
import toast from "react-hot-toast";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const handleLogout = () => {
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
      { duration: 5000, id: "alerta-confirmacion" },
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
                to="/admin"
                end
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }>
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/cuenta"
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
        <button className="btn-cerrar-sesion" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
