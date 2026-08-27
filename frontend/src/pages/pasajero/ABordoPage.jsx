// src/pages/pasajero/ABordoPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { simularEventosDeBajadaMock } from "@/services/mock/mockRealtimeService";
import { useVoiceQueue } from "@/hooks/useVoiceQueue";

export default function ABordoPage() {
  const { viaje, resetViaje } = useOutletContext();
  const navigate = useNavigate();
  const { encolar, vaciarCola } = useVoiceQueue();

  const [conductorVaADetenerse, setConductorVaADetenerse] = useState(false);
  const [descensoConfirmado, setDescensoConfirmado] = useState(false);

  const yaAnunciado = useRef(false);

  useEffect(() => {
    if (viaje.estadoViaje !== "a_bordo") {
      navigate("/pasajero/linea", { replace: true });
      return;
    }

    // Guarda contra el doble-montaje de StrictMode en desarrollo: sin esto,
    // los anuncios se encolan dos veces (monta -> desmonta -> monta) porque
    // useVoiceQueue no se resetea entre esos ciclos.
    if (yaAnunciado.current) return;
    yaAnunciado.current = true;

    encolar("Se le ha notificado al conductor tu destino");
    encolar("El conductor te avisará cuando debas bajar");

    const unsubscribe = simularEventosDeBajadaMock((evento) => {
      if (evento === "conductor_va_a_detenerse") {
        setConductorVaADetenerse(true);
        encolar(`Preparate para bajar en ${viaje.paradaDestino}`);
      }
      if (evento === "descenso_confirmado") {
        setDescensoConfirmado(true);
        encolar("Descenso confirmado, finalizando viaje", {
          onEnd: () => {
            resetViaje();
            navigate("/pasajero/linea");
          },
        });
      }
    });

    return () => {
      unsubscribe();
      vaciarCola();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-texto-principal">En viaje</h1>
          <p className="text-sm text-acento-secundario">Monitoreo activo</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
          A bordo
        </span>
      </header>

      <div className="bg-estado-exito/10 border border-estado-exito/40 rounded-xl p-6 text-center mb-6">
        <p className="font-bold text-estado-exito text-lg">¡Ascenso confirmado!</p>
        <p className="text-sm text-texto-principal/80 mt-1">El sistema notificó al conductor tu destino</p>
      </div>

      <div className="flex items-center justify-between text-sm bg-fondo-secundario rounded-lg p-3 mb-4">
        <span className="text-acento-secundario">Bajada en</span>
        <span className="font-bold text-texto-principal">{viaje.paradaDestino}</span>
      </div>

      <div
        className={`text-sm text-center rounded-lg p-4 mb-6 ${
          conductorVaADetenerse ? "bg-estado-advertencia/10 text-estado-advertencia" : "bg-estado-exito/10 text-estado-exito"
        }`}
      >
        {descensoConfirmado
          ? "Descenso confirmado, finalizando viaje"
          : conductorVaADetenerse
          ? `El conductor va a detenerse — bajada en ${viaje.paradaDestino}`
          : "El conductor te avisará cuando debas bajar"}
      </div>
    </div>
  );
}