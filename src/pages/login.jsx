import React, { useState } from "react";
import "./login.css";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";

import { getApiUrl } from "../config/api.js";
import { isValidEmail } from "../lib/validators.js";
import { useAuth } from "../context/AuthContext.jsx";
import PasswordField from "../ui/PasswordField.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value) => {
    setEmail(value);

    if (!value.trim()) {
      setEmailError("Debe ingresar un correo.");
      return;
    }

    if (!isValidEmail(value)) {
      setEmailError("Ingrese un correo válido.");
      return;
    }

    setEmailError("");
  };

  const validatePassword = (value) => {
    setPassword(value);

    if (!value) {
      setPasswordError("Debe ingresar una contraseña.");
      return;
    }

    if (value.length < 8) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    setPasswordError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    /*
     * Validamos nuevamente al enviar para evitar que el
     * formulario pueda enviarse con datos inválidos.
     */
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Debe ingresar un correo.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError("Ingrese un correo válido.");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Debe ingresar una contraseña.");
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      hasError = true;
    }

    if (hasError) {
      toast.error("Revisa los datos ingresados.");
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading("Iniciando sesión...");

    try {
      const response = await fetch(
        getApiUrl("/auth/login"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Credenciales inválidas."
        );
      }

      /*
       * ========================================================
       * NUEVA CONTRASEÑA OBLIGATORIA
       * ========================================================
       */

      if (
        data.challenge === "NEW_PASSWORD_REQUIRED" ||
        data.challengeName === "NEW_PASSWORD_REQUIRED" ||
        !data.user
      ) {
        toast.dismiss(toastId);

        toast.success(
          "Clave temporal correcta. Debes crear una nueva contraseña."
        );

        const userIdForSrp =
          data.user_id_for_srp ||
          (
            data.challengeParameters &&
            data.challengeParameters.USER_ID_FOR_SRP
          ) ||
          email.trim();

        navigate("/reset-password", {
          state: {
            email: email.trim(),
            session: data.session,
            user_id_for_srp: userIdForSrp,
          },
        });

        return;
      }

      /*
       * ========================================================
       * LOGIN NORMAL
       * ========================================================
       */

      if (!data.token || !data.user) {
        throw new Error(
          "La respuesta del servidor no contiene una sesión válida."
        );
      }

      login(data.token, data.user);

      toast.success(
        "Bienvenido a EmotionLab.",
        {
          id: toastId,
        }
      );

      /*
       * Redirección inmediata según el rol.
       */
      if (data.user.rol === "admin") {
        navigate("/admin", {
          replace: true,
        });
        return;
      }

      if (data.user.rol === "teacher") {
        navigate("/teacher", {
          replace: true,
        });
        return;
      }

      throw new Error(
        "El usuario no tiene un rol válido configurado."
      );
    } catch (error) {
      console.error("Error de login:", error);

      const message =
        error instanceof TypeError
          ? "No pudimos conectar con el servidor. Intenta nuevamente."
          : error.message ||
            "No fue posible iniciar sesión.";

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        {/* ====================================================
            IDENTIDAD
           ==================================================== */}

        <header className="login-header">
          <div className="login-brand-mark">
            E
          </div>

          <div>
            <h1
              id="login-title"
              className="login-title"
            >
              EmotionLab
            </h1>

            <p className="login-subtitle">
              Plataforma de evaluación y análisis
            </p>
          </div>
        </header>

        {/* ====================================================
            FORMULARIO
           ==================================================== */}

        <form
          className="login-form"
          onSubmit={handleLogin}
          noValidate
        >
          {/* CORREO */}

          <div className="form-group">
            <label
              htmlFor="login-email"
              className="form-label"
            >
              Correo electrónico
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                validateEmail(event.target.value)
              }
              placeholder="Ingrese su correo electrónico"
              className={`form-input ${
                emailError
                  ? "form-input-error"
                  : ""
              }`}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              disabled={isLoading}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? "login-email-error"
                  : undefined
              }
            />

            {emailError && (
              <span
                id="login-email-error"
                className="field-error"
              >
                {emailError}
              </span>
            )}
          </div>

          {/* CONTRASEÑA */}

          <div className="login-password-wrapper">
            <PasswordField
              label="Contraseña"
              name="password"
              value={password}
              onChange={(event) =>
                validatePassword(
                  event.target.value
                )
              }
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
              error={passwordError}
              disabled={isLoading}
            />
          </div>

          {/* RECUPERACIÓN */}

          <div className="login-recovery">
            <Link
              to="/recuperar-contrasena"
              className="login-recovery-link"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* BOTÓN */}

          <button
            type="submit"
            className="form-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="login-button-spinner"
                  aria-hidden="true"
                />
                Iniciando sesión...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        {/* ====================================================
            PIE
           ==================================================== */}

        <footer className="login-footer">
          <span>
            EmotionLab · Plataforma de apoyo a la evaluación
          </span>
        </footer>
      </section>
    </main>
  );
}