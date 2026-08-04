import React, { useState } from 'react';
import './Login.css'; // Importa los estilos específicos para la vista de login

export default function Login() {
  // Estados locales para almacenar el usuario/correo, la contraseña y los mensajes de error
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Función asíncrona que maneja el envío de datos al hacer submit en el formulario
  const handleLogin = async (e) => {
    e.preventDefault(); // Evita que el navegador recargue la página por defecto
    setErrorMsg(''); // Limpia mensajes de error anteriores antes de un nuevo intento

    try {
      // Envía una petición HTTP POST con el fetch hacia el backend de Flask
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Indica que estamos enviando datos en formato JSON
        },
        body: JSON.stringify({ email, password }), // Empaqueta las credenciales en texto JSON
      });

      // Espera y procesa la respuesta del servidor transformándola a objeto de JavaScript
      const data = await response.json();

      // Si el servidor responde con un código de error (ej. 400 o 401)
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      // Guardamos el token en el almacenamiento local del navegador
      localStorage.setItem('token', data.token || data.access_token);
      
      // redireccion a la pag de inicio (ESTO FALTA, NO TOMA LOS DATOS)
      window.location.href = '/vista_admin/home_admin.jsx'; // O cambia '/' por la ruta de tu página principal

    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // VISUALIZACION DE LA PAG

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <h2 className="login-title">Login EmotionLab</h2>
        <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        
        {errorMsg && (
          <div className="error-message">
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin o usuario@gmail.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button type="submit" className="form-button">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}