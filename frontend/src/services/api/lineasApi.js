// src/services/api/lineasApi.js

import { DEV_USERS } from '@/config/devAuth';

const devHeader = () => ({
  'Content-Type': 'application/json',
  'X-Dev-User': JSON.stringify(DEV_USERS.pasajero),
});

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: devHeader(),
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Trae todas las líneas con al menos un chofer activo.
 * @returns {Promise<Array<{ nroLinea: string, ramal: string }>>}
 */
export async function getLineasActivas() {
  return fetchJson('/api/lineas/activas');
}

/**
 * Encuentra la parada de ascenso más cercana a las coordenadas GPS del pasajero.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ nroParada: string, latitud: number, longitud: number }>}
 */
export async function getParadaCercana(lat, lon) {
  return fetchJson(`/api/paradas/cercana?lat=${lat}&lon=${lon}`);
}

/**
 * Valida que la línea elegida tenga arrivals en la parada detectada por GPS.
 * Resuelve si está disponible; lanza Error si no lo está.
 *
 * NOTA: el backend siempre responde 200 { disponible: boolean }.
 * Aquí convertimos disponible=false en un Error para mantener la interfaz
 * que espera SeleccionLineaPage (catch → mostrar modal de error).
 *
 * @param {string} nroLinea
 * @param {string} ramal
 * @param {string} nroParada
 * @returns {Promise<void>}
 * @throws {Error} si la línea no tiene arrivals en esa parada
 */
export async function validarLineaEnParada(nroLinea, ramal, nroParada) {
  const { disponible } = await fetchJson(
    `/api/lineas/disponible?nroLinea=${nroLinea}&ramal=${ramal}&nroParada=${encodeURIComponent(nroParada)}`
  );
  if (!disponible) {
    throw new Error(
      `La línea ${nroLinea} ramal ${ramal} no tiene próximos arrivals en esta parada`
    );
  }
}
