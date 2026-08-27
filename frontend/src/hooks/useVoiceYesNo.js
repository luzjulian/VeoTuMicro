
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

    const resultado = interpretarSiNo(transcript);
    const callbacks = callbacksRef.current;
    if (!callbacks) return;

    if (resultado === "si") callbacks.onSi?.();
    else if (resultado === "no") callbacks.onNo?.();
    else callbacks.onNoReconocido?.();
  }, [isListening, transcript]);

  return { preguntar, isListening };
}