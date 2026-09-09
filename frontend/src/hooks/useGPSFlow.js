// src/hooks/useGPSFlow.js
import { useState, useCallback, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  useGeolocation,
  verificarPermisosGPS,
  esperarPermisoGPS,
} from "@/hooks/useGeolocation";
import { geocodificarCoordenadas } from "@/services/mock/mockGeocodingService";

const MAX_INTENTOS_GPS = 3;

/**
 * Encapsula el flujo completo de adquisición de ubicación GPS:
 * aviso ético → obtener coordenadas → geocoding → manejo de errores
 * con reintentos y verificación de permisos.
 *
 * Internamente el flujo es imperativo (while/try-catch/await) porque
 * es un algoritmo secuencial con loops y branches — pero el hook
 * expone solo estado reactivo hacia el componente, igual que
 * useSpeechRecognition o useSpeechSynthesis.
 */
export function useGPSFlow() {
  const [faseGPS, setFaseGPS] = useState(null);
  // null | "obteniendo" | "error_permisos" | "error_tecnico" | "exito"
  const [paradaGPS, setParadaGPS] = useState(null);

  const { speak } = useSpeechSynthesis();
  const { obtenerUbicacion } = useGeolocation();
  const intentosRef = useRef(0);

  const hablar = useCallback(
    (texto) => new Promise((resolve) => speak(texto, { onEnd: resolve })),
    [speak]
  );

  /**
   * Inicia el flujo GPS. Devuelve una Promise que resuelve con
   * { coords, direccion } cuando se obtiene la ubicación con éxito.
   * Nunca rechaza — reintenta indefinidamente (con los mensajes de
   * voz adecuados) hasta obtener las coordenadas.
   */
  const iniciarFlujoGPS = useCallback(async () => {
    intentosRef.current = 0;

    await hablar(
      "Se obtendrá tu ubicación mediante GPS para registrar tu parada de subida"
    );

    while (true) {
      setFaseGPS("obteniendo");

      try {
        const coords = await obtenerUbicacion();
        const direccion = await geocodificarCoordenadas(coords);

        setParadaGPS(direccion);
        setFaseGPS("exito");

        await hablar("Ubicación obtenida. Dirigiendo a la selección de destino");

        return { coords, direccion };
      } catch (err) {
        // ── Permiso denegado explícitamente ──
        if (err.code === 1) {
          setFaseGPS("error_permisos");
          await hablar(
            "No pudimos acceder a tu ubicación, necesitamos el permiso de GPS para continuar"
          );
          await esperarPermisoGPS();
          intentosRef.current = 0;
          continue;
        }

        // ── Error técnico / timeout ──
        intentosRef.current += 1;

        if (intentosRef.current >= MAX_INTENTOS_GPS) {
          const tienePermisos = await verificarPermisosGPS();
          intentosRef.current = 0;

          if (!tienePermisos) {
            setFaseGPS("error_permisos");
            await hablar(
              "No pudimos acceder a tu ubicación, necesitamos el permiso de GPS para continuar"
            );
            await esperarPermisoGPS();
          } else {
            setFaseGPS("obteniendo");
            await hablar(
              "Aguarde un momento mientras obtenemos su ubicación mediante GPS"
            );
          }
          continue;
        }

        setFaseGPS("error_tecnico");
        await hablar(
          "Aguarde un momento mientras obtenemos su ubicación mediante GPS"
        );
      }
    }
  }, [obtenerUbicacion, hablar]);

  return { faseGPS, paradaGPS, iniciarFlujoGPS };
}