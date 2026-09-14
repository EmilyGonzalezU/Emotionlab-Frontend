/**
 * Validadores de formulario compartidos. Reemplaza las copias locales
 * del mismo regex de correo repetidas en login.jsx y
 * forgotPassword.jsx — una sola fuente de verdad, mismo criterio en
 * toda la app.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}
