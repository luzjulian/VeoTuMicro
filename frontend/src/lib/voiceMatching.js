// src/lib/voiceMatching.js
const PALABRAS_SI = ["si", "sí", "correcto", "afirmativo", "dale"];
const PALABRAS_NO = ["no", "negativo", "incorrecto"];

export function interpretarSiNo(transcript) {
  const texto = transcript.toLowerCase().trim();
  if (PALABRAS_SI.some((p) => texto.includes(p))) return "si";
  if (PALABRAS_NO.some((p) => texto.includes(p))) return "no";
  return null;
}

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