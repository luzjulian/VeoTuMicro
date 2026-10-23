// src/services/api/perfilApi.js
//
// Perfil de la persona logueada (/api/perfil). El backend sabe quién es por la cookie.

import { apiFetch } from "./apiClient";

export function obtenerPerfil() {
  return apiFetch("/api/perfil");
}

export function actualizarPerfil({ nombre, apellido, email, telefono }) {
  return apiFetch("/api/perfil", {
    method: "PATCH",
    json: { nombre, apellido, email, telefono },
  });
}