// src/services/mock/mockGeocodingService.js

/**
 * Mock de geocoding inverso (coordenadas → dirección legible).
 * En producción, esta lógica vive en el backend (ej. Nominatim/OSM)
 * para proteger los datos de ubicación del pasajero. El frontend
 * solo va a enviar las coordenadas al backend y recibir el string
 * de vuelta — este mock simula esa respuesta.
 */
export async function geocodificarCoordenadas(/* coords */) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return "Calle 60 y 125";
}