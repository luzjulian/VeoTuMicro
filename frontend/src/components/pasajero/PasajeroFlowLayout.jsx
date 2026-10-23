// src/components/pasajero/PasajeroFlowLayout.jsx
//
// Sostiene el estado del viaje para todo el flujo del pasajero y lo recupera
// del backend al montar, así recargar la página (o perder la conexión y volver)
// devuelve al pasajero a la pantalla donde estaba en lugar de expulsarlo al
// inicio. Mismo patrón que AuthContext con GET /api/auth/me.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { obtenerViajeActivo } from "@/services/pasajeroService";
import { geocodificarCoordenadas } from "@/services/geocodingService";

const ESTADO_INICIAL = {
  nroLinea: null,
  ramal: null,
  paradaSubida: null,
  paradaDestino: null,
  numeroSolicitud: null,
  estadoViaje: "seleccion_linea",
  // 'seleccion_linea' | 'seleccion_destino' | 'en_espera' | 'a_bordo' | 'finalizado' | 'cancelado'
};

// Estado del viaje en el backend → estado del flujo en el front + su pantalla.
const DESTINO_POR_ESTADO = {
  PENDIENTE:  { estadoViaje: "en_espera", ruta: "/pasajero/espera" },
  CONFIRMADO: { estadoViaje: "en_espera", ruta: "/pasajero/espera" },
  ABORDO:     { estadoViaje: "a_bordo",   ruta: "/pasajero/viaje" },
};

export function PasajeroFlowLayout() {
  const [viaje, setViaje] = useState(ESTADO_INICIAL);
  // Mientras no sepamos si hay un viaje en curso no podemos renderizar las
  // páginas hijas: sus guards ven numeroSolicitud en null y redirigen al inicio
  // antes de que llegue la respuesta del backend.
  const [recuperando, setRecuperando] = useState(true);
  // Datos del viaje recuperado que el front no puede deducir de su propio
  // estado: el estado real del backend (estadoViaje colapsa PENDIENTE y
  // CONFIRMADO en "en_espera") y el ETA, porque la cuenta regresiva es
  // client-side y la arranca el evento viaje:confirmado, que en un viaje ya
  // confirmado no vuelve a llegar. EsperaPage los usa para retomar el viaje.
  const [recuperado, setRecuperado] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  // La ruta de entrada se lee una sola vez: después de la redirección inicial
  // el pasajero navega por su cuenta y el layout no vuelve a intervenir.
  const rutaInicialRef = useRef(location.pathname);

  const actualizarViaje = useCallback(
    (cambios) => setViaje((prev) => ({ ...prev, ...cambios })),
    []
  );
  const resetViaje = useCallback(() => {
    setViaje(ESTADO_INICIAL);
    setRecuperado(null);
  }, []);

  useEffect(() => {
    let cancelado = false;

    obtenerViajeActivo()
      .then(async (activo) => {
        if (cancelado || !activo) return;

        const destino = DESTINO_POR_ESTADO[activo.estado];
        if (!destino) return; // estado terminal: no hay nada que recuperar

        // La parada de subida se guarda como dirección legible durante el
        // flujo normal; acá la reconstruimos desde las coordenadas igual que
        // hace el panel del conductor, con el nroParada como fallback.
        let paradaSubida = activo.nroParada;
        if (activo.paradaLatitud != null && activo.paradaLongitud != null) {
          try {
            paradaSubida = await geocodificarCoordenadas({
              latitud:  activo.paradaLatitud,
              longitud: activo.paradaLongitud,
            });
          } catch {
            // Sin red o sin respuesta del geocoder: queda el nroParada.
          }
        }
        if (cancelado) return;

        setViaje({
          nroLinea:        activo.nroLinea,
          ramal:           activo.ramal,
          ramalNombre:     `Línea ${activo.nroLinea} - Ramal ${activo.ramal}`,
          nroParada:       activo.nroParada,
          paradaSubida,
          paradaDestino:   activo.destino,
          numeroSolicitud: activo.nroViaje,
          estadoViaje:     destino.estadoViaje,
        });
        setRecuperado({
          estado:         activo.estado,
          estimadoArribo: activo.estimadoArribo ?? null,
        });

        if (rutaInicialRef.current !== destino.ruta) {
          navigate(destino.ruta, { replace: true });
        }
      })
      .catch((err) => {
        // Si la consulta falla el pasajero arranca el flujo de cero, que es el
        // comportamiento que ya tenía. No lo bloqueamos por esto.
        console.warn("[PasajeroFlowLayout] no se pudo recuperar el viaje:", err.message);
      })
      .finally(() => {
        if (!cancelado) setRecuperando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [navigate]);

  // Identidad estable: las páginas hijas usan estos callbacks como dependencias
  // de sus propios useCallback/useEffect (ver EsperaPage), así que recrearlos en
  // cada render invalidaría esas memoizaciones aguas abajo.
  const contexto = useMemo(
    () => ({ viaje, actualizarViaje, resetViaje, recuperado }),
    [viaje, actualizarViaje, resetViaje, recuperado]
  );

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col">
        {recuperando ? (
          <p
            role="status"
            className="flex-1 flex items-center justify-center text-sm text-acento-secundario"
          >
            Recuperando tu viaje…
          </p>
        ) : (
          <Outlet context={contexto} />
        )}
      </div>
      <BottomNav bloqueado={viaje.estadoViaje === "a_bordo"} />
    </div>
  );
}