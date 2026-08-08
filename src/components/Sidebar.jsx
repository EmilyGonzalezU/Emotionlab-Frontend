import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/');
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
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/teacher/sesiones" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                Sesiones
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/teacher/cuenta" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
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