import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Agregamos esto
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate(); // 2. Iniciamos el hook para navegar

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      // Guardar datos
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("rol", data.user.rol);

      alert(`Bienvenido ${data.user.nombre}`);

      if (data.user.rol === "admin") {
          navigate("/admin"); // Te manda a la ruta del admin
      } else {
          navigate("/teacher"); // Te manda a la ruta del profe
      }

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al iniciar sesión");
    }
  };

  //aca solo van como los componentes de la pagina, que hace que despues sepueda modificar el diseño de la pag

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <h2 className="login-title">Login EmotionLab</h2>
        <p className="login-subtitle">
          Ingresa tus credenciales para continuar
        </p>

        {errorMsg && (
          <div className="error-message">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@emotionlab.cl"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="form-button"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}