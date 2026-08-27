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
  const yaIniciado = useRef(false);

  const pedirSeleccion = useCallback(
    (mensaje) => {
      stopListening();
      resetTranscript();
      speak(mensaje ?? mensajePregunta, {
        onEnd: () => {
          // Se marca "esperando" recién en onEnd (ver useVoiceYesNo para
          // el detalle de por qué evita el falso intento fallido al montar).
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

  useEffect(() => {
    // Guarda contra el doble-montaje de StrictMode en desarrollo: sin esto,
    // React monta -> desmonta -> vuelve a montar y se dispara speak() dos
    // veces casi en simultáneo, lo que deja la síntesis de voz de Chrome
    // atascada (bug conocido del navegador con cancel()+speak() sin pausa).
    // OJO: no resetear yaIniciado.current en la limpieza — un desmontaje
    // real crea una instancia nueva del hook con el ref en false de nuevo,
    // así que no hace falta forzarlo, y forzarlo es lo que rompía todo.
    if (yaIniciado.current) return;
    yaIniciado.current = true;
    pedirSeleccion();

    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListening || !esperandoSeleccion.current) return;
    esperandoSeleccion.current = false;

    const match = transcript ? matchFn(transcript, opciones) : null;
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

    pedirSeleccion(transcript ? mensajeNoDisponible(transcript) : mensajePregunta);
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
  // el ciclo completo desde cero.
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