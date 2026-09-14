/**
 * Política única de contraseña nueva (crear / recuperar / cambiar).
 *
 * Antes de esta fase existían TRES copias de esta regla, y no
 * coincidían entre sí — el hallazgo de la auditoría a corregir:
 *   - resetPassword.jsx exigía: 8+ caracteres, mayúscula, número Y
 *     carácter especial.
 *   - cuenta_admin.jsx / cuenta_visor.jsx exigían: 8+ caracteres,
 *     mayúscula Y carácter especial — SIN exigir número.
 * Es decir, un usuario podía pasar la validación del formulario de
 * "Cambiar contraseña" con una clave que el flujo de recuperación
 * (contra el mismo Cognito) habría rechazado por no tener número.
 *
 * Se adopta como única regla la más estricta de las dos (coincide con
 * la que ya se usaba contra Cognito en resetPassword.jsx), para que
 * el formulario nunca sea más permisivo que el backend real.
 *
 * Nota: esto NO aplica al campo de contraseña en login.jsx — ahí el
 * usuario está ingresando una contraseña que ya existe, no creando
 * una nueva, así que ese campo solo valida que no esté vacío.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS = [
  {
    id: "longitud",
    label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "mayuscula",
    label: "Al menos 1 letra mayúscula",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "numero",
    label: "Al menos 1 número",
    test: (value) => /\d/.test(value),
  },
  {
    id: "especial",
    label: "Al menos 1 carácter especial (!@#$...)",
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
];

/**
 * Devuelve el checklist con el estado actual de cada requisito, para
 * mostrar en vivo mientras el usuario escribe.
 */
export function getPasswordChecklist(value) {
  const safeValue = value || "";
  return PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    met: req.test(safeValue),
  }));
}

export function isPasswordValid(value) {
  const safeValue = value || "";
  return PASSWORD_REQUIREMENTS.every((req) => req.test(safeValue));
}

/**
 * Valida una contraseña nueva y devuelve un mensaje de error único
 * y consistente (el mismo texto en cualquier pantalla que cree o
 * cambie una contraseña).
 */
export function validateNewPassword(value) {
  const safeValue = value || "";
  if (!safeValue) {
    return { valid: false, message: "Debe ingresar una contraseña." };
  }
  if (!isPasswordValid(safeValue)) {
    return {
      valid: false,
      message: "La contraseña no cumple con los requisitos de seguridad.",
    };
  }
  return { valid: true, message: "" };
}
