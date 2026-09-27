// src/components/pasajero/ErrorLineaModal.jsx
//
// Modal de error que se muestra cuando la línea elegida no tiene arrivals
// en la parada detectada por GPS.
// - Lee el mensaje en voz alta al aparecer (TTS para no videntes)
// - Se cierra manualmente con el botón o automáticamente a los 5 segundos
// - Al cerrarse llama a onCerrar para que la página reinicie el flujo

import { useEffect, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

const DURACION_MS = 5000;
const MENSAJE = "La línea seleccionada no cuenta con una parada en la ubicación detectada";

export function ErrorLineaModal({ onCerrar }) {
  const { speak } = useSpeechSynthesis();
  const timerRef  = useRef(null);

  useEffect(() => {
    // Leer en voz alta apenas aparece el modal
    speak(MENSAJE);

    // Cierre automático a los 5 segundos
    timerRef.current = setTimeout(() => {
      onCerrar();
    }, DURACION_MS);

    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCerrar = () => {
    clearTimeout(timerRef.current);
    onCerrar();
  };

  return (
    /* Overlay semitransparente sobre toda la pantalla */
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={MENSAJE}
      className="fixed inset-0 z-50 flex items-center justify-center p-6
                 bg-fondo-principal/80 backdrop-blur-sm"
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl border border-estado-error
                   bg-superficie-primaria p-6 shadow-xl flex flex-col gap-4"
      >
        {/* Ícono de advertencia */}
        <div className="flex justify-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full
                       bg-estado-error/20 text-estado-error text-3xl"
          >
            ⚠
          </span>
        </div>

        {/* Mensaje */}
        <p className="text-center text-texto-principal font-semibold leading-snug">
          {MENSAJE}
        </p>

        {/* Barra de progreso (5 segundos) */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-superficie-media">
          <div
            className="h-full rounded-full bg-estado-error"
            style={{
              width: "100%",
              animation: `shrink ${DURACION_MS}ms linear forwards`,
            }}
          />
        </div>

        {/* Botón cerrar manual */}
        <button
          type="button"
          onClick={handleCerrar}
          className="w-full rounded-xl border border-superficie-media
                     bg-fondo-secundario py-3 text-sm font-bold
                     text-acento-primario transition-colors
                     hover:bg-superficie-media active:scale-95"
        >
          Cerrar
        </button>
      </div>

      {/* Keyframe para la barra de progreso */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}