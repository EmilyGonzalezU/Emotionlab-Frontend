import React from "react";
import "./Button.css";

const VARIANTS = ["primary", "secondary", "danger", "ghost"];

/**
 * Botón base del sistema. Reemplaza las ~15 variantes de `.btn-*` con
 * estilos inline dispersas por pantalla (btn-crear, btn-guardar,
 * btn-accion, btn-toast-azul, etc.), unificadas en 4 variantes con
 * función clara: primary (acción principal), secondary (acción
 * alternativa), danger (acción destructiva), ghost (acción de bajo
 * énfasis, p. ej. "Cancelar").
 */
export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  type = "button",
  children,
  ...rest
}) {
  const variantClass = VARIANTS.includes(variant) ? variant : "primary";

  return (
    <button
      type={type}
      className={`el-btn el-btn-${variantClass} el-btn-${size}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="el-btn-spinner" aria-hidden="true" />
      ) : (
        Icon && <Icon className="el-btn-icon" aria-hidden="true" />
      )}
      <span>{children}</span>
    </button>
  );
}
