// src/hooks/useEsperaVoiceFlow.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceQueue } from "@/hooks/useVoiceQueue";
import { interpretarSiNo } from "@/lib/voiceMatching";

const FRASES_CANCELACION = ["cancelar viaje", "cancelar solicitud", "cancelar"];

function esPedidoDeCancelacion(transcript) {
  const texto = transcript.toLowerCase();
  return FRASES_CANCELACION.some((f) => texto.includes(f));
}

/**
 * Orquesta TODO el reconocimiento de voz de Espera con una única instancia
 * de escucha (el navegador no permite dos sesiones activas en simultáneo).
 * Mientras la escucha constante está habilitada, se reinicia sola apenas
 * termina cada sesión (y el sistema no está hablando — flujo secuencial,
 * sin barge-in). Cada frase se evalúa primero contra "cancelar viaje"
 * (interrupción posible en cualquier momento); si no matchea, se enruta a
 * la pregunta pendiente (ej. "¿Has podido abordar?").
 */
export function useEsperaVoiceFlow({ onCancelar }) {
  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { encolar, vaciarCola, estaHablando } = useVoiceQueue();

  const [escuchaActiva, setEscuchaActiva] = useState(false);
  const [cancelado, setCancelado] = useState(false);
  const preguntaPendienteRef = useRef(null);

  useEffect(() => {
    if (!escuchaActiva || cancelado) return;
    if (isListening || estaHablando) return;

    resetTranscript();
    startListening();
  }, [escuchaActiva, isListening, estaHablando, cancelado, resetTranscript, startListening]);

  useEffect(() => {
    if (isListening || !transcript) return;

    if (esPedidoDeCancelacion(transcript)) {
      setEscuchaActiva(false);
      stopListening();
      setCancelado(true);
      vaciarCola();
      encolar("Viaje cancelado", { onEnd: () => onCancelar?.() });
      return;
    }

    const pregunta = preguntaPendienteRef.current;
    if (pregunta) {
      const resultado = interpretarSiNo(transcript);
      if (resultado === "si") {
        preguntaPendienteRef.current = null;
        pregunta.onSi?.();
      } else if (resultado === "no") {
        preguntaPendienteRef.current = null;
        pregunta.onNo?.();
      }
      // si no matchea nada, el efecto de arriba vuelve a escuchar solo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const iniciarEscuchaConstante = useCallback(() => setEscuchaActiva(true), []);

  const anunciar = useCallback((texto, opciones) => encolar(texto, opciones), [encolar]);

  const preguntarSiNo = useCallback(
    (texto, { onSi, onNo }) => {
      preguntaPendienteRef.current = { onSi, onNo };
      encolar(texto);
    },
    [encolar]
  );

  const cancelarPorTap = useCallback(() => {
    setEscuchaActiva(false);
    stopListening();
    setCancelado(true);
    vaciarCola();
    encolar("Viaje cancelado", { onEnd: () => onCancelar?.() });
  }, [stopListening, vaciarCola, encolar, onCancelar]);

  return {
    isListening,
    cancelado,
    iniciarEscuchaConstante,
    anunciar,
    preguntarSiNo,
    cancelarPorTap,
    vaciarCola,
  };
}