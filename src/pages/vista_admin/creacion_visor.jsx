import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './creacion_visor.css';

export default function CrearVisualizador() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'teacher'
  });

  // Función para capturar lo que escribes en las cajitas
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Función para enviar los datos a Flask
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const token = localStorage.getItem('token');
      
      const respuesta = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!respuesta.ok) {
        // Escudo protector: asumimos el código de error por defecto
        let mensajeError = `Error del servidor (Código: ${respuesta.status})`;
        
        try {
          // Intentamos leer el JSON, pero si está vacío, el 'catch' nos salva
          const errorData = await respuesta.json();
          if (errorData.error) mensajeError = errorData.error;
        } catch (e) {
          console.warn("El backend devolvió un error sin formato JSON.");
        }
        
        throw new Error(mensajeError);
      }

      // Si el backend responde 201 (Creado)
      setMensaje({ tipo: 'exito', texto: '¡Usuario creado correctamente!' });
      
      // Esperamos un ratito corto y lo devolvemos a la tabla de visualizadores
      setTimeout(() => {
        navigate('/admin/visualizadores');
      }, 1500);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor-formulario">
      <div className="cabecera-form">
        <button className="btn-volver" onClick={() => navigate('/admin/visualizadores')}>
          ⬅ Volver
        </button>
        <h2>Crear Nuevo Usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="tarjeta-form">
        
        {/* Aquí mostramos si funcionó o si falló */}
        {mensaje.texto && (
          <div className={`alerta ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grupo-input">
          <label>Nombre Completo:</label>
          <input 
            type="text" 
            name="nombre" 
            value={formData.nombre} 
            onChange={handleChange} 
            required 
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="grupo-input">
          <label>Correo Electrónico:</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            placeholder="usuario@emotionlab.cl"
          />
        </div>

        <div className="grupo-input">
          <label>Contraseña Temporal:</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="grupo-input">
          <label>Rol en el sistema:</label>
          <select name="rol" value={formData.rol} onChange={handleChange}>
            <option value="teacher">Visualizador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <button type="submit" className="btn-guardar" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar Usuario'}
        </button>
      </form>
    </div>
  );
}