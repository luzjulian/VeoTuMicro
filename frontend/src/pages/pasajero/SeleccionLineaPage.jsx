// src/pages/pasajero/SeleccionLineaPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { VoiceStatusCircle } from "@/components/pasajero/VoiceStatusCircle";
import { ErrorLineaModal }   from "@/components/pasajero/ErrorLineaModal";
import { useVoiceListSelection } from "@/hooks/useVoiceListSelection";
import { useSpeechSynthesis }    from "@/hooks/useSpeechSynthesis";
import { useGPSFlow }            from "@/hooks/useGPSFlow";
import { matchLineaPorVoz }      from "@/services/mock/mockPasajeroService";
import {
  getLineasActivas,
  getParadaCercana,
  validarLineaEnParada,
} from "@/services/api/lineasApi";

/** Función pura — fuera del componente para no generar nueva referencia en cada render */
const nombreLinea = (linea) => `Línea ${linea.nroLinea} - Ramal ${linea.ramal}`;

export default function SeleccionLineaPage() {
  const { actualizarViaje } = useOutletContext();
  const navigate = useNavigate();
  const { speak } = useSpeechSynthesis();
  const { faseGPS, paradaGPS, iniciarFlujoGPS, resetGPS } = useGPSFlow();

  const [lineas, setLineas]             = useState([]);
  const [lineaTap, setLineaTap]         = useState(null);
  const [mostrarError, setMostrarError] = useState(false);

  const lineaRef = useRef(null);

  // Cargar líneas activas desde el backend al montar la página
  useEffect(() => {
    getLineasActivas()
      .then(setLineas)
      .catch((err) => console.error("Error al cargar líneas activas:", err));
  }, []);

  const navegarADestino = useCallback(
    (linea, direccion, nroParada) => {
      actualizarViaje({
        nroLinea:     linea.nroLinea,
        ramal:        linea.ramal,        // código letra ('A','D','B') — va a la API
        ramalNombre:  nombreLinea(linea), // nombre legible — para mostrar en la UI
        nroParada,                        // determinado por GPS
        paradaSubida: direccion,
        estadoViaje:  "seleccion_destino",
      });
      navigate("/pasajero/destino");
    },
    [actualizarViaje, navigate]
  );

  const lanzarGPS = useCallback(
    async (linea) => {
      lineaRef.current = linea;

      try {
        // 1. Obtener ubicación real del pasajero
        const resultado = await iniciarFlujoGPS();

        // 2. Determinar la parada más cercana a esa ubicación
        let parada;
        try {
          parada = await getParadaCercana(
            resultado.coords.latitud,
            resultado.coords.longitud
          );
        } catch {
          setMostrarError(true);
          return;
        }

        // 3. Validar que la línea elegida pasa por esa parada
        try {
          await validarLineaEnParada(linea.nroLinea, linea.ramal, parada.nroParada);
        } catch {
          setMostrarError(true);
          return;
        }

        // 4. Todo OK → avanzar al paso siguiente
        navegarADestino(linea, resultado.direccion, parada.nroParada);
      } catch {
        // Error inesperado en el flujo GPS
        setMostrarError(true);
      }
    },
    [iniciarFlujoGPS, navegarADestino]
  );

  // Callback para confirmación por voz
  const confirmarSeleccion = useCallback(
    (linea) => lanzarGPS(linea),
    [lanzarGPS]
  );

  // useVoiceListSelection debe declararse ANTES de handleCerrarError
  // para que resetSeleccion esté disponible en el closure
  const { seleccion, fallbackActivo, escuchando, reintentarPorToque, resetSeleccion } =
    useVoiceListSelection({
      opciones: lineas,
      matchFn: matchLineaPorVoz,
      mensajePregunta: "Decí el número de línea",
      etiquetaOpcion: (l) => `Línea ${l.nroLinea}`,
      mensajeNoDisponible: (texto) =>
        `${texto} no disponible, decí un número de línea disponible`,
      mensajeConfirmadoTts:
        "Se obtendrá tu ubicación mediante GPS para registrar tu parada de subida",
      onConfirmado: confirmarSeleccion,
    });

  // Callback para tap en la lista (habla el aviso ético primero)
  const handleTapLinea = useCallback(
    (linea) => {
      setLineaTap(linea.nroLinea);
      lineaRef.current = linea;
      speak(
        "Se obtendrá tu ubicación mediante GPS para registrar tu parada de subida",
        { onEnd: () => lanzarGPS(linea) }
      );
    },
    [speak, lanzarGPS]
  );

  // Al cerrar el modal de error → reiniciar TODO el estado para nueva selección
  const handleCerrarError = useCallback(() => {
    setMostrarError(false);
    setLineaTap(null);
    lineaRef.current = null;
    resetGPS();
    resetSeleccion(); // limpia selección por voz y reinicia el ciclo de escucha
  }, [resetGPS, resetSeleccion]);

  const estaSeleccionada = (linea) =>
    (seleccion?.nroLinea === linea.nroLinea && seleccion?.ramal === linea.ramal) ||
    lineaTap === linea.nroLinea;

  const textoEstadoGPS = () => {
    if (paradaGPS)                      return paradaGPS;
    if (faseGPS === "obteniendo")       return "Obteniendo…";
    if (faseGPS === "error_permisos")   return "Permisos requeridos";
    if (faseGPS === "error_tecnico")    return "Reintentando…";
    return "Pendiente";
  };

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

      <VoiceStatusCircle
        escuchando={escuchando}
        fallbackActivo={fallbackActivo}
        onRetry={reintentarPorToque}
      />
      <p className="text-center text-sm text-acento-secundario mt-2 mb-6">
        {faseGPS === "obteniendo"
          ? "Obteniendo ubicación GPS…"
          : faseGPS === "error_permisos"
          ? "Esperando permisos de GPS…"
          : seleccion
          ? `Línea ${seleccion.nroLinea} confirmada`
          : fallbackActivo
          ? "No pude reconocerte, tocá el micrófono para volver a intentar"
          : "Decí el número de línea"}
      </p>

      <ul className="space-y-3 flex-1" aria-label="Líneas disponibles (apoyo visual)">
        {lineas.map((linea) => (
          <li key={`${linea.nroLinea}-${linea.ramal}`}>
            <button
              type="button"
              onClick={() => handleTapLinea(linea)}
              disabled={!!faseGPS}
              aria-pressed={estaSeleccionada(linea)}
              className={`w-full text-left flex items-center gap-3 rounded-lg border p-4 transition-colors disabled:opacity-40 ${
                estaSeleccionada(linea)
                  ? "border-acento-primario bg-superficie-primaria"
                  : "border-superficie-primaria bg-fondo-secundario"
              }`}
            >
              <span className="h-8 w-8 rounded-full bg-superficie-media shrink-0" />
              <span>
                <span className="block font-bold text-texto-principal">
                  Línea {linea.nroLinea}
                </span>
                <span className="block text-sm text-acento-secundario">
                  Ramal {linea.ramal}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm py-4 border-t border-superficie-primaria mt-4">
        <span className="text-acento-secundario">Parada detectada (GPS)</span>
        <span className="font-bold text-texto-principal">{textoEstadoGPS()}</span>
      </div>

      {/* Modal de error: parada no encontrada o línea no disponible */}
      {mostrarError && (
        <ErrorLineaModal onCerrar={handleCerrarError} />
      )}
    </div>
  );
}