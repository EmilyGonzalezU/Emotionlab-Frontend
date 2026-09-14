import React, { useId, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./PasswordField.css";

/**
 * Campo de contraseña con mostrar/ocultar. Reemplaza cinco
 * implementaciones distintas del mismo control repartidas en
 * login.jsx, resetPassword.jsx (x2) y cuenta_admin.jsx/cuenta_visor.jsx
 * (x3 cada uno, con SVGs dibujados a mano en vez de usar react-icons,
 * ya presente en el proyecto).
 *
 * Solo entiende de mostrar/ocultar y error — no impone ninguna regla
 * de contraseña. El checklist de requisitos vive aparte, en
 * PasswordChecklist, para que login.jsx (que no crea una contraseña)
 * pueda usar este mismo campo sin arrastrar ese checklist.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  error,
  placeholder,
  name,
  autoComplete,
  disabled = false,
  id,
}) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className="el-password-field">
      {label && (
        <label className="el-password-field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <div className="el-password-field-control">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`el-password-field-input${error ? " has-error" : ""}`}
        />
        <button
          type="button"
          className="el-password-field-toggle"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {error && <p className="el-password-field-error">{error}</p>}
    </div>
  );
}
