import React, { useState, useEffect } from "react";

// Reutilizamos el mismo CSS de CuentaAdmin
import "../vista_admin/cuenta_admin.css";

export default function CuentaVisor() {
  // =========================================================
  // DATOS DEL USUARIO
  // =========================================================

  const [datosUser, setDatosUser] = useState({
    nombre: "Cargando...",
    email: "Cargando...",
  });

  // =========================================================
  // CONTRASEÑAS
  // =========================================================

  const [claves, setClaves] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  // =========================================================
  // ERRORES DE CADA CAMPO
  // =========================================================

  const [actualError, setActualError] = useState("");
  const [nuevaError, setNuevaError] = useState("");
  const [confirmarError, setConfirmarError] = useState("");

  // =========================================================
  // MENSAJE GENERAL
  // =========================================================

  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  // =========================================================
  // ESTADO DE CARGA
  // =========================================================

  const [cargando, setCargando] = useState(false);

  // =========================================================
  // OBTENER DATOS DEL USUARIO
  // =========================================================

  useEffect(() => {
    const obtenerMisDatos = async () => {
      try {
        const token = localStorage.getItem("token");

        const respuesta = await fetch("http://localhost:5000/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!respuesta.ok) {
          console.error("Error obteniendo usuario:", respuesta.status);
          return;
        }

        const datos = await respuesta.json();

        setDatosUser({
          nombre: datos.nombre || "Sin nombre",
          email: datos.email || "Sin correo",
        });
      } catch (error) {
        console.error("Error al obtener los datos de la cuenta:", error);
      }
    };

    obtenerMisDatos();
  }, []);

  // =========================================================
  // CAMBIO DE LOS CAMPOS
  // =========================================================

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setClaves((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo correspondiente

    if (name === "actual") {
      setActualError("");
    }

    if (name === "nueva") {
      setNuevaError("");
    }

    if (name === "confirmar") {
      setConfirmarError("");
    }

    // Limpiar mensaje general al comenzar a escribir

    setMensaje({
      texto: "",
      tipo: "",
    });
  };

  // =========================================================
  // CAMBIAR CONTRASEÑA
  // =========================================================

  const cambiarContrasena = async (e) => {
    e.preventDefault();

    // Limpiar errores anteriores

    setActualError("");
    setNuevaError("");
    setConfirmarError("");

    setMensaje({
      texto: "",
      tipo: "",
    });

    let hayErrores = false;

    // =====================================================
    // VALIDAR CONTRASEÑA ACTUAL
    // =====================================================

    if (!claves.actual.trim()) {
      setActualError("Debe ingresar su contraseña actual.");

      hayErrores = true;
    }

    // =====================================================
    // VALIDAR NUEVA CONTRASEÑA
    // =====================================================

    if (!claves.nueva.trim()) {
      setNuevaError("Debe ingresar una nueva contraseña.");

      hayErrores = true;
    } else if (claves.nueva.length < 8) {
      setNuevaError("Verificar el mínimo de caracteres permitidos.");

      hayErrores = true;
    }

    // =====================================================
    // VALIDAR CONFIRMACIÓN
    // =====================================================

    if (!claves.confirmar.trim()) {
      setConfirmarError("Debe confirmar la nueva contraseña.");

      hayErrores = true;
    }

    // =====================================================
    // COMPARAR CONTRASEÑAS
    // =====================================================

    if (claves.nueva && claves.confirmar && claves.nueva !== claves.confirmar) {
      setConfirmarError("Las contraseñas nuevas no coinciden.");

      hayErrores = true;
    }

    // =====================================================
    // SI HAY ERRORES NO SE ENVÍA AL BACKEND
    // =====================================================

    if (hayErrores) {
      return;
    }

    // =====================================================
    // ENVIAR AL BACKEND
    // =====================================================

    setCargando(true);

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch("http://localhost:5000/users/me/password", {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          current_password: claves.actual,
          new_password: claves.nueva,
        }),
      });

      // Intentar obtener respuesta JSON

      let data = {};

      try {
        data = await respuesta.json();
      } catch {
        data = {};
      }

      // ===================================================
      // CONTRASEÑA CAMBIADA
      // ===================================================

      if (respuesta.ok) {
        setMensaje({
          texto: "¡Contraseña actualizada con éxito!",
          tipo: "exito",
        });

        setClaves({
          actual: "",
          nueva: "",
          confirmar: "",
        });

        return;
      }

      // ===================================================
      // ERROR DEL BACKEND
      // ===================================================

      setMensaje({
        texto: data.error || "Hubo un error al cambiar la contraseña.",
        tipo: "error",
      });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);

      setMensaje({
        texto: "Error de conexión con el servidor.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <div>
      {/* =====================================================
          TÍTULO
      ===================================================== */}

      <h1
        style={{
          color: "#17315E",
          fontSize: "26px",
          marginTop: 0,
          marginBottom: "25px",
          fontWeight: "bold",
        }}>
        Mi Cuenta
      </h1>

      <div className="dashboard-layout">
        {/* =================================================
            PANEL IZQUIERDO
        ================================================= */}

        <div className="panel-izquierdo">
          <div className="logs-container">
            <h3 className="logs-titulo">Información Personal</h3>

            <div className="info-cuenta-lista">
              {/* NOMBRE */}

              <div className="info-grupo">
                <p className="info-etiqueta">Nombre Completo</p>

                <p className="info-valor">{datosUser.nombre}</p>
              </div>

              {/* CORREO */}

              <div className="info-grupo">
                <p className="info-etiqueta">Correo Electrónico</p>

                <p className="info-valor">{datosUser.email}</p>
              </div>

              {/* ROL */}

              <div className="info-grupo sin-borde">
                <p
                  className="info-etiqueta"
                  style={{
                    marginBottom: "10px",
                  }}>
                  Rol en el Sistema
                </p>

                <span
                  className="badge-estado listo badge-rol"
                  style={{
                    backgroundColor: "#DBEAFE",
                    color: "#1E40AF",
                  }}>
                  Visualizador
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            PANEL DERECHO
        ================================================= */}

        <div className="panel-derecho">
          <div className="logs-container">
            <h3 className="logs-titulo">Seguridad</h3>

            <p className="seguridad-desc">
              Actualiza tu contraseña de acceso aquí.
            </p>

            <form onSubmit={cambiarContrasena} className="form-cuenta">
              {/* =================================================
                  CONTRASEÑA ACTUAL
              ================================================= */}

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

                {actualError && (
                  <span className="field-error">{actualError}</span>
                )}
              </div>

              {/* =================================================
                  NUEVA CONTRASEÑA
              ================================================= */}

              <div className="form-grupo">
                <label className="form-label">Nueva Contraseña</label>

                <input
                  type="password"
                  name="nueva"
                  value={claves.nueva}
                  onChange={manejarCambio}
                  placeholder="Crea una nueva contraseña"
                  className="form-input"
                />

                {nuevaError && (
                  <span className="field-error">{nuevaError}</span>
                )}
              </div>

              {/* =================================================
                  CONFIRMAR CONTRASEÑA
              ================================================= */}

              <div className="form-grupo">
                <label className="form-label">Confirmar Nueva Contraseña</label>

                <input
                  type="password"
                  name="confirmar"
                  value={claves.confirmar}
                  onChange={manejarCambio}
                  placeholder="Repite la nueva contraseña"
                  className="form-input"
                />

                {confirmarError && (
                  <span className="field-error">{confirmarError}</span>
                )}
              </div>

              {/* =================================================
                  MENSAJE GENERAL
              ================================================= */}

              {mensaje.texto && (
                <div
                  className={
                    mensaje.tipo === "error"
                      ? "error-message"
                      : "success-message"
                  }>
                  {mensaje.texto}
                </div>
              )}

              {/* =================================================
                  BOTÓN
              ================================================= */}

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
