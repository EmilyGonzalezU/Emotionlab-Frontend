import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./creacion_visor.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getApiUrl } from "../../config/api.js";

//LOS NAVIGATE hacen q cambies d pagina sin necesidad de tener q anotarlo con un a
export default function CrearVisualizador() {
  const navigate = useNavigate();
  //esto para q bloquee el boton de crear una vez apretado para evitar q se manden 2 solicitudes
  const [cargando, setCargando] = useState(false);
  //muestra si fue exitoso o no la creacion del usuario
  const [showPassword, setShowPassword] = useState(false);

  //se agrupan los datos en un bloque para q cuando se llamen bajo el nombre teacher los traiga
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "teacher",
  });

  // esta funcion permite q el usuario pueda editar en el mismo texto sin necesidad de viajar a otra pagina
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para enviar los datos a Flask
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    // Validaciones con toast
    if (!formData.nombre.trim()) {
      toast.error("Debe ingresar un nombre completo.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (formData.nombre.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres.", {
        duration: 3000,
      });
      setCargando(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      toast.error("Debe ingresar un correo electrónico.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error("Ingrese un correo electrónico válido.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (!formData.password.trim()) {
      toast.error("Debe ingresar una contraseña.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.", {
        duration: 3000,
      });
      setCargando(false);
      return;
    }

    try {
      //obtenemos el token q se creo cuando el usuario inicia sesion
      const token = localStorage.getItem("token");

      //se conecta con el backend
      const respuesta = await fetch(getApiUrl("/users"), {
        method: "POST", //post pq creamos un usuario nuevo
        headers: {
          "Content-Type": "application/json", //lo mandamos en formato json
          Authorization: `Bearer ${token}`, //confirmamos el token
        },
        body: JSON.stringify(formData),
      });

      //si la respuesta no es buena (un error) asumimos el codigo x defecto
      if (!respuesta.ok) {
        let mensajeError = `Error del servidor (Código: ${respuesta.status})`;

        //se intenta leer el json, el catch es para q transformemos el error en algo legible sin q se caiga la pag
        try {
          const errorData = await respuesta.json();
          if (errorData.error) mensajeError = errorData.error;
        } catch {
          console.warn("El backend devolvió un error sin formato JSON.");
        }

        throw new Error(mensajeError);
      }

      // si el backend responde exitosamente
      toast.success("¡Usuario creado correctamente!", { duration: 5000 });

      // dsperamos un ratito corto y se devuelve el usuario a la tabla de visualizadores
      setTimeout(() => {
        navigate("/admin/visualizadores");
      }, 1500);
    } catch (error) {
      toast.error("Hubo un error al crear: " + error.message, {
        duration: 3000,
      });
    } finally {
      //se apaga el modo cargando del inicio si tira errpr o se va el net o hay problemas
      setCargando(false);
    }
  };

  //todo el diseño

  return (
    <div className="contenedor-formulario">
      <div className="cabecera-form">
        <button
          className="btn-volver"
          onClick={() => navigate("/admin/visualizadores")}>
          ⬅ Volver
        </button>
        <h2>Crear Nuevo Usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="tarjeta-form">
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
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 8 caracteres"
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="grupo-input">
          <label>Rol en el sistema:</label>
          <select name="rol" value={formData.rol} onChange={handleChange}>
            <option value="teacher">Visualizador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <button type="submit" className="btn-guardar" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar Usuario"}
        </button>
      </form>
    </div>
  );
}
