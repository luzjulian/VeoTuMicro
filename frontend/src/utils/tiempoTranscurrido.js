// src/utils/tiempoTranscurrido.js

/**
 * Devuelve un string legible del tiempo transcurrido desde `fechaISO`
 * hasta ahora, en formato "hace X min" / "hace X h" / "ahora".
 */
export function tiempoTranscurrido(fechaISO) {
  const ms = Date.now() - new Date(fechaISO).getTime();
  const minutos = Math.floor(ms / 60000);

  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  return `hace ${horas} h`;
}