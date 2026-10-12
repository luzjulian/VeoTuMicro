// src/services/api/apiClient.js
//
// Cliente HTTP único para hablar con el backend.
//   - Manda siempre la cookie de sesión (credentials: "include").
//   - Traduce los errores del backend ({ error: "..." }) a un ApiError con `status` y `message`.
//   - Si el access token venció (401), intenta renovarlo UNA vez con /api/auth/refresh y repite el pedido.
//
// Las URLs son relativas ("/api/..."): el proxy de Vite las envía al backend (puerto 5000).

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// En estas rutas un 401 es una respuesta normal (credenciales malas, sin sesión...): no se reintenta.
const SIN_REFRESH = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
];

let refrescando = null;

// Si varios pedidos fallan a la vez por token vencido, se hace un solo refresh.
function refrescarSesion() {
  if (!refrescando) {
    refrescando = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refrescando = null;
      });
  }
  return refrescando;
}

/**
 * @param {string} url  ruta relativa, por ejemplo "/api/admin/kpis"
 * @param {{ method?: string, json?: object, formData?: FormData, reintentar?: boolean }} [opciones]
 */
export async function apiFetch(url, { method = "GET", json, formData, reintentar = true } = {}) {
  const opciones = { method, credentials: "include", headers: {} };

  if (json !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(json);
  } else if (formData) {
    // Sin Content-Type a propósito: el navegador lo arma con el límite (boundary) del multipart.
    opciones.body = formData;
  }

  let res;
  try {
    res = await fetch(url, opciones);
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  if (res.status === 401 && reintentar && !SIN_REFRESH.includes(url) && (await refrescarSesion())) {
    return apiFetch(url, { method, json, formData, reintentar: false });
  }

  if (res.status === 204) return null;

  const esJson = (res.headers.get("content-type") || "").includes("application/json");
  const cuerpo = esJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(cuerpo?.error || `Error ${res.status} del servidor.`, res.status);
  }

  return cuerpo;
}
