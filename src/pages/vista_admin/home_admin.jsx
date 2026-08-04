import React from 'react';

export default function HomeAdmin() {
  // Rescatamos la info que se guardó en el login
  const user = JSON.parse(localStorage.getItem('user'));

  // Función para cerrar sesión y volver al login
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Panel de Administración</h1>
      <h2>¡Hola, {user?.nombre}!</h2>
      
      <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <p><strong>Tu correo:</strong> {user?.email}</p>
        <p><strong>Tu rol es:</strong> {user?.rol}</p>
      </div>

      <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
}