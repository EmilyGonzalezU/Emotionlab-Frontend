import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getApiUrl } from "../config/api.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPassword() {
  const [token, setToken] = useState(null);
  const [claves, setClaves] = useState({
    nueva: "",
    confirmar: "",
  });
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({
    nueva: "",
    confirmar: "",
  });
const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const urlParams = window.location.hash.split('?')[1]; 
        const queryParams = new URLSearchParams(urlParams);
    
        const tokenUrl = queryParams.get("token");
        setToken(tokenUrl);
    }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClaves((prev) => ({ ...prev, [name]: value }));

    if (name === "nueva") {
      if (value.length > 0 && value.length < 8) {
        setErrores((prev) => ({ ...prev, nueva: "La contraseña debe tener al menos 8 caracteres" }));
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
    if (!claves.nueva || !claves.confirmar) {
      toast.error("Por favor, llena todos los campos.", { duration: 5000 });
      return false;
    }
    if (claves.nueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.", { duration: 5000 });
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

    if (!token) {
      toast.error("Falta el token de seguridad. Vuelve a solicitar el enlace de recuperación.");
      return;
    }

    if (!validarFormulario()) return;

    setCargando(true);

    try {
      // Hacemos un POST a una ruta nueva que crearemos en Python
      const respuesta = await fetch("http://localhost:5000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          new_password: claves.nueva,
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success("¡Contraseña actualizada con éxito! Redirigiendo...", { duration: 5000 });
        
        setClaves({ nueva: "", confirmar: "" });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);

      } else {
        toast.error(data.error || "El enlace es inválido o ha expirado.", { duration: 5000 });
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor.", { duration: 5000 });
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          <h2>Enlace Inválido</h2>
          <p>No se encontró el código de seguridad. Por favor, solicita un nuevo enlace de recuperación.</p>
          <a href="/forgot-password" style={{ color: "#007bff", textDecoration: "none", marginTop: "15px", display: "inline-block" }}>
            Volver
          </a>
        </div>
      </div>
    );
  }

return (
    <div className="login-container">
      <div className="login-card">
        <h2 style={{ marginBottom: '10px' }}>Crear nueva contraseña</h2>
        <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
          Tu nueva contraseña debe ser diferente a las anteriores.
        </p>

        <form onSubmit={guardarNuevaContrasena}>
          <div className="form-grupo" style={{ marginBottom: '15px' }}>
            <label className="form-label">Nueva contraseña</label>

            <div style={{ position: 'relative', marginTop: '5px' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="nueva"
                value={claves.nueva}
                onChange={manejarCambio}
                placeholder="Mínimo 8 caracteres"
                className={`input-field ${errores.nueva ? "input-error" : ""}`}
                style={{ width: '100%', padding: '10px', paddingRight: '40px' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errores.nueva && <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>{errores.nueva}</p>}
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
              <button
                type="button"

                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}>

                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errores.confirmar && <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>{errores.confirmar}</p>}
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#17315E',
              color: 'white',
              border: 'none',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? "Guardando..." : "Guardar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}