// frontend/src/hooks/useSpeechSynthesis.js
import { useState, useRef, useCallback, useEffect } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

/**
 * Hook genérico de síntesis de voz (Text-to-Speech).
 *
 * @param {Object} options
 * @param {string} [options.lang="es-AR"] - Idioma preferido para elegir voz.
 */
export function useSpeechSynthesis({ lang = "es-AR" } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [error, setError] = useState(null);

  const isSupported = !!synth;
  const currentUtteranceRef = useRef(null);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => setVoices(synth.getVoices());

    loadVoices();
    // Chrome/Safari cargan las voces de forma asíncrona
    synth.addEventListener("voiceschanged", loadVoices);

    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, [isSupported]);

  const speak = useCallback(
    (text, { rate = 1, pitch = 1, onEnd } = {}) => {
      if (!isSupported || !text) return;

      // Cancelamos cualquier locución previa para evitar solapamientos
      synth.cancel();
      setError(null);

      // Pausa mínima entre cancel() y speak(): sin esto, Chrome puede dejar
      // el motor de síntesis atascado para siempre (bug conocido del
      // navegador al encadenar cancel()+speak() en el mismo tick de JS).
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        const preferredVoice =
          voices.find((v) => v.lang === lang) ||
          voices.find((v) => v.lang?.startsWith(lang.split("-")[0]));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          onEnd?.();
        };
        utterance.onerror = (event) => {
          setError(event.error);
          setIsSpeaking(false);
        };

        currentUtteranceRef.current = utterance;
        synth.speak(utterance);
      }, 50);
    },
    [isSupported, lang, voices]
  );

  const cancel = useCallback(() => {
    synth?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSupported, isSpeaking, voices, error, speak, cancel };
}