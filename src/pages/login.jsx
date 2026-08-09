import React, { useState } from "react";
import "./Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast"; // <-- ¡Importamos la magia aquí! 🎈

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (value) => {
    setEmail(value);

    if (!value.trim()) {
      setEmailError("Debe ingresar un correo.");
      return;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(value)) {
      setEmailError("Ingrese un correo válido.");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value) => {
    setPassword(value);

    if (!value.trim()) {
      setPasswordError("Debe ingresar una contraseña.");
    } else if (value.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (emailError || passwordError) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    if (!email || !password) {
      toast.error("Complete todos los campos.");
      return;
    }

    // Ponemos un globito de carga mientras espera al servidor
    const toastId = toast.loading("Iniciando sesión...");

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

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ¡Cambiamos el globito a éxito! ✅
      toast.success("¡Bienvenido a EmotionLab!", { id: toastId });

      // Esperamos 1.5 segundos para que el usuario alcance a ver el globito verde antes de cambiar de pantalla
      setTimeout(() => {
        if (data.user.rol === "admin") {
          window.location.replace("/admin");
        } else if (data.user.rol === "teacher") {
          window.location.replace("/teacher");
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      // ¡Cambiamos el globito a error! ❌
      toast.error(err.message || "Error al iniciar sesión", { id: toastId });
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <h2 className="login-title">EmotionLab</h2>

        <p className="login-subtitle">
          Ingresa tus credenciales para continuar
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>

            <input
              type="email"
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              placeholder="Ingrese su correo electrónico."
              className="form-input"
              required
            />

            {emailError && <span className="field-error">{emailError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>

            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => validatePassword(e.target.value)}
                placeholder="Ingrese su contraseña."
                className="form-input"
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {passwordError && (
              <span className="field-error">{passwordError}</span>
            )}
          </div>

          <button type="submit" className="form-button">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
