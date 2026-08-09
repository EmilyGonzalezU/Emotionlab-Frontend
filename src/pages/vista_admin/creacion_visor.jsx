import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './creacion_visor.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

//LOS NAVIGATE hacen q cambies d pagina sin necesidad de tener q anotarlo con un a
export default function CrearVisualizador() {
  const navigate = useNavigate();
  //esto para q bloquee el boton de crear una vez apretado para evitar q se manden 2 solicitudes
  const [cargando, setCargando] = useState(false);
  //muestra si fue exitoso o no la creacion del usuario
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errores, setErrores] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  
  //se agrupan los datos en un bloque para q cuando se llamen bajo el nombre teacher los traiga
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'teacher'
  });

  // esta funcion permite q el usuario pueda editar en el mismo texto sin necesidad de viajar a otra pagina
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setMensaje({ tipo: '', texto: '' });

    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          setErrores((prev) => ({
            ...prev,
            nombre: 'Debe ingresar un nombre.'
          }));
        } else if (value.trim().length < 3) {
          setErrores((prev) => ({
            ...prev,
            nombre: 'Debe tener al menos 3 caracteres.'
          }));
        } else {
          setErrores((prev) => ({
            ...prev,
            nombre: ''
          }));
        }
        break;

      case 'email':
        {
          const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!value.trim()) {
            setErrores((prev) => ({
              ...prev,
              email: 'Debe ingresar un correo.'
            }));
          } else if (!regex.test(value)) {
            setErrores((prev) => ({
              ...prev,
              email: 'Ingrese un correo válido.'
            }));
          } else {
            setErrores((prev) => ({
              ...prev,
              email: ''
            }));
          }
        }
        break;

      case 'password':
        if (!value.trim()) {
          setErrores((prev) => ({
            ...prev,
            password: 'Debe ingresar una contraseña.'
          }));
        } else if (value.length < 8) {
          setErrores((prev) => ({
            ...prev,
            password: 'Debe tener al menos 8 caracteres.'
          }));
        } else {
          setErrores((prev) => ({
            ...prev,
            password: ''
          }));
        }
        break;

      default:
        break;
    }
  };

  // Función para enviar los datos a Flask
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    if (
      errores.nombre ||
      errores.email ||
      errores.password
    ) {
      setCargando(false);
      return;
    }

    if (
      !formData.nombre ||
      !formData.email ||
      !formData.password
    ) {
      setMensaje({
        tipo: 'error',
        texto: 'Complete todos los campos.'
      });
      setCargando(false);
      return;
    }

    try {
        //obtenemos el token q se creo cuando el usuario inicia sesion
      const token = localStorage.getItem('token');
      
        //se conecta con el backend
      const respuesta = await fetch('http://localhost:5000/users', {
        method: 'POST', //post pq creamos un usuario nuevo
        headers: {
          'Content-Type': 'application/json', //lo mandamos en formato json
          'Authorization': `Bearer ${token}` //confirmamos el token
        },
        body: JSON.stringify(formData)
      });

      //si la respuesta no es buena (un error) asumimos el codigo x defecto
      if (!respuesta.ok) {
        let mensajeError = `Error del servidor (Código: ${respuesta.status})`;
        
        //se intenta leer el json, el catch es para q transformemos el error en algo legible sin q se caiga la pag
        try {
          const errorData = await respuesta.json();
          if (errorData.error) mensajeError = errorData.error;
        } catch (e) {
          console.warn("El backend devolvió un error sin formato JSON.");
        }
        
        throw new Error(mensajeError);
      }

      // si el backend responde exitosamente
      setMensaje({ tipo: 'exito', texto: '¡Usuario creado correctamente!' });
      
      // dsperamos un ratito corto y se devuelve el usuario a la tabla de visualizadores
      setTimeout(() => {
        navigate('/admin/visualizadores');
      }, 1500);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
        //se apaga el modo cargando del inicio si tira errpr o se va el net o hay problemas
      setCargando(false);
    }
  };

  //todo el diseño

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
            placeholder="Ej: Juan Pérez"
          />
          {errores.nombre && (
            <span className="field-error">
              {errores.nombre}
            </span>
          )}
        </div>

        <div className="grupo-input">
          <label>Correo Electrónico:</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="usuario@emotionlab.cl"
          />
          {errores.email && (
            <span className="field-error">
              {errores.email}
            </span>
          )}
        </div>

        <div className="grupo-input">
          <label>Contraseña Temporal:</label>
          <div className="password-container">
            <input 
              type={showPassword ? 'text' : 'password'}
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Mínimo 8 caracteres"
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errores.password && (
            <span className="field-error">
              {errores.password}
            </span>
          )}
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