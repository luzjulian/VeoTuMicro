// frontend/src/hooks/useSpeechRecognition.js
import { useState, useRef, useCallback, useEffect } from "react";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Hook genérico de reconocimiento de voz (Speech-to-Text).
 *
 * @param {Object} options
 * @param {string} [options.lang="es-AR"] - Idioma de reconocimiento.
 * @param {boolean} [options.continuous=false] - Escucha continua.
 *   En iOS Safari, `continuous: true` es poco confiable — se recomienda
 *   dejar en `false` y reiniciar manualmente si hace falta.
 * @param {boolean} [options.interimResults=true] - Emitir resultados parciales
 *   mientras el usuario habla (útil para feedback visual en vivo).
 */
export function useSpeechRecognition({
  lang = "es-AR",
  continuous = false,
  interimResults = true,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isSupported = !!SpeechRecognitionAPI;

  useEffect(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }

      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk}`.trim() : finalChunk.trim()));
      }
      setInterimTranscript(interimChunk);
    };

    recognition.onerror = (event) => {
      // Errores típicos: "no-speech", "audio-capture", "not-allowed"
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, [lang, continuous, interimResults, isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("not-supported");
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() lanza error si ya estaba escuchando — se ignora a propósito
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}