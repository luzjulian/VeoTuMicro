// src/services/api/viajesApi.js
//
// Cliente HTTP para el módulo de viajes.
// DEV: autentica con X-Dev-User header (mismo mecanismo que Postman).
// PROD: las cookies JWT se envían automáticamente (credentials: 'include').
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea una instancia del API de viajes autenticada con el devUser indicado.
 * @param {{ sub: string, nombreUsuario: string, rol: string }} devUser
 */
export function createViajesApi(devUser) {
  const BASE = '/api/viajes';

  /** Cabecera de autenticación DEV */
  const authHeaders = {
    'Content-Type': 'application/json',
    'X-Dev-User': JSON.stringify(devUser),
  };

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include', // reenvía cookies en producción
      ...options,
      headers: { ...authHeaders, ...(options.headers ?? {}) },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Error ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  return {
    /**
     * POST /api/viajes
     * Requiere header Idempotency-Key (UUID v4) para prevenir viajes duplicados.
     *
     * @param {{ nroParada: string, nroLinea: string, ramal: string, destino: string }} body
     * @param {string} idempotencyKey UUID v4 generado por el cliente
     * @returns {Promise<{ nroViaje: number }>}
     */
    iniciarViaje: (body, idempotencyKey) =>
      fetchJson(BASE, {
        method:  'POST',
        body:    JSON.stringify(body),
        headers: { 'Idempotency-Key': idempotencyKey },
      }),

    /**
     * POST /api/viajes/:nroViaje/confirmar
     * @param {number} nroViaje ID autoincremental del viaje
     */
    confirmarViaje: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/confirmar`, { method: 'POST' }),

    /**
     * POST /api/viajes/:nroViaje/rechazar
     * @param {number} nroViaje ID autoincremental del viaje
     */
    rechazarViaje: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/rechazar`, { method: 'POST' }),

    /**
     * POST /api/viajes/:nroViaje/abordo
     * @param {number} nroViaje ID autoincremental del viaje
     */
    confirmarAscenso: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/abordo`, { method: 'POST' }),

    /**
     * POST /api/viajes/:nroViaje/proximidad
     * Avisa al pasajero que se acerca a su parada de descenso (simulado).
     * Idempotente en el backend: reintentar no reemite el evento.
     * @param {number} nroViaje ID autoincremental del viaje
     */
    notificarProximidad: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/proximidad`, { method: 'POST' }),

    /**
     * POST /api/viajes/:nroViaje/descenso
     * Confirma el descenso del pasajero → viaje pasa a FINALIZADO.
     * Idempotente en el backend: reintentar devuelve el mismo resultado.
     * @param {number} nroViaje ID autoincremental del viaje
     */
    confirmarDescenso: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/descenso`, { method: 'POST' }),
  };
}