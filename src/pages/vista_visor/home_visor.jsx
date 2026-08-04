import React from 'react';

export default function HomeTeacher() {
  // Rescatamos la info del usuario del Login 
  const user = JSON.parse(localStorage.getItem('user'));

  // Función para cerrar sesión y redireccion al login
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <h1>Panel de Visualización (Teacher) 👀</h1>
      <h2>¡Bienvenido/a, {user?.nombre || "Usuario"}!</h2>
      
      <div style={{ 
        margin: '20px auto', 
        padding: '20px', 
        border: '2px dashed #4fa94d', 
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        <p><em>Estás en modo visualizador. No tienes permisos de administrador.</em></p>
        <hr style={{ margin: '15px 0' }}/>
        <p><strong>Tu correo:</strong> {user?.email}</p>
        <p><strong>Tu rol en el sistema:</strong> {user?.rol}</p>
      </div>

      <button 
        onClick={handleLogout} 
        style={{ 
          padding: '10px 20px', 
          cursor: 'pointer', 
          backgroundColor: '#ff4d4d', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
        Cerrar Sesión
      </button>
    </div>
  );
}