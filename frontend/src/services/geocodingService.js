// src/services/geocodingService.js
//
// Geocoding inverso real usando Nominatim (OpenStreetMap).
// Gratuito, sin API key.
//
// 🔁 Swap: reemplaza mockGeocodingService.js
// La interfaz es idéntica → el cambio es 1 línea de import en useGPSFlow.js
// ─────────────────────────────────────────────────────────────────────────────

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Convierte coordenadas GPS en una dirección legible.
 * Devuelve una intersección o dirección como "Calle 60 y 125, La Plata".
 *
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {Promise<string>} dirección legible
 */
export async function geocodificarCoordenadas(coords) {
  const { latitud: latitude, longitud: longitude } = coords;

  const params = new URLSearchParams({
    lat:            latitude,
    lon:            longitude,
    format:         'json',
    'accept-language': 'es',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      // Nominatim requiere un User-Agent identificatorio
      'User-Agent': 'VeoTuMicro/1.0 (proyecto universitario)',
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding falló: ${res.status}`);
  }

  const data = await res.json();

  // Construir string legible priorizando calle y número
  const addr = data.address ?? {};
  const calle = addr.road ?? addr.pedestrian ?? addr.path ?? '';
  const numero = addr.house_number ?? '';
  const ciudad = addr.city ?? addr.town ?? addr.village ?? '';

  if (calle) {
    return numero ? `${calle} ${numero}` : calle + (ciudad ? `, ${ciudad}` : '');
  }

  // Fallback: mostrar el display_name recortado
  return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? 'Ubicación obtenida';
}