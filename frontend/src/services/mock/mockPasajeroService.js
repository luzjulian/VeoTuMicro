// src/services/mock/mockPasajeroService.js
//
// Utilidades de matching por voz que no dependen del backend.

/**
 * Extrae el número de línea de un transcript de voz.
 * @param {string} transcript
 * @param {Array<{ nroLinea: string }>} lineas
 * @returns {{ nroLinea: string } | null}
 */
export function matchLineaPorVoz(transcript, lineas) {
  const numeros = transcript.match(/\d+/g);
  if (!numeros) return null;
  return lineas.find((l) => numeros.includes(l.nroLinea)) ?? null;
}