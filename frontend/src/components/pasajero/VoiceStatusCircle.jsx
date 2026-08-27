// src/components/pasajero/VoiceStatusCircle.jsx
import { Mic } from "lucide-react";

/**
 * Círculo de estado del micrófono. Tocable solo cuando `fallbackActivo` y
 * `onRetry` están presentes (Línea/Destino tras agotar los 10 intentos);
 * en el resto del flujo es puramente visual — la escucha es automática.
 */
export function VoiceStatusCircle({ escuchando, fallbackActivo = false, onRetry }) {
  const esTocable = fallbackActivo && !!onRetry;

  const clases = `mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all ${
    escuchando
      ? "border-acento-primario bg-acento-primario/20 animate-pulse"
      : "border-acento-secundario bg-superficie-primaria"
  }`;

  const icono = (
    <Mic className={`h-10 w-10 ${escuchando ? "text-acento-primario" : "text-acento-secundario"}`} />
  );

  if (esTocable) {
    return (
      <button
        type="button"
        onClick={onRetry}
        aria-label="Tocá para intentar de nuevo con el micrófono"
        className={`${clases} cursor-pointer`}
      >
        {icono}
      </button>
    );
  }

  return (
    <div aria-hidden="true" className={clases}>
      {icono}
    </div>
  );
}