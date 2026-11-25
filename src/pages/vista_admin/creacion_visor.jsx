import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import { api } from "../../lib/apiClient.js";
import { isValidEmail } from "../../lib/validators.js";
import "./creacion_visor.css";

/**
 * Pantalla independiente (Fase 5, condición explícita del usuario: se
 * mantiene en su propia ruta /admin/crear-visualizador en vez de
 * convertirse en un modal).
 *
 * Fase 5.1: solo se actualizó la apariencia para que sea consistente
 * con el resto del sistema (PageHeader, Button, misma tipografía y
 * tokens de color que Cuenta/Sesiones/Reportes/Gestión de usuarios).
 * Ningún cambio de lógica, validación ni de contrato con el backend:
 * sigue sin pedir contraseña — POST /users con exactamente
 * { nombre, email, rol } — el backend (Cognito) sigue generando y
 * enviando la clave temporal, con cambio obligatorio en el primer
 * acceso.
 */
export default function CrearEspecialista() {
  const navigate = useNavigate();
  // esto para q bloquee el boton de crear una vez apretado para evitar q se manden 2 solicitudes
  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "teacher", // El backend sigue recibiendo "teacher", ¡no se rompe nada!
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    if (!formData.nombre.trim()) {
      toast.error("Debe ingresar un nombre completo.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (formData.nombre.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Debe ingresar un correo electrónico.", { duration: 3000 });
      setCargando(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Ingrese un correo electrónico válido.", { duration: 3000 });
      setCargando(false);
      return;
    }

    try {
      // Mismo endpoint y payload de siempre: POST /users con
      // { nombre, email, rol }. Nunca se envía una contraseña: Cognito
      // genera la temporal y la envía por correo.
      await api.post("/users", formData);

      toast.success("¡Usuario creado! Se ha enviado un correo con la clave temporal.", { duration: 5000 });

      setTimeout(() => {
        navigate("/admin/visualizadores");
      }, 1500);
    } catch (error) {
      toast.error("Hubo un error al crear: " + error.message, { duration: 3000 });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="el-user-create">
      <Button
        variant="ghost"
        size="sm"
        icon={FiArrowLeft}
        className="el-user-create-back"
        onClick={() => navigate("/admin/visualizadores")}
      >
        Volver
      </Button>

      <PageHeader
        title="Crear especialista"
        description="El sistema envía una contraseña temporal por correo; el usuario deberá crear una nueva en su primer acceso."
      />

      <form onSubmit={handleSubmit} className="el-user-create-card">
        <div className="el-user-create-field">
          <label htmlFor="el-user-create-nombre">Nombre completo</label>
          <input
            id="el-user-create-nombre"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Ej: Juan Pérez"
            disabled={cargando}
          />
        </div>

        <div className="el-user-create-field">
          <label htmlFor="el-user-create-email">Correo electrónico</label>
          <input
            id="el-user-create-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="usuario@emotionlab.cl"
            disabled={cargando}
          />
        </div>

        <div className="el-user-create-field">
          <label htmlFor="el-user-create-rol">Rol en el sistema</label>
          <select
            id="el-user-create-rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            disabled={cargando}
          >
            <option value="teacher">Especialista</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="el-user-create-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/visualizadores")}
            disabled={cargando}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={cargando}>
            Crear especialista
          </Button>
        </div>
      </form>
    </div>
  );
}
