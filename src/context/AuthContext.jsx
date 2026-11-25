import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthStorage } from "../lib/authStorage.js";
import { clearPrivateQueryCache } from "../lib/privateQueryCache.js";

const AuthContext = createContext(null);

function leerRolDesdeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rol || payload.role || null;
  } catch {
    return null;
  }
}

function leerSesionInicial() {
  const token = localStorage.getItem("token");
  const rolGuardado = localStorage.getItem("rol");
  const userRaw = localStorage.getItem("user");

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  const rol = rolGuardado || (token ? leerRolDesdeToken(token) : null);

  return { token, user, rol };
}

/**
 * Centraliza la lectura de sesión (token, usuario, rol) que hoy está
 * repartida entre rutaProtegida.jsx, los sidebars y visualizadores_admin.jsx
 * (cada uno decodificando el JWT a su manera). No cambia las claves de
 * localStorage (`token`, `user`, `rol`) ni el mecanismo de login: las
 * pantallas existentes siguen funcionando igual mientras se migran
 * gradualmente a `useAuth()` en las fases siguientes.
 */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionInicial);
  const queryClient = useQueryClient();

  const clearAccountData = useCallback(() => {
    clearPrivateQueryCache(queryClient);
  }, [queryClient]);

  const login = useCallback((token, user) => {
    clearAccountData();
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (user?.rol) localStorage.setItem("rol", user.rol);
    setSesion({ token, user, rol: user?.rol || leerRolDesdeToken(token) });
  }, [clearAccountData]);

  const logout = useCallback(() => {
    clearAuthStorage();
    clearAccountData();
    setSesion({ token: null, user: null, rol: null });
  }, [clearAccountData]);

  useEffect(() => {
    window.addEventListener("emotionlab:session-expired", logout);
    return () => window.removeEventListener("emotionlab:session-expired", logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      token: sesion.token,
      user: sesion.user,
      rol: sesion.rol,
      isAuthenticated: Boolean(sesion.token),
      login,
      logout,
    }),
    [sesion, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return ctx;
}
