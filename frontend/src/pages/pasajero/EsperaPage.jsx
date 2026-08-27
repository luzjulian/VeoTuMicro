// src/pages/pasajero/EsperaPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  suscribirseAViajeMock,
  reiniciarCicloArriboMock,
  notificarCancelacionAlConductorMock,
} from "@/services/mock/mockRealtimeService";
import { useEsperaVoiceFlow } from "@/hooks/useEsperaVoiceFlow";
import { VoiceStatusCircle } from "@/components/pasajero/VoiceStatusCircle";

export default function EsperaPage() {
  const { viaje, actualizarViaje, resetViaje } = useOutletContext();
  const navigate = useNavigate();

  const [minutosRestantes, setMinutosRestantes] = useState(null);
  const [conductorConfirmo, setConductorConfirmo] = useState(false);
  const [colectivoLlego, setColectivoLlego] = useState(false);

  const unsubscribeRef = useRef(null);

  const handleCancelar = () => {
    unsubscribeRef.current?.();
    notificarCancelacionAlConductorMock(viaje.numeroSolicitud);
    resetViaje();
    navigate("/pasajero/linea");
  };

  const { isListening, anunciar, preguntarSiNo, iniciarEscuchaConstante, cancelarPorTap, vaciarCola } =
    useEsperaVoiceFlow({ onCancelar: handleCancelar });

  const preguntarAbordaje = () => {
    preguntarSiNo("¿Has podido abordar? Decí sí o no", {
      onSi: () => {
        actualizarViaje({ estadoViaje: "a_bordo" });
        navigate("/pasajero/viaje");
      },
      onNo: () => {
        setColectivoLlego(false);
        anunciar("Recalculando ubicación del colectivo");
        unsubscribeRef.current?.();
        unsubscribeRef.current = reiniciarCicloArriboMock(viaje.numeroSolicitud, manejarEvento);
      },
    });
  };

  const manejarEvento = (evento, payload) => {
    if (evento === "eta_actualizado") setMinutosRestantes(payload.minutosRestantes);

    if (evento === "conductor_confirmado") {
      setConductorConfirmo(true);
      setMinutosRestantes(payload.minutosIniciales);
      anunciar("Solicitud confirmada");
      anunciar(`Tu colectivo llegará en ${payload.minutosIniciales} minutos aproximadamente`);
      anunciar('Decí "Cancelar viaje" en cualquier momento si deseás cancelar tu viaje', {
        onEnd: () => iniciarEscuchaConstante(),
      });
    }

    if (evento === "aviso_un_minuto") {
      anunciar("Tu colectivo llegará en 1 minuto, preparate");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    if (evento === "colectivo_llego") {
      setColectivoLlego(true);
      anunciar("Tu colectivo ha llegado, subí", { onEnd: () => preguntarAbordaje() });
    }

    if (evento === "eta_recalculada") {
      anunciar(
        `Se ha recalculado la distancia aproximada, tu colectivo llegará en ${payload.minutosRestantes} minutos`
      );
    }
  };

  useEffect(() => {
    if (!viaje.numeroSolicitud) {
      navigate("/pasajero/linea", { replace: true });
      return;
    }

    anunciar("Procesando solicitud de viaje");
    unsubscribeRef.current = suscribirseAViajeMock(viaje.numeroSolicitud, manejarEvento);

    return () => {
      unsubscribeRef.current?.();
      vaciarCola();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaje.numeroSolicitud]);

  const handleYaSubi = () => {
    unsubscribeRef.current?.();
    actualizarViaje({ estadoViaje: "a_bordo" });
    navigate("/pasajero/viaje");
  };

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-texto-principal">Esperando el colectivo</h1>
          <p className="text-sm text-acento-secundario">Paso 3 de 3</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-estado-advertencia/20 text-estado-advertencia">
          {colectivoLlego ? "Llegó" : "En espera"}
        </span>
      </header>

      <VoiceStatusCircle escuchando={isListening} />
      <p className="text-center text-xs text-acento-secundario mt-2 mb-4">
        Podés decir "Cancelar viaje" en cualquier momento
      </p>

      <div className="bg-fondo-secundario rounded-xl p-6 text-center mb-6">
        <p className="text-5xl font-bold text-acento-primario">{minutosRestantes ?? "--"}</p>
        <p className="text-sm text-acento-secundario mt-1">minutos estimados de arribo</p>
      </div>

      <div className="space-y-3 mb-4">
        <Fila etiqueta="Línea" valor={`${viaje.nroLinea} — ${viaje.ramal}`} />
        <Fila etiqueta="Subida" valor={viaje.paradaSubida} />
        <Fila etiqueta="Bajada" valor={viaje.paradaDestino} />
        <Fila etiqueta="Conductor" valor={conductorConfirmo ? "Recibido ✓" : "Enviando…"} />
      </div>

      <div className="bg-estado-advertencia/10 border border-estado-advertencia/40 text-estado-advertencia text-sm rounded-lg p-4 mb-6">
        Recibirás vibración y sonido 1 minuto antes del arribo
      </div>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={handleYaSubi}
          className="w-full bg-estado-exito text-fondo-principal font-bold text-lg h-14 rounded-md"
        >
          Ya subí al colectivo
        </button>
        <button
          type="button"
          onClick={cancelarPorTap}
          className="w-full bg-estado-error/10 border border-estado-error/40 text-estado-error font-bold text-lg h-14 rounded-md"
        >
          Cancelar solicitud
        </button>
      </div>
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