// src/hooks/useVoiceListSelection.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceYesNo } from "@/hooks/useVoiceYesNo";

const MAX_INTENTOS = 10;
const MENSAJE_FALLBACK = "No pude reconocerte, tocá el micrófono para volver a intentar";

export function useVoiceListSelection({
  opciones,
  matchFn,
  mensajePregunta,
  etiquetaOpcion,
  mensajeNoDisponible,
  mensajeConfirmadoTts,
  onConfirmado,
}) {
  const [seleccion, setSeleccion] = useState(null);
  const [intentos, setIntentos] = useState(0);
  const [fallbackActivo, setFallbackActivo] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { speak } = useSpeechSynthesis();
  const { preguntar: preguntarSiNo, isListening: escuchandoConfirmacion } =
    useVoiceYesNo();

  const esperandoSeleccion = useRef(false);
  const intentosRef = useRef(0);

  
  const pedirSeleccion = useCallback(
    (mensaje) => {
      stopListening();
      resetTranscript();
      speak(mensaje ?? mensajePregunta, {
        onEnd: () => {
          // Se marca "esperando respuesta" recién acá, justo antes de
          // escuchar de verdad — así el efecto de matching no puede
          // dispararse en el hueco mientras el sistema todavía está
          // hablando (o ni empezó a hablar).
          esperandoSeleccion.current = true;
          startListening();
        },
      });
    },
    [speak, startListening, stopListening, resetTranscript, mensajePregunta]
  );

  const confirmar = useCallback(
    (match) => {
      preguntarSiNo(`${etiquetaOpcion(match)} seleccionada. ¿Confirmás? Decí sí o no`, {
        onSi: () => {
          setSeleccion(match);
          speak(mensajeConfirmadoTts, { onEnd: () => onConfirmado?.(match) });
        },
        onNo: () => pedirSeleccion(mensajePregunta),
        onNoReconocido: () => confirmar(match),
      });
    },
    [preguntarSiNo, etiquetaOpcion, speak, mensajeConfirmadoTts, onConfirmado, pedirSeleccion, mensajePregunta]
  );

  const yaIniciado = useRef(false);

  useEffect(() => {
    if (yaIniciado.current) return;
    yaIniciado.current = true;
    pedirSeleccion();

    // Ya NO reseteamos yaIniciado.current acá — un desmontaje real crea una
    // instancia nueva del componente con el ref en false de nuevo, así que
    // no hace falta forzarlo. Resetearlo acá es lo que rompía todo con el
    // doble-montaje de StrictMode (bug de Chrome: cancel()+speak() sin
    // pausa entre medio deja la síntesis de voz atascada para siempre).
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListening || !esperandoSeleccion.current) return;
    esperandoSeleccion.current = false;

    const match = matchFn(transcript, opciones);
    if (match) {
      confirmar(match);
      return;
    }

    intentosRef.current += 1;
    setIntentos(intentosRef.current);

    if (intentosRef.current >= MAX_INTENTOS) {
      stopListening();
      speak(MENSAJE_FALLBACK);
      setFallbackActivo(true);
      return;
    }

    pedirSeleccion(mensajeNoDisponible(transcript));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const seleccionarManual = useCallback(
    (match) => {
      setSeleccion(match);
      onConfirmado?.(match);
    },
    [onConfirmado]
  );

  // Reactivado por tap en el círculo tras agotar los 10 intentos: reinicia
  // el ciclo completo desde cero, no suma sobre el contador agotado.
  const reintentarPorToque = useCallback(() => {
    intentosRef.current = 0;
    setIntentos(0);
    setFallbackActivo(false);
    pedirSeleccion(mensajePregunta);
  }, [pedirSeleccion, mensajePregunta]);

  return {
    seleccion,
    intentos,
    fallbackActivo,
    escuchando: isListening || escuchandoConfirmacion,
    seleccionarManual,
    reintentarPorToque,
  };
}