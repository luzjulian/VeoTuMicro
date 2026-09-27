// src/pages/pasajero/SeleccionDestinoPage.jsx
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { VoiceStatusCircle } from "@/components/pasajero/VoiceStatusCircle";
import { useVoiceFreeTextCapture } from "@/hooks/useVoiceFreeTextCapture";
// 🔁 Swap: mock → servicio real (misma interfaz, ahora async)
import { crearSolicitud } from "@/services/pasajeroService";

export default function SeleccionDestinoPage() {
  const { viaje, actualizarViaje } = useOutletContext();
  const navigate = useNavigate();

  const [destinoManual, setDestinoManual] = useState("");
  const [cargando, setCargando]           = useState(false);
  const [errorApi, setErrorApi]           = useState(null);

  const confirmarDestino = async (direccion) => {
    setCargando(true);
    setErrorApi(null);
    try {
      const { nroViaje } = await crearSolicitud({
        nroParada: viaje.nroParada,
        nroLinea:  viaje.nroLinea,
        ramal:     viaje.ramal,
        destino:   direccion,
      });
      actualizarViaje({
        paradaDestino:   direccion,
        numeroSolicitud: nroViaje,   // ID autoincremental (Int) del backend
        estadoViaje:     "en_espera",
      });
      navigate("/pasajero/espera");
    } catch (err) {
      console.error('[SeleccionDestino] Error al crear viaje:', err.message);
      setErrorApi("No se pudo solicitar el viaje. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const { valor, fallbackActivo, escuchando, confirmarManual, reintentarPorToque } =
    useVoiceFreeTextCapture({
      mensajePregunta: "Decí tu parada de destino",
      formatearConfirmacion: (texto) => `${texto} seleccionada. ¿Confirmás? Decí sí o no`,
      mensajeConfirmadoTts: "Destino confirmado",
      onConfirmado: confirmarDestino,
    });

  const handleConfirmarManual = () => {
    if (!destinoManual.trim()) return;
    confirmarManual(destinoManual.trim());
    confirmarDestino(destinoManual.trim());
  };

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-texto-principal">¿Dónde bajás?</h1>
          <p className="text-sm text-acento-secundario">Paso 2 de 3</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
          Destino
        </span>
      </header>

      <VoiceStatusCircle escuchando={escuchando} fallbackActivo={fallbackActivo} onRetry={reintentarPorToque} />
      <p className="text-center text-sm text-acento-secundario mt-2 mb-6">
        {valor
          ? `${valor} confirmado`
          : fallbackActivo
          ? "No pude reconocerte, tocá el micrófono para volver a intentar"
          : "Decí tu parada de destino"}
      </p>

      <div className="space-y-3 mb-6">
        <Fila etiqueta="Línea" valor={`Línea ${viaje.nroLinea} — Ramal ${viaje.ramal}`} />
        <Fila etiqueta="Subida" valor={viaje.paradaSubida} />
        {valor && <Fila etiqueta="Destino ingresado" valor={valor} />}
      </div>

      {errorApi && (
        <div role="alert" className="bg-estado-error/10 border border-estado-error/40 rounded-lg p-3 mb-4 text-sm text-estado-error">
          {errorApi}
        </div>
      )}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => navigate("/pasajero/linea")}
        disabled={cargando}
        className="w-full border-2 border-acento-secundario text-acento-primario font-bold text-lg h-12 rounded-md mt-3 disabled:opacity-50"
      >
        {cargando ? "Enviando solicitud…" : "Volver"}
      </button>

      {fallbackActivo && (
        <div role="alert" className="bg-estado-error/10 border border-estado-error/40 rounded-lg p-4 space-y-3 mt-4">
          <p className="text-sm text-estado-error">
            No pudimos reconocer tu voz. Escribí tu destino o tocá el micrófono para reintentar.
          </p>
          <label className="block text-sm text-acento-secundario" htmlFor="destino-manual">
            Ingresá tu parada de destino
          </label>
          <input
            id="destino-manual"
            type="text"
            value={destinoManual}
            onChange={(e) => setDestinoManual(e.target.value)}
            placeholder="Ej: Calle 120 y 30"
            className="w-full h-12 rounded-md bg-fondo-secundario border border-superficie-primaria px-3 text-texto-principal"
          />
          <button
            type="button"
            onClick={handleConfirmarManual}
            className="w-full bg-estado-exito text-fondo-principal font-bold h-12 rounded-md"
          >
            Confirmar destino
          </button>
        </div>
      )}
    </div>
  );
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex items-center justify-between text-sm bg-fondo-secundario rounded-lg p-3">
      <span className="text-acento-secundario">{etiqueta}</span>
      <span className="font-bold text-texto-principal">{valor}</span>
    </div>
  );
}