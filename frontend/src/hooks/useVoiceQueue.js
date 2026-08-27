// src/hooks/useVoiceQueue.js
import { useCallback, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

/**
 * Serializa anuncios de voz para que nunca se pisen entre sí, sin importar
 * en qué momento llega el evento que los dispara (timers de mock hoy,
 * eventos de Socket.io mañana — el reemplazo es directo).
 */
export function useVoiceQueue() {
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();
  const colaRef = useRef([]);
  const hablandoRef = useRef(false);

  const procesarSiguiente = useCallback(() => {
    if (hablandoRef.current) return;
    const siguiente = colaRef.current.shift();
    if (!siguiente) return;

    hablandoRef.current = true;
    speak(siguiente.texto, {
      ...siguiente.opciones,
      onEnd: () => {
        hablandoRef.current = false;
        siguiente.opciones?.onEnd?.();
        procesarSiguiente();
      },
    });
  }, [speak]);

  const encolar = useCallback(
    (texto, opciones = {}) => {
      colaRef.current.push({ texto, opciones });
      procesarSiguiente();
    },
    [procesarSiguiente]
  );

  const vaciarCola = useCallback(() => {
    colaRef.current = [];
    cancel();
    hablandoRef.current = false;
  }, [cancel]);

  return { encolar, vaciarCola, estaHablando: isSpeaking };
}