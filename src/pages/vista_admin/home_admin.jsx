import React from 'react';

export default function HomeAdmin() {
  // obtenemos el nombre del usuario para saludar
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div>
      <h1 style={{ color: '#333' }}>¡Hola, {user?.nombre || "Admin"}!</h1>
      <p style={{ color: '#666', fontSize: '18px' }}>Bienvenido al panel de administración.</p>

      {/* Aquí irán los dashboards, log de actividades y gráficos más adelante */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Resumen de Actividad (Próximamente)</h3>
        <p>Aquí pondremos el gráfico de usuarios activos e inactivos.</p>
      </div>
    </div>
  );
}