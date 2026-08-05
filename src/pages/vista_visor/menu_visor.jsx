import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
// Importamos directamente el CSS del admin para que quede idéntico
import '../vista_admin/menu_admin.css';

export default function MenuVisor() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // se borra el token viejo una vez q cierre sesion
    localStorage.clear(); 
    // te patea a la pantalla de login
    navigate('/'); 
  };

  return (
    <div className="admin-layout">
      
      {/* MENÚ LATERAL IZQUIERDO */}
      <aside className="admin-sidebar">
        <h2 className="sidebar-brand">
          EmotionLab
        </h2>
        
        <nav className="sidebar-nav">
          <Link to="/teacher" className="sidebar-link">Inicio</Link>
          <Link to="/teacher/sesiones" className="sidebar-link">Sesiones</Link>
          <Link to="/teacher/cuenta" className="sidebar-link">Cuenta</Link>
        </nav>

        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO CENTRAL DINÁMICO */}
      <main className="admin-main-content">
        {/* Aquí es donde React inyectará el HomeVisor, SesionesVisor, etc. */}
        <Outlet /> 
      </main>

    </div>
  );
}