import React, { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log("Status:", response.status);
      console.log("Respuesta:", data);

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      // Guardar token
      localStorage.setItem("token", data.token);

      // Guardar información del usuario
      localStorage.setItem("user", JSON.stringify(data.user));

      // Guardar rol por comodidad
      localStorage.setItem("rol", data.user.rol);

      console.log("=================================");
      console.log("LOGIN EXITOSO");
      console.log("Token:", data.token);
      console.log("Usuario:", data.user);
      console.log("Rol:", data.user.rol);
      console.log("=================================");

      alert(`Bienvenido ${data.user.nombre}`);

      // Cuando exista React Router simplemente reemplazar por:
      //
      // if (data.user.rol === "admin") {
      //     navigate("/admin");
      // } else {
      //     navigate("/teacher");
      // }

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al iniciar sesión");
    }
  };

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