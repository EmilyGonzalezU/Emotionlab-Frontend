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

  // 👁️ Estado para mostrar/ocultar contraseñas (el ojito mágico)
  const [mostrar, setMostrar] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const toggleMostrar = (campo) => {
    setMostrar((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

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

    // Validaciones estricta en tiempo real
    if (name === "nueva") {
      if (value.length > 0) {
        const tieneMayuscula = /[A-Z]/.test(value);
        const tieneEspecial = /[^A-Za-z0-9]/.test(value);
        const tieneLongitud = value.length >= 8;

        if (!tieneLongitud || !tieneMayuscula || !tieneEspecial) {
          setErrores((prev) => ({
            ...prev,
            nueva: "Falta cumplir con los requisitos de seguridad",
          }));
        } else {
          setErrores((prev) => ({ ...prev, nueva: "" }));
        }
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

    // Validar requisitos de seguridad (Cognito rules)
    const tieneMayuscula = /[A-Z]/.test(claves.nueva);
    const tieneEspecial = /[^A-Za-z0-9]/.test(claves.nueva);
    const tieneLongitud = claves.nueva.length >= 8;

    if (!tieneLongitud || !tieneMayuscula || !tieneEspecial) {
      toast.error("La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 carácter especial.", {
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
              {/* CONTRASEÑA ACTUAL */}
              <div className="form-grupo">
                <label className="form-label">Contraseña Actual</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrar.actual ? "text" : "password"}
                    name="actual"
                    value={claves.actual}
                    onChange={manejarCambio}
                    placeholder="Ingresa tu contraseña actual"
                    className="form-input"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleMostrar("actual")}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex",
                    }}
                  >
                    {mostrar.actual ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* NUEVA CONTRASEÑA */}
              <div className="form-grupo">
                <label className="form-label">Nueva Contraseña</label>
                <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "-4px", marginBottom: "8px" }}>
                  Debe incluir 8+ caracteres, 1 mayúscula y 1 símbolo especial.
                </p>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrar.nueva ? "text" : "password"}
                    name="nueva"
                    value={claves.nueva}
                    onChange={manejarCambio}
                    placeholder="Crea una contraseña segura"
                    className={`form-input ${errores.nueva ? "input-error" : ""}`}
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleMostrar("nueva")}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex",
                    }}
                  >
                    {mostrar.nueva ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                {errores.nueva && (
                  <p
                    className="error-mensaje"
                    style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
                    {errores.nueva}
                  </p>
                )}
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div className="form-grupo">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrar.confirmar ? "text" : "password"}
                    name="confirmar"
                    value={claves.confirmar}
                    onChange={manejarCambio}
                    placeholder="Repite la nueva contraseña"
                    className={`form-input ${errores.confirmar ? "input-error" : ""}`}
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleMostrar("confirmar")}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex",
                    }}
                  >
                    {mostrar.confirmar ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                {errores.confirmar && (
                  <p
                    className="error-mensaje"
                    style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
                    {errores.confirmar}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando || errores.nueva || errores.confirmar}
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