// src/pages/pasajero/SeleccionLineaPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { VoiceStatusCircle } from "@/components/pasajero/VoiceStatusCircle";
import { useVoiceListSelection } from "@/hooks/useVoiceListSelection";
import {
  getLineasCercanas,
  getParadaGPSActual,
  matchLineaPorVoz,
} from "@/services/mock/mockPasajeroService";

export default function SeleccionLineaPage() {
  const { actualizarViaje } = useOutletContext();
  const navigate = useNavigate();

  const [lineas, setLineas] = useState([]);
  const [paradaGPS, setParadaGPS] = useState(null);

  useEffect(() => {
    getLineasCercanas().then(setLineas);
    getParadaGPSActual().then(setParadaGPS);
  }, []);

  const confirmarSeleccion = (linea) => {
    if (!paradaGPS) return;
    actualizarViaje({
      nroLinea: linea.nroLinea,
      ramal: linea.ramal,
      paradaSubida: paradaGPS.direccion,
      estadoViaje: "seleccion_destino",
    });
    navigate("/pasajero/destino");
  };

  const { seleccion, fallbackActivo, escuchando, seleccionarManual, reintentarPorToque } =
    useVoiceListSelection({
      opciones: lineas,
      matchFn: matchLineaPorVoz,
      mensajePregunta: "Decí el número de línea",
      etiquetaOpcion: (l) => `Línea ${l.nroLinea}`,
      mensajeNoDisponible: (texto) => `${texto} no disponible, decí un número de línea disponible`,
      mensajeConfirmadoTts: "Dirigiendo a la selección de destino deseado",
      onConfirmado: confirmarSeleccion,
    });

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-texto-principal">Veo Tu Micro</h1>
          <p className="text-sm text-acento-secundario">Paso 1 de 3</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
          Línea
        </span>
      </header>

      <VoiceStatusCircle escuchando={escuchando} fallbackActivo={fallbackActivo} onRetry={reintentarPorToque} />
      <p className="text-center text-sm text-acento-secundario mt-2 mb-6">
        {seleccion
          ? `Línea ${seleccion.nroLinea} confirmada`
          : fallbackActivo
          ? "No pude reconocerte, tocá el micrófono para volver a intentar"
          : "Decí el número de línea"}
      </p>

      <ul className="space-y-3 flex-1" aria-label="Líneas sugeridas (apoyo visual)">
        {lineas.map((linea) => (
          <li key={linea.nroLinea}>
            <button
              type="button"
              onClick={() => {
                seleccionarManual(linea);
                confirmarSeleccion(linea);
              }}
              aria-pressed={seleccion?.nroLinea === linea.nroLinea}
              className={`w-full text-left flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                seleccion?.nroLinea === linea.nroLinea
                  ? "border-acento-primario bg-superficie-primaria"
                  : "border-superficie-primaria bg-fondo-secundario"
              }`}
            >
              <span className="h-8 w-8 rounded-full bg-superficie-media shrink-0" />
              <span>
                <span className="block font-bold text-texto-principal">Línea {linea.nroLinea}</span>
                <span className="block text-sm text-acento-secundario">{linea.ramal}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm py-4 border-t border-superficie-primaria mt-4">
        <span className="text-acento-secundario">Parada detectada (GPS)</span>
        <span className="font-bold text-texto-principal">{paradaGPS?.direccion ?? "Buscando…"}</span>
      </div>
    </div>
  );
}