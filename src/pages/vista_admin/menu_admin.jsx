import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './menu_admin.css'; // Importamos la magia del diseño

export default function MenuAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
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
          <Link to="/admin" className="sidebar-link">🏠 Home</Link>
          <Link to="/admin/visualizadores" className="sidebar-link">👥 Visualizadores</Link>
          <Link to="/admin/cuenta" className="sidebar-link">⚙️ Cuenta</Link>
        </nav>

        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO CENTRAL DINÁMICO */}
      <main className="admin-main-content">
        {/* ¡Aquí es donde React inyectará Home, Visualizadores o Cuenta mágicamente! */}
        <Outlet /> 
      </main>

    </div>
  );
}