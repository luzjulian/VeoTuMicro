// frontend/src/lib/senalEscucha.js
//
// Tono corto que avisa "ya podés hablar": la persona no ve la pantalla, así que sin una
// señal no sabe cuándo el micrófono empezó a escuchar. Se genera con Web Audio (sin
// archivos de sonido).

let contexto = null;

export function sonarSenalEscucha() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    contexto ??= new AudioCtx();
    if (contexto.state === "suspended") contexto.resume();

    const ahora = contexto.currentTime;

    // Dos notas ascendentes (se nota más que un solo bip y suena a "ahora te toca").
    // Onda triangular: más presente que una senoidal, sin llegar a ser molesta.
    [
      { frecuencia: 880, inicio: 0 },
      { frecuencia: 1320, inicio: 0.17 },
    ].forEach(({ frecuencia, inicio }) => {
      const oscilador = contexto.createOscillator();
      const volumen = contexto.createGain();
      const t0 = ahora + inicio;

      oscilador.type = "triangle";
      oscilador.frequency.value = frecuencia;
      // Sube y baja el volumen rápido para que no suene un "clic" al empezar y terminar
      volumen.gain.setValueAtTime(0.0001, t0);
      volumen.gain.exponentialRampToValueAtTime(0.6, t0 + 0.02);
      volumen.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);

      oscilador.connect(volumen).connect(contexto.destination);
      oscilador.start(t0);
      oscilador.stop(t0 + 0.22);
    });
  } catch {
    // Si el navegador no deja reproducir el sonido, la escucha sigue igual
  }
}

// ─── Indicación inicial ──────────────────────────────────────────────────────
// La primera vez que el pasajero interactúa por voz se le explica para qué es el tono.
// Después suena solo el tono. Se recuerda por sesión del navegador (sessionStorage):
// se vuelve a decir al abrir la app de nuevo o al iniciar sesión otra persona.

export const INDICACION_TONO = "Hola pasajero, recuerde responder después del tono.";

const CLAVE_INDICACION = "veotumicro.indicacionTonoDada";
let indicacionDadaEnMemoria = false; // por si el navegador no deja usar sessionStorage

/** Devuelve true solo la primera vez (y la marca como dada). */
export function consumirIndicacionTono() {
  try {
    if (sessionStorage.getItem(CLAVE_INDICACION)) return false;
    sessionStorage.setItem(CLAVE_INDICACION, "1");
    return true;
  } catch {
    if (indicacionDadaEnMemoria) return false;
    indicacionDadaEnMemoria = true;
    return true;
  }
}

/** Al cerrar sesión: la próxima persona que entre vuelve a escuchar la indicación. */
export function olvidarIndicacionTono() {
  indicacionDadaEnMemoria = false;
  try {
    sessionStorage.removeItem(CLAVE_INDICACION);
  } catch {
    // sin sessionStorage no hay nada que borrar
  }
}
