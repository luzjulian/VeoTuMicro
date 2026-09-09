// src/pages/conductor/PanelConductorPage.jsx
import { useState } from "react";
import { useConductorRealtime } from "@/hooks/useConductorRealtime";
import { PanelSeccion } from "@/components/conductor/PanelSeccion";
import { AlertaAscensoCard } from "@/components/conductor/Alertaascensocard";
import { BandejaSolicitudes } from "@/components/conductor/BandejaSolicitudes";
import { RecordatorioBajadaModal } from "@/components/conductor/RecordatorioBajadaModal";

export default function PanelConductorPage() {
  const {
    solicitudes,
    recordatorio,
    aceptarSolicitud,
    rechazarSolicitud,
    confirmarBajada,
  } = useConductorRealtime();

  // La solicitud "activa" es la que se muestra en la AlertaAscensoCard.
  // Se selecciona automáticamente (la primera pendiente) o por tap en la bandeja.
  const [seleccionManual, setSeleccionManual] = useState(null);

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");
  const alertaActiva =
    seleccionManual ??
    pendientes[0] ??
    null;

  const handleSeleccionarDeBandeja = (solicitud) => {
    if (solicitud.estado === "pendiente") {
      setSeleccionManual(solicitud);
    }
  };

  const handleAceptar = (numeroSolicitud) => {
    aceptarSolicitud(numeroSolicitud);
    setSeleccionManual(null);
  };

  const handleRechazar = (numeroSolicitud) => {
    rechazarSolicitud(numeroSolicitud);
    setSeleccionManual(null);
  };

  return (
    <div className="min-h-screen bg-fondo-principal">
      {/* Header */}
      <header className="bg-fondo-secundario border-b border-superficie-primaria px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-texto-principal">
              Panel del Conductor
            </h1>
            <p className="text-sm text-acento-secundario">
              Línea 307 — La Plata Centro
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-estado-exito/20 text-estado-exito">
            En servicio
          </span>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Bloque 1: Alertas activas */}
        <PanelSeccion titulo="Alertas activas" contador={pendientes.length}>
          {alertaActiva ? (
            <AlertaAscensoCard
              solicitud={alertaActiva}
              onAceptar={handleAceptar}
              onRechazar={handleRechazar}
            />
          ) : (
            <p className="text-sm text-acento-secundario text-center py-8 bg-fondo-secundario rounded-xl">
              Sin alertas activas — esperando solicitudes
            </p>
          )}
        </PanelSeccion>

        {/* Bloque 2: Bandeja de solicitudes */}
        <PanelSeccion
          titulo="Bandeja de solicitudes"
          contador={solicitudes.length}
        >
          <BandejaSolicitudes
            solicitudes={solicitudes}
            onSeleccionar={handleSeleccionarDeBandeja}
          />
        </PanelSeccion>
      </main>

      {/* Bloque 3: Recordatorio de bajada (modal) */}
      {recordatorio && (
        <RecordatorioBajadaModal
          solicitud={recordatorio.solicitud}
          onConfirmarBajada={confirmarBajada}
        />
      )}
    </div>
  );
}