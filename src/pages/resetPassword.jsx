import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { getApiUrl } from "../config/api.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🕵️‍♀️ Atrapamos los datos del Login o de la pantalla de "Olvidé mi contraseña"
  const stateEmail = location.state?.email;
  const stateSession = location.state?.session;
  const stateUserIdForSrp = location.state?.user_id_for_srp || stateEmail;
  const modoRecuperacion = location.state?.modoRecuperacion; // <- NUEVA BANDERA

  const [token, setToken] = useState(null);
  const [codigo, setCodigo] = useState(""); // <- ESTADO PARA EL CÓDIGO DE 6 DÍGITOS
  const [claves, setClaves] = useState({ nueva: "", confirmar: "" });
  
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({ nueva: "", confirmar: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!stateSession && !modoRecuperacion) {
      try {
        const urlParams = window.location.hash.split('?')[1];
        if (urlParams) {
          const queryParams = new URLSearchParams(urlParams);
          setToken(queryParams.get("token"));
        }
      } catch (e) {
        console.error("No se pudo leer la URL", e);
      }
    }
  }, [stateSession, modoRecuperacion]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClaves((prev) => ({ ...prev, [name]: value }));

    if (name === "nueva") {
      const tieneMayuscula = /[A-Z]/.test(value);
      const tieneNumero = /\d/.test(value);
      const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (value.length > 0 && value.length < 8) {
        setErrores((prev) => ({ ...prev, nueva: "Mínimo 8 caracteres" }));
      } else if (value.length > 0 && (!tieneMayuscula || !tieneNumero || !tieneEspecial)) {
        setErrores((prev) => ({ ...prev, nueva: "Falta mayúscula, número o carácter especial" }));
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
    
    const tieneMayuscula = /[A-Z]/.test(claves.nueva);
    const tieneNumero = /\d/.test(claves.nueva);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(claves.nueva);
    
    if (claves.nueva.length < 8 || !tieneMayuscula || !tieneNumero || !tieneEspecial) {
      toast.error("La contraseña no cumple con los requisitos de seguridad.", { duration: 5000 });
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
      // Flujo 2: Cognito Forgot Password (NUEVO)
      endpoint = "/auth/reset-password";
      payload = {
        email: stateEmail,
        code: codigo,
        new_password: claves.nueva,
      };
    } else if (token) {
      // Flujo 3: Legacy Token
      endpoint = "/auth/reset-password";
      payload = { token: token, new_password: claves.nueva };
    }

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

  // Validar si tiene acceso por cualquiera de los 3 flujos
  const tieneAcceso = token || (stateSession && stateEmail) || (modoRecuperacion && stateEmail);

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

        <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#334155' }}>La contraseña debe incluir:</p>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li style={{ color: claves.nueva.length >= 8 ? '#15803d' : '#64748b', fontWeight: claves.nueva.length >= 8 ? '600' : 'normal', transition: 'all 0.3s' }}>Mínimo 8 caracteres</li>
            <li style={{ color: /[A-Z]/.test(claves.nueva) ? '#15803d' : '#64748b', fontWeight: /[A-Z]/.test(claves.nueva) ? '600' : 'normal', transition: 'all 0.3s' }}>Al menos 1 letra mayúscula</li>
            <li style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(claves.nueva) ? '#15803d' : '#64748b', fontWeight: /[!@#$%^&*(),.?":{}|<>]/.test(claves.nueva) ? '600' : 'normal', transition: 'all 0.3s' }}>Al menos 1 carácter especial (!@#$...)</li>
          </ul>
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

          <div className="form-grupo" style={{ marginBottom: '15px' }}>
            <label className="form-label">Nueva contraseña</label>
            <div style={{ position: 'relative', marginTop: '5px' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="nueva"
                value={claves.nueva}
                onChange={manejarCambio}
                placeholder="Escribe tu contraseña"
                className={`input-field ${errores.nueva ? "input-error" : ""}`}
                style={{ width: '100%', padding: '10px', paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-grupo" style={{ marginBottom: '20px' }}>
            <label className="form-label">Confirmar contraseña</label>
            <div style={{ position: 'relative', marginTop: '5px' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmar"
                value={claves.confirmar}
                onChange={manejarCambio}
                placeholder="Repite la contraseña"
                className={`input-field ${errores.confirmar ? "input-error" : ""}`}
                style={{ width: '100%', padding: '10px', paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errores.confirmar && <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>{errores.confirmar}</p>}
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