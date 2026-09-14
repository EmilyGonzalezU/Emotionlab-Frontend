import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiUser, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";

import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import { api } from "../../lib/apiClient.js";
import { isValidEmail } from "../../lib/validators.js";

import "./creacion_visor.css";

export default function CrearEspecialista() {
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "teacher",
  });

  const [errores, setErrores] = useState({
    nombre: "",
    email: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    /*
     * Limpiamos el error del campo mientras el usuario corrige.
     */
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {
      nombre: "",
      email: "",
    };

    const nombre = formData.nombre.trim();
    const email = formData.email.trim();

    if (!nombre) {
      nuevosErrores.nombre =
        "Debe ingresar el nombre completo.";
    } else if (nombre.length < 3) {
      nuevosErrores.nombre =
        "El nombre debe tener al menos 3 caracteres.";
    }

    if (!email) {
      nuevosErrores.email =
        "Debe ingresar un correo electrónico.";
    } else if (!isValidEmail(email)) {
      nuevosErrores.email =
        "Ingrese un correo electrónico válido.";
    }

    setErrores(nuevosErrores);

    return !nuevosErrores.nombre && !nuevosErrores.email;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cargando) {
      return;
    }

    if (!validarFormulario()) {
      toast.error("Revisa los datos ingresados.");
      return;
    }

    setCargando(true);

    try {
      await api.post("/users", {
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        rol: formData.rol,
      });

      toast.success(
        "Usuario creado. Se ha enviado un correo con la clave temporal.",
        {
          duration: 5000,
        }
      );

      setTimeout(() => {
        navigate("/admin/visualizadores", {
          replace: true,
        });
      }, 1000);
    } catch (error) {
      console.error(
        "Error creando usuario:",
        error
      );

      toast.error(
        error?.message ||
          "No se pudo crear el usuario.",
        {
          duration: 4000,
        }
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="el-create-user">
      <PageHeader
        title="Crear especialista"
        description="Registra una nueva cuenta para acceder a la plataforma."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              navigate("/admin/visualizadores")
            }
            disabled={cargando}
          >
            <FiArrowLeft aria-hidden="true" />
            Volver
          </Button>
        }
      />

      <section className="el-create-user-card">
        <div className="el-create-user-card-header">
          <div>
            <h2>Datos de la cuenta</h2>

            <p>
              Completa la información del nuevo usuario.
              La contraseña temporal será generada y
              enviada automáticamente.
            </p>
          </div>
        </div>

        <form
          className="el-create-user-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* ==================================================
              NOMBRE
             ================================================== */}

          <div className="el-create-user-field">
            <label
              htmlFor="crear-nombre"
              className="el-create-user-label"
            >
              Nombre completo
            </label>

            <div className="el-create-user-input-wrapper">
              <FiUser
                className="el-create-user-input-icon"
                aria-hidden="true"
              />

              <input
                id="crear-nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                autoComplete="name"
                disabled={cargando}
                className={
                  errores.nombre
                    ? "el-create-user-input el-create-user-input-error"
                    : "el-create-user-input"
                }
                aria-invalid={Boolean(
                  errores.nombre
                )}
                aria-describedby={
                  errores.nombre
                    ? "crear-nombre-error"
                    : undefined
                }
              />
            </div>

            {errores.nombre && (
              <span
                id="crear-nombre-error"
                className="el-create-user-error"
              >
                {errores.nombre}
              </span>
            )}
          </div>

          {/* ==================================================
              CORREO
             ================================================== */}

          <div className="el-create-user-field">
            <label
              htmlFor="crear-email"
              className="el-create-user-label"
            >
              Correo electrónico
            </label>

            <div className="el-create-user-input-wrapper">
              <FiMail
                className="el-create-user-input-icon"
                aria-hidden="true"
              />

              <input
                id="crear-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.cl"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                disabled={cargando}
                className={
                  errores.email
                    ? "el-create-user-input el-create-user-input-error"
                    : "el-create-user-input"
                }
                aria-invalid={Boolean(
                  errores.email
                )}
                aria-describedby={
                  errores.email
                    ? "crear-email-error"
                    : undefined
                }
              />
            </div>

            {errores.email && (
              <span
                id="crear-email-error"
                className="el-create-user-error"
              >
                {errores.email}
              </span>
            )}
          </div>

          {/* ==================================================
              ROL
             ================================================== */}

          <div className="el-create-user-field">
            <label
              htmlFor="crear-rol"
              className="el-create-user-label"
            >
              Rol en el sistema
            </label>

            <div className="el-create-user-input-wrapper">
              <FiShield
                className="el-create-user-input-icon"
                aria-hidden="true"
              />

              <select
                id="crear-rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                disabled={cargando}
                className="el-create-user-input el-create-user-select"
              >
                <option value="teacher">
                  Especialista
                </option>

                <option value="admin">
                  Administrador
                </option>
              </select>
            </div>
          </div>

          {/* ==================================================
              INFORMACIÓN
             ================================================== */}

          <div className="el-create-user-info">
            <div className="el-create-user-info-icon">
              <FiMail aria-hidden="true" />
            </div>

            <div>
              <strong>Envío de credenciales</strong>

              <p>
                El sistema generará una contraseña
                temporal y enviará las instrucciones de
                acceso al correo indicado.
              </p>
            </div>
          </div>

          {/* ==================================================
              ACCIONES
             ================================================== */}

          <div className="el-create-user-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate("/admin/visualizadores")
              }
              disabled={cargando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? "Creando usuario..."
                : "Crear usuario"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}