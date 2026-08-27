// src/hooks/useVoiceFreeTextCapture.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceYesNo } from "@/hooks/useVoiceYesNo";

const MAX_INTENTOS = 10;
const MENSAJE_FALLBACK =
  "No pude reconocerte. Tocá el micrófono para reintentar, o escribí tu destino abajo";

export function useVoiceFreeTextCapture({
  mensajePregunta,
  formatearConfirmacion,
  mensajeConfirmadoTts,
  onConfirmado,
}) {
  const [valor, setValor] = useState(null);
  const [intentos, setIntentos] = useState(0);
  const [fallbackActivo, setFallbackActivo] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { speak } = useSpeechSynthesis();
  const { preguntar: preguntarSiNo, isListening: escuchandoConfirmacion } =
    useVoiceYesNo();

  const esperandoCaptura = useRef(false);
  const intentosRef = useRef(0);
  const yaIniciado = useRef(false);

  const pedirCaptura = useCallback(
    (mensaje) => {
      stopListening();
      resetTranscript();
      speak(mensaje ?? mensajePregunta, {
        onEnd: () => {
          esperandoCaptura.current = true;
          startListening();
        },
      });
    },
    [speak, startListening, stopListening, resetTranscript, mensajePregunta]
  );

  const confirmar = useCallback(
    (texto) => {
      preguntarSiNo(formatearConfirmacion(texto), {
        onSi: () => {
          setValor(texto);
          speak(mensajeConfirmadoTts, { onEnd: () => onConfirmado?.(texto) });
        },
        onNo: () => pedirCaptura(mensajePregunta),
        onNoReconocido: () => confirmar(texto),
      });
    },
    [preguntarSiNo, formatearConfirmacion, speak, mensajeConfirmadoTts, onConfirmado, pedirCaptura, mensajePregunta]
  );

  useEffect(() => {
    // Misma guarda contra doble-montaje de StrictMode que en
    // useVoiceListSelection — ver comentario allá para el detalle completo.
    if (yaIniciado.current) return;
    yaIniciado.current = true;
    pedirCaptura();

    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListening || !esperandoCaptura.current) return;
    esperandoCaptura.current = false;

    if (transcript?.trim()) {
      confirmar(transcript.trim());
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

    pedirCaptura();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const confirmarManual = useCallback(
    (texto) => {
      setValor(texto);
      onConfirmado?.(texto);
    },
    [onConfirmado]
  );

  const reintentarPorToque = useCallback(() => {
    intentosRef.current = 0;
    setIntentos(0);
    setFallbackActivo(false);
    pedirCaptura(mensajePregunta);
  }, [pedirCaptura, mensajePregunta]);

  return {
    valor,
    intentos,
    fallbackActivo,
    escuchando: isListening || escuchandoConfirmacion,
    confirmarManual,
    reintentarPorToque,
  };
}