// src/hooks/useVoiceYesNo.js
import { useCallback, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { interpretarSiNo } from "@/lib/voiceMatching";

export function useVoiceYesNo() {
  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { speak } = useSpeechSynthesis();

  const callbacksRef = useRef(null);
  const esperandoRespuesta = useRef(false);

  const preguntar = useCallback(
    (promptText, { onSi, onNo, onNoReconocido }) => {
      callbacksRef.current = { onSi, onNo, onNoReconocido };
      // Cortamos cualquier sesión de reconocimiento previa antes de reiniciar:
      // evita que un resultado tardío de la sesión anterior se pegue al
      // transcript de la nueva (bug de texto duplicado).
      stopListening();
      resetTranscript();
      esperandoRespuesta.current = false;
      speak(promptText, {
        onEnd: () => {
          // Se marca "esperando respuesta" recién cuando el TTS termina de
          // verdad, no antes — si no, hay una ventana de carrera donde el
          // efecto de abajo puede dispararse con isListening=false y
          // esperandoRespuesta=true al mismo tiempo que se monta el hook.
          esperandoRespuesta.current = true;
          startListening();
        },
      });
    },
    [speak, startListening, stopListening, resetTranscript]
  );

  useEffect(() => {
    if (isListening || !esperandoRespuesta.current) return;
    esperandoRespuesta.current = false;

    const callbacks = callbacksRef.current;
    if (!callbacks) return;

    // Sin transcript (silencio, error "no-speech", etc.) cuenta como no
    // reconocido, no se ignora en silencio.
    if (!transcript) {
      callbacks.onNoReconocido?.();
      return;
    }

    const resultado = interpretarSiNo(transcript);
    if (resultado === "si") callbacks.onSi?.();
    else if (resultado === "no") callbacks.onNo?.();
    else callbacks.onNoReconocido?.();
  }, [isListening, transcript]);

  return { preguntar, isListening };
}