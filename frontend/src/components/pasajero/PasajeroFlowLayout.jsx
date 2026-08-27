// src/components/pasajero/PasajeroFlowLayout.jsx
import { useState } from "react";
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

  const actualizarViaje = (cambios) =>
    setViaje((prev) => ({ ...prev, ...cambios }));

  const resetViaje = () => setViaje(ESTADO_INICIAL);

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col">
        <Outlet context={{ viaje, actualizarViaje, resetViaje }} />
      </div>
      <BottomNav bloqueado={viaje.estadoViaje === "a_bordo"} />
    </div>
  );
}