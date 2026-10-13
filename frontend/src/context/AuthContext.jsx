// src/context/AuthContext.jsx
//
// Guarda quién está logueado para toda la app.
//   - Al cargar la página le pregunta al backend (GET /api/auth/me) y recupera la sesión,
//     así que recargar el navegador ya no obliga a volver a iniciar sesión.
//   - Expone login() y logout(); las pantallas no hablan con authApi para eso.
//
// usuario === null  → no hay sesión
// cargando === true → todavía no sabemos si hay sesión (primer pedido a /me)

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "@/services/api/authApi";
import { disconnectSocket } from "@/services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Recupera la sesión al abrir la app o recargar la página.
  useEffect(() => {
    let cancelado = false;
    authApi
      .obtenerSesion()
      .then((sesion) => {
        if (!cancelado) setUsuario(sesion);
      })
      .catch(() => {
        if (!cancelado) setUsuario(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Inicia sesión. Si se indica `rolEsperado` (el del tab del login) y la cuenta es de otro rol,
   * cierra la sesión recién abierta y lanza un Error con el mensaje para mostrar.
   * @returns {Promise<object>} la sesión ({ nombreUsuario, rol, nombre, apellido })
   */
  const login = useCallback(async ({ email, password, rolEsperado, nombreRolEsperado }) => {
    const { rol } = await authApi.login({ email, password });

    if (rolEsperado && rol !== rolEsperado) {
      await authApi.logout().catch(() => {});
      throw new Error(
        `Esta cuenta no es de ${nombreRolEsperado.toLowerCase()}. Elegí la pestaña que corresponde.`
      );
    }

    const sesion = await authApi.obtenerSesion();
    setUsuario(sesion);
    return sesion;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Aunque falle el cierre en el servidor, la sesión se cierra en la app.
    }
    disconnectSocket();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
