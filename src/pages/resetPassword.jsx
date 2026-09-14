import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { getApiUrl } from "../config/api.js";
import { validateNewPassword } from "../lib/passwordPolicy.js";
import PasswordField from "../ui/PasswordField.jsx";
import PasswordChecklist from "../ui/PasswordChecklist.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Atrapamos los datos del Login o de la pantalla de "Olvidé mi contraseña"
  const stateEmail = location.state?.email;
  const stateSession = location.state?.session;
  const stateUserIdForSrp = location.state?.user_id_for_srp || stateEmail;
  const modoRecuperacion = location.state?.modoRecuperacion; // <- NUEVA BANDERA

  const [codigo, setCodigo] = useState(""); // <- ESTADO PARA EL CÓDIGO DE 6 DÍGITOS
  const [claves, setClaves] = useState({ nueva: "", confirmar: "" });

  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({ nueva: "", confirmar: "" });

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClaves((prev) => ({ ...prev, [name]: value }));

    if (name === "nueva") {
      if (value.length > 0) {
        const { valid, message } = validateNewPassword(value);
        setErrores((prev) => ({ ...prev, nueva: valid ? "" : message }));
      } else {
        setErrores((prev) => ({ ...prev, nueva: "" }));
      }

      if (claves.confirmar && value !== claves.confirmar) {
        setErrores((prev) => ({ ...prev, confirmar: "Las contraseñas no coinciden" }));
      } else if (claves.confirmar && value === claves.confirmar) {
        setErrores((prev) => ({ ...prev, confirmar: "" }));
      }
    }

    if (name === "confirmar") {
      if (value && value !== claves.nueva) {
        setErrores((prev) => ({ ...prev, confirmar: "Las contraseñas no coinciden" }));
      } else {
        setErrores((prev) => ({ ...prev, confirmar: "" }));
      }
    }
  };

  const validarFormulario = () => {
    if (modoRecuperacion && (!codigo || codigo.length < 6)) {
      toast.error("Por favor, ingresa el código de 6 dígitos que llegó a tu correo.", { duration: 5000 });
      return false;
    }
    if (!claves.nueva || !claves.confirmar) {
      toast.error("Por favor, llena todos los campos.", { duration: 5000 });
      return false;
    }

    const { valid, message } = validateNewPassword(claves.nueva);
    if (!valid) {
      toast.error(message, { duration: 5000 });
      return false;
    }

    if (claves.nueva !== claves.confirmar) {
      toast.error("Las contraseñas no coinciden.", { duration: 5000 });
      return false;
    }
    return true;
  };

  const guardarNuevaContrasena = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setCargando(true);

    let endpoint = "";
    let payload = {};

    if (stateSession && stateEmail) {
      // Flujo 1: Clave Temporal
      endpoint = "/auth/confirm-new-password";
      payload = {
        email: stateEmail,
        user_id_for_srp: stateUserIdForSrp,
        session: stateSession,
        new_password: claves.nueva,
      };
    } else if (modoRecuperacion && stateEmail) {
      // Flujo 2: Cognito Forgot Password
      endpoint = "/auth/reset-password";
      payload = {
        email: stateEmail,
        code: codigo,
        new_password: claves.nueva,
      };
    }
    // Fase 5: se retiró aquí el "Flujo 3" legacy, que leía un ?token=
    // de la URL y lo enviaba como { token, new_password }. Confirmado
    // como código muerto: ningún camino del frontend (login.jsx,
    // forgotPassword.jsx) genera hoy un enlace con ese token — Login
    // usa el flujo de Cognito (Flujo 1, arriba) y "Olvidé mi
    // contraseña" siempre usa el flujo de código de 6 dígitos (Flujo
    // 2). El backend (routes/auth_routes.py) sigue aceptando ese
    // payload "mientras se migra frontend antiguo" para otros
    // posibles clientes, así que esto no requirió ni requiere ningún
    // cambio de backend.

    try {
      const respuesta = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success("¡Contraseña actualizada con éxito! Inicia sesión con tu nueva clave.", { duration: 5000 });
        setClaves({ nueva: "", confirmar: "" });
        setCodigo("");
        setTimeout(() => { navigate("/", { replace: true }); }, 2500);
      } else {
        toast.error(data.error || "Ocurrió un error al actualizar la contraseña.", { duration: 5000 });
      }
    } catch {
      toast.error("Error de conexión con el servidor.", { duration: 5000 });
    } finally {
      setCargando(false);
    }
  };

  // Validar si tiene acceso por alguno de los 2 flujos vigentes
  const tieneAcceso = (stateSession && stateEmail) || (modoRecuperacion && stateEmail);

  if (!tieneAcceso) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          <h2>Acceso Denegado</h2>
          <p>No se encontraron datos de seguridad. Por favor, inicia sesión o solicita un nuevo enlace.</p>
          <button type="button" onClick={() => navigate('/', { replace: true })}
            style={{ color: "#007bff", textDecoration: "none", marginTop: "15px", display: "inline-block", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 }}
          > Volver al Inicio </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 style={{ marginBottom: '10px' }}>Crear nueva contraseña</h2>

        {/* MENSAJE ESPECIAL SI VIENE DE RECUPERACIÓN */}
        {modoRecuperacion && (
          <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#15803d', backgroundColor: '#dcfce3', padding: '10px', borderRadius: '5px' }}>
            Te enviamos un código de 6 dígitos a <b>{stateEmail}</b>.
          </p>
        )}

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '0.85rem', color: '#334155', textAlign: 'left' }}>
            La contraseña debe incluir:
          </p>
          <PasswordChecklist value={claves.nueva} />
        </div>

        <form onSubmit={guardarNuevaContrasena}>

          {/* INPUT PARA EL CÓDIGO (SOLO APARECE EN RECUPERACIÓN) */}
          {modoRecuperacion && (
            <div className="form-grupo" style={{ marginBottom: '15px' }}>
              <label className="form-label">Código de Verificación</label>
              <input
                type="text"
                maxLength="6"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} // Solo permite números
                placeholder="Ej: 123456"
                className="input-field"
                style={{ width: '100%', padding: '10px', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <PasswordField
              label="Nueva contraseña"
              name="nueva"
              value={claves.nueva}
              onChange={manejarCambio}
              placeholder="Escribe tu contraseña"
              autoComplete="new-password"
              error={errores.nueva}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <PasswordField
              label="Confirmar contraseña"
              name="confirmar"
              value={claves.confirmar}
              onChange={manejarCambio}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              error={errores.confirmar}
            />
          </div>

          <button type="submit" disabled={cargando}
            style={{ width: '100%', padding: '10px', backgroundColor: '#17315E', color: 'white', border: 'none', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? "Guardando..." : "Guardar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
