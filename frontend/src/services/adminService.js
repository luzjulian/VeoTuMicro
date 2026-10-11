// src/services/adminService.js
//
// Panel administrativo contra /api/admin. Reemplaza a mock/mockAdminService.js
// con las mismas funciones y las mismas formas de datos, así que los hooks y componentes no cambian.

import { apiFetch } from "./api/apiClient";

export const obtenerKpis = () => apiFetch("/api/admin/kpis");

export const obtenerSolicitudes = () => apiFetch("/api/admin/solicitudes");

/** @param {number} id  @param {"aceptar" | "rechazar"} decision */
export const evaluarSolicitud = (id, decision) =>
  apiFetch(`/api/admin/solicitudes/${id}/${decision}`, { method: "POST" });

// Pasajeros activos y conductores en ruta "en vivo".
//
// El backend ya emite el evento Socket.io `kpis_actualizados`, pero el navegador NO manda la cookie de
// sesión al socket (la cookie del access token tiene path "/api" y el socket va por "/socket.io"),
// así que no se puede autenticar desde acá todavía. Mientras tanto se consulta cada pocos segundos,
// con el mismo contrato que el mock: onEvent("kpis_actualizados", { ... }) y devuelve cómo cancelar.
const MS_ENTRE_CONSULTAS = 15000;

export function suscribirseAKpis(onEvent) {
  const consultar = async () => {
    if (typeof document !== "undefined" && document.hidden) return; // pestaña en segundo plano
    try {
      const { pasajerosActivos, conductoresEnRuta } = await obtenerKpis();
      onEvent("kpis_actualizados", { pasajerosActivos, conductoresEnRuta });
    } catch {
      // Si falla (sesión vencida, servidor caído) se reintenta en la próxima vuelta.
    }
  };

  const intervalo = setInterval(consultar, MS_ENTRE_CONSULTAS);
  return () => clearInterval(intervalo);
}
