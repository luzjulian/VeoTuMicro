// src/components/pasajero/UbicacionManualModal.jsx
//
// Ubicación manual por VOZ, para cuando el GPS ubica mal al pasajero (la app es para
// personas no videntes, así que todo se dice y se escucha):
//   1. "Decí la primera calle"  → se repite lo entendido y se confirma con sí / no
//   2. "Decí la segunda calle"  → igual
//   3. Se busca la parada más cercana a esa esquina (la búsqueda la hace la página)
// Si la búsqueda falla, se dice el motivo y se vuelve a pedir las dos calles.
// Igual que en el destino: si la voz falla muchas veces aparece un campo para escribir.

import { useCallback, useState } from "react";
import { VoiceStatusCircle } from "@/components/pasajero/VoiceStatusCircle";
import { useVoiceFreeTextCapture } from "@/hooks/useVoiceFreeTextCapture";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { normalizarCalleHablada } from "@/lib/voiceMatching";

/** Pide UNA calle por voz (o por texto si la voz falla). Se monta una vez por calle. */
function CapturaCalle({ pregunta, onConfirmada }) {
  const [escrita, setEscrita] = useState("");

  const { valor, fallbackActivo, escuchando, confirmarManual, reintentarPorToque } =
    useVoiceFreeTextCapture({
      mensajePregunta: pregunta,
      formatearConfirmacion: (texto) =>
        `${normalizarCalleHablada(texto)}. ¿Confirmás? Decí sí o no`,
      mensajeConfirmadoTts: "Calle confirmada",
      onConfirmado: (texto) => onConfirmada(normalizarCalleHablada(texto)),
    });

  return (
    <>
      <VoiceStatusCircle
        escuchando={escuchando}
        fallbackActivo={fallbackActivo}
        onRetry={reintentarPorToque}
      />
      <p className="text-center text-sm text-acento-secundario" aria-live="polite">
        {valor
          ? `${normalizarCalleHablada(valor)} confirmada`
          : fallbackActivo
          ? "No pude reconocerte, tocá el micrófono para volver a intentar"
          : pregunta}
      </p>

      {fallbackActivo && (
        <div className="space-y-2">
          <label htmlFor="calle-escrita" className="block text-sm text-acento-secundario">
            O escribí la calle
          </label>
          <input
            id="calle-escrita"
            type="text"
            value={escrita}
            onChange={(e) => setEscrita(e.target.value)}
            placeholder="Ej: calle 54 o avenida 13"
            autoComplete="off"
            maxLength={60}
            className="w-full h-12 rounded-md bg-fondo-secundario border border-superficie-media px-3 text-texto-principal"
          />
          <button
            type="button"
            onClick={() => escrita.trim() && confirmarManual(escrita.trim())}
            className="w-full bg-acento-primario text-fondo-principal font-bold h-12 rounded-md"
          >
            Confirmar calle
          </button>
        </div>
      )}
    </>
  );
}

/**
 * @param {{
 *   linea: { nroLinea: string, ramal: string },
 *   onBuscar: (calle1: string, calle2: string) => Promise<void>,  // lanza Error con el mensaje a decir
 *   onCancelar: () => void,
 * }} props
 */
export function UbicacionManualModal({ linea, onBuscar, onCancelar }) {
  const { speak } = useSpeechSynthesis();

  const [etapa, setEtapa]   = useState(1);           // 1 = primera calle | 2 = segunda | "buscando"
  const [calle1, setCalle1] = useState("");
  const [error, setError]   = useState(null);
  const [ronda, setRonda]   = useState(0);           // cambia la key para volver a pedir desde cero

  const handleCalle1 = useCallback((calle) => {
    setCalle1(calle);
    setEtapa(2);
  }, []);

  const handleCalle2 = useCallback(
    async (calle2) => {
      setEtapa("buscando");
      setError(null);
      try {
        await onBuscar(calle1, calle2);
      } catch (err) {
        const msg = err?.message || "No pudimos buscar la intersección, intentá de nuevo";
        setError(msg);
        // Se dice el motivo y recién después se vuelve a pedir la primera calle
        speak(msg, {
          onEnd: () => {
            setCalle1("");
            setRonda((r) => r + 1);
            setEtapa(1);
          },
        });
      }
    },
    [calle1, onBuscar, speak]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ubicacion-manual-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-6
                 bg-fondo-principal/80 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-superficie-media
                   bg-superficie-primaria p-6 shadow-xl flex flex-col gap-4"
      >
        <div>
          <h2 id="ubicacion-manual-titulo" className="text-lg font-bold text-texto-principal">
            Decí tu ubicación
          </h2>
          <p className="text-sm text-acento-secundario mt-1">
            Línea {linea.nroLinea} - Ramal {linea.ramal}. Decí las dos calles de la esquina donde estás.
          </p>
        </div>

        {calle1 && (
          <p className="text-sm text-texto-principal bg-fondo-secundario rounded-lg p-3">
            Primera calle: <strong>{calle1}</strong>
          </p>
        )}

        {etapa === 1 && (
          <CapturaCalle
            key={`1-${ronda}`}
            pregunta="Decí la primera calle de la esquina donde estás"
            onConfirmada={handleCalle1}
          />
        )}
        {etapa === 2 && (
          <CapturaCalle
            key={`2-${ronda}`}
            pregunta="Decí la segunda calle de la esquina"
            onConfirmada={handleCalle2}
          />
        )}
        {etapa === "buscando" && (
          <p role="status" className="text-center text-texto-principal font-semibold">
            Buscando parada…
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-estado-error bg-estado-error/10 border border-estado-error/40 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onCancelar}
          disabled={etapa === "buscando"}
          className="w-full rounded-xl border border-superficie-media bg-fondo-secundario py-3
                     text-sm font-bold text-acento-primario disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
