// src/hooks/useConductorRealtime.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useVoiceQueue } from "@/hooks/useVoiceQueue";
// 🔁 Swap: mock → servicio real (misma interfaz)
import {
  suscribirsePanelConductor,
  simularAbordajeMock,
  notificarRechazoMock,
  notificarProximidadMock,
  confirmarDescensoMock,
} from "@/services/conductorService";

// Cada cuánto se repite el recordatorio de bajada hasta que el conductor
// confirme el descenso. El repo comprime el tiempo en las demos; si querés
// que sea observable en segundos, bajá este valor.
const REPETICION_RECORDATORIO_MS = 3 * 60 * 1000; // 3 minutos

/**
 * Orquesta el tiempo real del Panel del Conductor (2.8).
 *
 * El conductor sólo interactúa por interfaz gráfica (nunca micrófono): este
 * hook usa SÓLO salida de voz (useVoiceQueue → TTS), nunca reconocimiento.
 *
 * Toda la comunicación pasa por mockConductorService, de modo que migrar a
 * Socket.io más adelante no toque este hook ni la UI.
 */
export function useConductorRealtime() {
  const { encolar, vaciarCola } = useVoiceQueue();

  const [solicitudes, setSolicitudes] = useState([]);
  const [recordatorio, setRecordatorio] = useState(null); // { solicitud } | null

  // Espejo de solicitudes para leer el valor actual dentro de callbacks
  // estables sin recrearlos ante cada cambio de estado.
  const solicitudesRef = useRef([]);
  useEffect(() => {
    solicitudesRef.current = solicitudes;
  }, [solicitudes]);

  const abordajeTimersRef = useRef({}); // numeroSolicitud -> cleanup
  const repeticionRef = useRef(null); // setTimeout del próximo recordatorio

  const detenerRepeticion = useCallback(() => {
    if (repeticionRef.current) {
      clearTimeout(repeticionRef.current);
      repeticionRef.current = null;
    }
  }, []);

  // Muestra el modal, dice el recordatorio UNA vez, y al terminar de hablar
  // lo cierra (para que el conductor pueda ver el resto de las solicitudes)
  // y programa que vuelva a aparecer en REPETICION_RECORDATORIO_MS. Se repite
  // así hasta que el conductor confirme la bajada (confirmarBajada corta el
  // ciclo con detenerRepeticion).
  const programarRecordatorio = useCallback(
    (solicitud) => {
      setRecordatorio({ solicitud });
      encolar(`Recordatorio. El pasajero baja en ${solicitud.paradaDestino}.`, {
        onEnd: () => {
          setRecordatorio(null);
          repeticionRef.current = setTimeout(
            () => programarRecordatorio(solicitud),
            REPETICION_RECORDATORIO_MS
          );
        },
      });
    },
    [encolar]
  );

  const abrirRecordatorio = useCallback(
    (solicitud) => {
      // El recordatorio es nuestra señal simulada de "proximidad a la parada"
      // (sin GPS real todavía) → avisamos al pasajero vía backend, UNA sola
      // vez (la idempotencia del backend lo protege igual, pero no hace
      // falta llamarlo de nuevo en cada repetición del recordatorio).
      notificarProximidadMock(solicitud.numeroSolicitud);

      detenerRepeticion();
      programarRecordatorio(solicitud);
    },
    [detenerRepeticion, programarRecordatorio]
  );

  const manejarEvento = useCallback(
    (evento, payload) => {
      if (evento === "solicitudes_iniciales") {
        // Las solicitudes ya en curso no se anuncian por voz.
        setSolicitudes(payload.solicitudes);
      }

      if (evento === "nueva_solicitud") {
        const s = payload.solicitud;
        setSolicitudes((prev) => [s, ...prev]);
        encolar(
          `Nueva solicitud. Línea ${s.nroLinea}. Sube en ${s.paradaSubida}. Baja en ${s.paradaDestino}.`
        );
      }

      if (evento === "pasajero_a_bordo") {
        // Mezclar el payload con la solicitud almacenada en estado para que
        // el recordatorio tenga todos los datos (nombre, destino real, etc.)
        const solicitudGuardada = solicitudesRef.current.find(
          (s) => s.numeroSolicitud === payload.numeroSolicitud
        );
        setSolicitudes((prev) =>
          prev.map((s) =>
            s.numeroSolicitud === payload.numeroSolicitud
              ? { ...s, estado: "a_bordo" }
              : s
          )
        );
        abrirRecordatorio({ ...(solicitudGuardada ?? {}), ...payload });
      }
    },
    [encolar, abrirRecordatorio]
  );

  useEffect(() => {
    const unsubscribe = suscribirsePanelConductor(manejarEvento);

    return () => {
      unsubscribe();
      Object.values(abordajeTimersRef.current).forEach((cleanup) => cleanup?.());
      detenerRepeticion();
      vaciarCola();
    };
  }, [manejarEvento, detenerRepeticion, vaciarCola]);

  const aceptarSolicitud = useCallback(
    (numeroSolicitud) => {
      vaciarCola(); // silencia el anuncio en curso, sin TTS de confirmación

      const solicitud = solicitudesRef.current.find(
        (s) => s.numeroSolicitud === numeroSolicitud
      );
      if (!solicitud) return;

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.numeroSolicitud === numeroSolicitud ? { ...s, estado: "aceptada" } : s
        )
      );

      abordajeTimersRef.current[numeroSolicitud] = simularAbordajeMock(
        numeroSolicitud,
        { paradaDestino: solicitud.paradaDestino, pasajero: solicitud.pasajero },
        manejarEvento
      );
    },
    [vaciarCola, manejarEvento]
  );

  const rechazarSolicitud = useCallback(
    (numeroSolicitud) => {
      vaciarCola();
      encolar("Solicitud rechazada");
      notificarRechazoMock(numeroSolicitud);
      setSolicitudes((prev) =>
        prev.filter((s) => s.numeroSolicitud !== numeroSolicitud)
      );
    },
    [vaciarCola, encolar]
  );

  const confirmarBajada = useCallback(
    (numeroSolicitud) => {
      detenerRepeticion();
      vaciarCola();
      setRecordatorio(null);
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.numeroSolicitud === numeroSolicitud
            ? { ...s, estado: "finalizada" }
            : s
        )
      );
      // El pasajero se entera en tiempo real vía socket 'descenso:confirmado'
      // (ver pasajeroService → suscribirseABordo, usado en ABordoPage).
      confirmarDescensoMock(numeroSolicitud);
    },
    [detenerRepeticion, vaciarCola]
  );

  return {
    solicitudes,
    recordatorio,
    aceptarSolicitud,
    rechazarSolicitud,
    confirmarBajada,
  };
}