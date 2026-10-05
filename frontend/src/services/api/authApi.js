// src/services/api/authApi.js
//
// Registro, inicio y cierre de sesión contra /api/auth.

import { apiFetch } from "./apiClient";

// El formulario de login manda el nombre de la pestaña ("Pasajero", "Conductor", "Administrador");
// el backend responde con el rol real de la cuenta.
export const ROL_DE_PESTANIA = {
  Pasajero: "pasajero",
  Conductor: "chofer",
  Administrador: "administrativo",
};

export const RUTA_POR_ROL = {
  pasajero: "/pasajero",
  chofer: "/conductor",
  administrativo: "/admin",
};

/** @returns {Promise<{ nombreUsuario: string, rol: string }>} */
export function login({ email, password }) {
  return apiFetch("/api/auth/login", { method: "POST", json: { email, password } });
}

export function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

/**
 * Envía la solicitud de registro. No crea el usuario: queda pendiente hasta que un administrador la acepte.
 * `certificado` es el objeto File que entrega el componente FileUpload.
 */
export function registrar({ nombre, apellido, email, password, confirmPassword, certificado }) {
  const body = new FormData();
  body.append("nombre", nombre);
  if (apellido) body.append("apellido", apellido);
  body.append("email", email);
  body.append("password", password);
  body.append("confirmPassword", confirmPassword);
  body.append("certificado", certificado);
  return apiFetch("/api/auth/register", { method: "POST", formData: body });
}
