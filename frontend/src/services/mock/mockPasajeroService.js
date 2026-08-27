// src/services/mock/mockPasajeroService.js
const LINEAS_MOCK = [
  { nroLinea: "307", ramal: "La Plata — La Plata Centro" },
  { nroLinea: "202", ramal: "La Plata — Ensenada" },
  { nroLinea: "275", ramal: "La Plata — City Bell" },
];

const PARADA_GPS_MOCK = { direccion: "Calle 60 y 125" };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLineasCercanas() {
  await delay(400);
  return LINEAS_MOCK;
}

// Ubicación GPS real donde se origina la solicitud (2.4) y donde el
// pasajero efectivamente aborda (confirmado en 2.6) — corresponde a
// ParadaAscenso en el DER. paradaDestino, en cambio, es texto libre sin
// validar contra ninguna tabla (se define en SeleccionDestinoPage).
export async function getParadaGPSActual() {
  await delay(300);
  return PARADA_GPS_MOCK;
}

export function matchLineaPorVoz(transcript, lineas) {
  const numeros = transcript.match(/\d+/g);
  if (!numeros) return null;
  return lineas.find((l) => numeros.includes(l.nroLinea)) ?? null;
}