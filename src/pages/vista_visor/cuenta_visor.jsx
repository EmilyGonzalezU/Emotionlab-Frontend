import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

// ¡Reciclamos el CSS del admin para mantener el mismo diseño sin esfuerzo!
import "../vista_admin/cuenta_admin.css";
import { getApiUrl } from "../../config/api.js";

export default function CuentaVisor() {
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  // guardamos el correo y nombre del visor para q se visualice
  const [datosUser, setDatosUser] = useState({
    nombre: "Cargando...",
    email: "Cargando...",
  });

  // este es para las contraseñas ehh la nueva, la actual y para confirmar contraseña
  const [claves, setClaves] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  // el cargando es para q el usuario no mande la solicitud 2 veces
  const [cargando, setCargando] = useState(false);

  // Estado para errores en tiempo real
  const [errores, setErrores] = useState({
    nueva: "",
    confirmar: "",
  });

  const obtenerMisDatos = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(getApiUrl("/users/me"), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        setDatosUser({
          nombre: datos.nombre || "Sin nombre",
          email: datos.email || "Sin correo",
        });
      }
    } catch (error) {
      console.error("Error al obtener los datos de la cuenta", error);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // el useEffect para q se muestre solo una vez
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerMisDatos();
  }, [obtenerMisDatos]);

  // Validación y manejo de cambios en tiempo real
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClaves((prev) => ({ ...prev, [name]: value }));

    // Validaciones en tiempo real
    if (name === "nueva") {
      if (value.length > 0 && value.length < 8) {
        setErrores((prev) => ({
          ...prev,
          nueva: "La contraseña debe tener al menos 8 caracteres",
        }));
      } else {
        setErrores((prev) => ({ ...prev, nueva: "" }));
      }

      // Si hay una confirmación escrita, validar coincidencia
      if (claves.confirmar && value !== claves.confirmar) {
        setErrores((prev) => ({
          ...prev,
          confirmar: "Las contraseñas no coinciden",
        }));
      } else if (claves.confirmar && value === claves.confirmar) {
        setErrores((prev) => ({ ...prev, confirmar: "" }));
      }
    }

    if (name === "confirmar") {
      if (value && value !== claves.nueva) {
        setErrores((prev) => ({
          ...prev,
          confirmar: "Las contraseñas no coinciden",
        }));
      } else {
        setErrores((prev) => ({ ...prev, confirmar: "" }));
      }
    }
  };

  // Validación completa antes de enviar
  const validarFormulario = () => {
    // Verificar campos vacíos
    if (!claves.actual || !claves.nueva || !claves.confirmar) {
      toast.error("Por favor, llena todos los campos.", { duration: 3000 });
      return false;
    }

    // Validar longitud mínima
    if (claves.nueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.", {
        duration: 3000,
      });
      return false;
    }

    // Validar que coincidan
    if (claves.nueva !== claves.confirmar) {
      toast.error("Las contraseñas nuevas no coinciden.", { duration: 3000 });
      return false;
    }

    // Validar que no sea igual a la actual
    if (claves.nueva === claves.actual) {
      toast.error("La nueva contraseña debe ser diferente a la actual.", {
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  // cambiar contraseña con GLOBITOS
  const cambiarContrasena = async (e) => {
    e.preventDefault();

    // Validar el formulario
    if (!validarFormulario()) {
      return;
    }

    // Lanzamos el globito preguntón
    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: "#17315E",
            }}>
            ¿Seguro que quieres cambiar tu contraseña?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {/* Botón de SÍ */}
            <button
              className="btn-cuenta-alerta-confirmar"
              onClick={async () => {
                toast.dismiss(t.id); // Cerramos la pregunta
                setCargando(true); // Ponemos el botón principal en "cargando"

                try {
                  const token = localStorage.getItem("token");
                  const respuesta = await fetch(
                    getApiUrl("/users/me/password"),
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        current_password: claves.actual,
                        new_password: claves.nueva,
                      }),
                    },
                  );

                  const data = await respuesta.json();

                  if (respuesta.ok) {
                    toast.success("¡Contraseña actualizada con éxito!", {
                      duration: 3000,
                    });
                    setClaves({ actual: "", nueva: "", confirmar: "" });
                    setErrores({ nueva: "", confirmar: "" });
                  } else {
                    toast.error(data.error || "Contraseña actual incorrecta.", {
                      duration: 3000,
                    });
                  }
                } catch {
                  toast.error("Error de conexión con el servidor.", {
                    duration: 3000,
                  });
                } finally {
                  setCargando(false);
                }
              }}>
              Sí, cambiar
            </button>

            {/* Botón de NO */}
            <button
              className="btn-cuenta-alerta-cancelar"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 8000 },
    );
  };

  return (
    <div className="sync-dashboard">
      <h2 className="sync-titulo">Mi Cuenta</h2>

      <div className="dashboard-layout">
        {/* PANEL IZQUIERDO: Datos del Usuario */}
        <div className="panel-izquierdo">
          <div className="logs-container">
            <h3 className="logs-titulo">Información Personal</h3>

            <div className="info-cuenta-lista">
              <div className="info-grupo">
                <p className="info-etiqueta">Nombre Completo</p>
                <p className="info-valor">{datosUser.nombre}</p>
              </div>

              <div className="info-grupo">
                <p className="info-etiqueta">Correo Electrónico</p>
                <p className="info-valor">{datosUser.email}</p>
              </div>

              <div className="info-grupo sin-borde">
                <p className="info-etiqueta" style={{ marginBottom: "10px" }}>
                  Rol en el Sistema
                </p>
                {/* Etiqueta adaptada para el visualizador */}
                <span
                  className="badge-estado listo badge-rol"
                  style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>
                  Visualizador
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Cambiar Contraseña */}
        <div className="panel-derecho">
          <div className="logs-container">
            <h3 className="logs-titulo">Seguridad</h3>
            <p className="seguridad-desc">
              Actualiza tu contraseña de acceso aquí.
            </p>

            <form onSubmit={cambiarContrasena} className="form-cuenta">
              <div className="form-grupo">
                <label className="form-label">Contraseña Actual</label>
                <input
                  type="password"
                  name="actual"
                  value={claves.actual}
                  onChange={manejarCambio}
                  placeholder="Ingresa tu contraseña actual"
                  className="form-input"
                />
              </div>

              <div className="form-grupo">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  name="nueva"
                  value={claves.nueva}
                  onChange={manejarCambio}
                  placeholder="Crea una nueva contraseña (mínimo 8 caracteres)"
                  className={`form-input ${errores.nueva ? "input-error" : ""}`}
                />
                {errores.nueva && (
                  <p
                    className="error-mensaje"
                    style={{
                      color: "red",
                      fontSize: "12px",
                      marginTop: "5px",
                    }}>
                    {errores.nueva}
                  </p>
                )}
              </div>

              <div className="form-grupo">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  name="confirmar"
                  value={claves.confirmar}
                  onChange={manejarCambio}
                  placeholder="Repite la nueva contraseña"
                  className={`form-input ${errores.confirmar ? "input-error" : ""}`}
                />
                {errores.confirmar && (
                  <p
                    className="error-mensaje"
                    style={{
                      color: "red",
                      fontSize: "12px",
                      marginTop: "5px",
                    }}>
                    {errores.confirmar}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className={`btn-guardar ${cargando ? "cargando" : ""}`}>
                {cargando ? "Guardando..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
