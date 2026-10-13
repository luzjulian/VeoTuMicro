// src/components/pasajero/PasajeroFlowLayout.jsx
import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

const ESTADO_INICIAL = {
  nroLinea: null,
  ramal: null,
  paradaSubida: null,
  paradaDestino: null,
  numeroSolicitud: null,
  estadoViaje: "seleccion_linea",
  // 'seleccion_linea' | 'seleccion_destino' | 'en_espera' | 'a_bordo' | 'finalizado' | 'cancelado'
};

export function PasajeroFlowLayout() {
  const [viaje, setViaje] = useState(ESTADO_INICIAL);

  // Identidad estable: las páginas hijas usan estos callbacks como dependencias
  // de sus propios useCallback/useEffect (ver EsperaPage), así que recrearlos en
  // cada render invalidaría esas memoizaciones aguas abajo.
  const actualizarViaje = useCallback(
    (cambios) => setViaje((prev) => ({ ...prev, ...cambios })),
    []
  );
  const resetViaje = useCallback(() => setViaje(ESTADO_INICIAL), []);

  const contexto = useMemo(
    () => ({ viaje, actualizarViaje, resetViaje }),
    [viaje, actualizarViaje, resetViaje]
  );

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col">
        <Outlet context={contexto} />
      </div>
      <BottomNav bloqueado={viaje.estadoViaje === "a_bordo"} />
    </div>
  );
}