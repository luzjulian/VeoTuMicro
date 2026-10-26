// src/components/pasajero/ErrorLineaModal.jsx
//
// Modal de error que se muestra cuando la línea elegida no tiene arrivals
// en la parada detectada por GPS.
// - Lee el mensaje en voz alta al aparecer (TTS para no videntes)
// - Si recibe onManual (el GPS pudo haber ubicado mal), avisa por voz que se puede ingresar
//   la ubicación a mano y ESPERA la respuesta ("sí" / "no"): no se cierra solo, para que la
//   persona tenga tiempo de decidir. Sin respuesta tras varios intentos, se cierra.
// - Sin onManual: se cierra manualmente con el botón o automáticamente a los 5 segundos
// - Al cerrarse llama a onCerrar para que la página reinicie el flujo

import { useEffect, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceYesNo } from "@/hooks/useVoiceYesNo";

const DURACION_MS = 5000;
const MENSAJE = "La línea seleccionada no cuenta con una parada en la ubicación detectada";
const PREGUNTA_MANUAL =
  `${MENSAJE}. Si el GPS te ubicó mal, podés ingresar tu ubicación manualmente. ¿Querés hacerlo? Decí sí o no`;
const REPETIR_PREGUNTA = "No te escuché. ¿Querés ingresar tu ubicación manualmente? Decí sí o no";
const MAX_INTENTOS_RESPUESTA = 3;

export function ErrorLineaModal({ onCerrar, onManual }) {
  const { speak } = useSpeechSynthesis();
  const { preguntar, isListening } = useVoiceYesNo();
  const timerRef   = useRef(null);
  const resueltoRef = useRef(false); // true cuando la persona ya decidió (voz o toque)
  const iniciadoRef = useRef(false);
  const intentosRef = useRef(0);

  const ofreceManual = !!onManual;

  useEffect(() => {
    if (!ofreceManual) {
      // Leer en voz alta apenas aparece el modal y cerrar solo a los 5 segundos
      speak(MENSAJE);
      timerRef.current = setTimeout(() => onCerrar(), DURACION_MS);
      return () => clearTimeout(timerRef.current);
    }

    // Guarda contra el doble montaje de StrictMode (mismo patrón que useVoiceFreeTextCapture)
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    // Con ubicación manual disponible: se avisa por voz y se espera la respuesta
    const preguntarManual = (texto) =>
      preguntar(texto, {
        onSi: () => {
          if (resueltoRef.current) return;
          resueltoRef.current = true;
          onManual();
        },
        onNo: () => {
          if (resueltoRef.current) return;
          resueltoRef.current = true;
          onCerrar();
        },
        onNoReconocido: () => {
          if (resueltoRef.current) return;
          intentosRef.current += 1;
          if (intentosRef.current >= MAX_INTENTOS_RESPUESTA) {
            resueltoRef.current = true;
            onCerrar();
            return;
          }
          preguntarManual(REPETIR_PREGUNTA);
        },
      });
    preguntarManual(PREGUNTA_MANUAL);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCerrar = () => {
    resueltoRef.current = true;
    clearTimeout(timerRef.current);
    onCerrar();
  };

  // Ubicación manual elegida con el botón
  const handleManual = () => {
    resueltoRef.current = true;
    clearTimeout(timerRef.current);
    onManual();
  };

  return (
    /* Overlay semitransparente sobre toda la pantalla */
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={ofreceManual ? PREGUNTA_MANUAL : MENSAJE}
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

        {ofreceManual ? (
          <p className="text-center text-sm text-acento-secundario" aria-live="polite">
            {isListening
              ? "Escuchando… decí sí o no"
              : "¿Querés ingresar tu ubicación manualmente?"}
          </p>
        ) : (
          /* Barra de progreso (5 segundos) */
          <div className="h-1 w-full overflow-hidden rounded-full bg-superficie-media">
            <div
              className="h-full rounded-full bg-estado-error"
              style={{
                width: "100%",
                animation: `shrink ${DURACION_MS}ms linear forwards`,
              }}
            />
          </div>
        )}

        {onManual && (
          <button
            type="button"
            onClick={handleManual}
            className="w-full rounded-xl bg-acento-primario py-3 text-sm font-bold
                       text-fondo-principal transition-colors active:scale-95"
          >
            Ingresar mi ubicación manualmente
          </button>
        )}

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