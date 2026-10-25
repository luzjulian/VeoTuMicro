// src/lib/voiceMatching.js
const PALABRAS_SI = ["si", "sí", "correcto", "afirmativo", "dale"];
const PALABRAS_NO = ["no", "negativo", "incorrecto"];

export function interpretarSiNo(transcript) {
  const texto = transcript.toLowerCase().trim();
  if (PALABRAS_SI.some((p) => texto.includes(p))) return "si";
  if (PALABRAS_NO.some((p) => texto.includes(p))) return "no";
  return null;
}

// ─── Calles dichas en voz alta ────────────────────────────────────────────────
// El reconocimiento de voz puede devolver "54" o "cincuenta y cuatro", "avenida 13" o
// "la avenida trece". Esta función lo deja siempre como "avenida 13" / "calle 54", que es
// lo que entiende el backend. Los nombres que no llevan número (Camino Centenario) pasan igual.

const UNIDADES = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21,
  veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const DECENAS = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};
const CENTENAS = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400,
  quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

const valorNumerico = (t) => CENTENAS[t] ?? DECENAS[t] ?? UNIDADES[t];

export function normalizarCalleHablada(transcript) {
  const tokens = String(transcript)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:¿?¡!]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Artículos y "número" al principio no aportan ("la avenida trece", "calle número 54")
  while (["la", "el", "las", "los"].includes(tokens[0])) tokens.shift();

  const salida = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "numero" || tokens[i] === "nro") continue;

    if (valorNumerico(tokens[i]) === undefined) {
      salida.push(tokens[i]);
      continue;
    }

    // Una racha de palabras numéricas ("ciento veinte", "cincuenta y cuatro") se suma
    let total = 0;
    let anteriorDecena = false;
    while (i < tokens.length) {
      const t = tokens[i];
      const v = valorNumerico(t);
      if (v !== undefined) {
        total += v;
        anteriorDecena = t in DECENAS;
        i++;
      } else if (t === "y" && anteriorDecena && UNIDADES[tokens[i + 1]] >= 1 && UNIDADES[tokens[i + 1]] <= 9) {
        i++;
        anteriorDecena = false;
      } else {
        break;
      }
    }
    i--; // el for vuelve a sumar uno
    salida.push(String(total));
  }

  return salida.join(" ");
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
