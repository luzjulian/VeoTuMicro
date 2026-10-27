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

  /**
   * Habilita la síntesis de voz para el resto de la sesión.
   *
   * Safari en iOS ignora speechSynthesis.speak() si no se originó en un gesto
   * del usuario: no lanza error, simplemente no habla. Por eso la primera
   * locución tiene que salir de un toque real. Esta función emite una locución
   * muda dentro de ese gesto y deja el motor habilitado para las siguientes,
   * que ya pueden dispararse solas (por ejemplo, al entrar a una pantalla).
   *
   * IMPORTANTE: llama a speak() de forma SINCRÓNICA, sin setTimeout. Un
   * setTimeout corre fuera del gesto y la habilitación no surte efecto.
   *
   * Llamar desde el onClick/onSubmit del primer toque del flujo (el login).
   */
  const habilitarVoz = useCallback(() => {
    if (!isSupported) return;

    const muda = new SpeechSynthesisUtterance(" ");
    muda.volume = 0;   // inaudible
    muda.rate   = 10;  // termina de inmediato
    synth.speak(muda);
  }, [isSupported]);

  const cancel = useCallback(() => {
    synth?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSupported, isSpeaking, voices, error, speak, cancel, habilitarVoz };
}