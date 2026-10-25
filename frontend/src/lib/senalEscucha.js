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
    const oscilador = contexto.createOscillator();
    const volumen = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    // Sube y baja el volumen rápido para que no suene un "clic" al empezar y terminar
    volumen.gain.setValueAtTime(0.0001, ahora);
    volumen.gain.exponentialRampToValueAtTime(0.25, ahora + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.18);

    oscilador.connect(volumen).connect(contexto.destination);
    oscilador.start(ahora);
    oscilador.stop(ahora + 0.2);
  } catch {
    // Si el navegador no deja reproducir el sonido, la escucha sigue igual
  }
}
