// Cliente HTTP para el módulo de viajes.
// La sesión viaja en la cookie del access token (credentials: 'include'):
// el backend resuelve quién es el usuario, el cliente no necesita saberlo.
// ─────────────────────────────────────────────────────────────────────────────

/** Crea una instancia del API de viajes para la sesión actual. */
export function createViajesApi(devUser) {
  const BASE = '/api/viajes';

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include', // manda la cookie de sesion
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
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
     * GET /api/viajes/activo
     * Viaje en curso del pasajero autenticado (PENDIENTE, CONFIRMADO o ABORDO),
     * para recuperar el flujo después de recargar la página.
     * @returns {Promise<object | null>}
     */
    obtenerViajeActivo: () => fetchJson(`${BASE}/activo`),

    /**
     * GET /api/viajes/activos
     * Viajes en curso del chofer autenticado, para rehidratar la bandeja del
     * panel después de recargar la página.
     * @returns {Promise<object[]>}
     */
    obtenerViajesActivos: () => fetchJson(`${BASE}/activos`),

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

    /**
     * POST /api/viajes/:nroViaje/cancelar
     * El pasajero cancela su solicitud → el conductor libera el cupo.
     * Solo válido desde PENDIENTE o CONFIRMADO.
     * Idempotente en el backend: reintentar no reemite el evento.
     * @param {number} nroViaje ID autoincremental del viaje
     * @returns {Promise<{ estado: 'CANCELADO', notificado: boolean }>}
     */
    cancelarViaje: (nroViaje) =>
      fetchJson(`${BASE}/${nroViaje}/cancelar`, { method: 'POST' }),
  };
}