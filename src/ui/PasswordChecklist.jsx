import React from "react";
import { FiCheck } from "react-icons/fi";
import { getPasswordChecklist } from "../lib/passwordPolicy.js";
import "./PasswordChecklist.css";

/**
 * Checklist en vivo de los requisitos de una contraseña nueva. Antes
 * vivía solo dentro de resetPassword.jsx, con estilos en línea; ahora
 * se reutiliza también en Cuenta (cambio de contraseña) para que
 * ambas pantallas muestren exactamente los mismos requisitos, en el
 * mismo orden, con el mismo criterio (ver lib/passwordPolicy.js).
 */
export default function PasswordChecklist({ value }) {
  const items = getPasswordChecklist(value || "");

  return (
    <ul className="el-password-checklist">
      {items.map((item) => (
        <li
          key={item.id}
          className={`el-password-checklist-item${item.met ? " met" : ""}`}
        >
          <span className="el-password-checklist-icon" aria-hidden="true">
            {item.met ? <FiCheck /> : null}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
