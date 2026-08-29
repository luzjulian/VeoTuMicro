// src/hooks/useGeolocation.js
import { useState, useCallback } from "react";

/**
 * Hook genérico de geolocalización. Envuelve navigator.geolocation en el
 * mismo patrón que useSpeechRecognition/useSpeechSynthesis: el hook maneja
 * estado/error, y devuelve una función imperativa (obtenerUbicacion) que
 * retorna una Promise — ideal para flujos async secuenciales.
 *
 * En el futuro, el mismo hook se puede extender con watchPosition para el
 * tracking en tiempo real del conductor (2.8).
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle");
  // status: "idle" | "loading" | "success" | "error" | "permission_denied"
  const [error, setError] = useState(null);

  const obtenerUbicacion = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = { code: 0, message: "Geolocation not supported" };
        setError(err);
        setStatus("error");
        reject(err);
        return;
      }

      setStatus("loading");
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = {
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          };
          setCoords(c);
          setStatus("success");
          resolve(c);
        },
        (err) => {
          setError(err);
          setStatus(err.code === 1 ? "permission_denied" : "error");
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { coords, status, error, obtenerUbicacion };
}

/**
 * Consulta la Permissions API para saber si el usuario denegó explícitamente
 * el GPS. Devuelve true si tiene permisos o si no se puede verificar
 * (fallback conservador — se asume que sí los tiene y se intenta de nuevo).
 */
export async function verificarPermisosGPS() {
  try {
    const permStatus = await navigator.permissions.query({
      name: "geolocation",
    });
    return permStatus.state !== "denied";
  } catch {
    return true;
  }
}

/**
 * Espera a que el usuario conceda el permiso de GPS desde la configuración
 * del navegador/dispositivo. Usa la Permissions API si está disponible
 * (escucha el evento "change" en tiempo real); si no, espera 3 segundos
 * como fallback y reintenta.
 */
export async function esperarPermisoGPS() {
  try {
    const permStatus = await navigator.permissions.query({
      name: "geolocation",
    });
    if (permStatus.state === "granted" || permStatus.state === "prompt") return;

    // Estado "denied" — esperamos a que cambie
    return new Promise((resolve) => {
      const handler = () => {
        if (permStatus.state !== "denied") {
          permStatus.removeEventListener("change", handler);
          resolve();
        }
      };
      permStatus.addEventListener("change", handler);
    });
  } catch {
    // Permissions API no disponible — esperamos y dejamos que el flujo
    // reintente (el próximo getCurrentPosition mostrará el diálogo de
    // permisos en navegadores que lo soporten).
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}