// src/components/conductor/SolicitudItem.jsx
import { MapPin, User, ArrowRight, Clock } from 'lucide-react';
import { BadgeEstado } from "@/components/conductor/BadgeEstado";
import { tiempoTranscurrido } from "@/utils/tiempoTranscurrido";

export function SolicitudItem({ solicitud, onSeleccionar, onConfirmarBajada }) {
  const esInteractiva = solicitud.estado === "pendiente";

  return (
    <div
      role={esInteractiva ? "button" : undefined}
      tabIndex={esInteractiva ? 0 : undefined}
      onClick={esInteractiva ? () => onSeleccionar(solicitud) : undefined}
      onKeyDown={
        esInteractiva
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSeleccionar(solicitud);
              }
            }
          : undefined
      }
      className={`flex items-start gap-3 bg-fondo-secundario rounded-lg p-4 transition-colors ${
        esInteractiva
          ? "cursor-pointer hover:bg-fondo-terciario"
          : "opacity-70"
      }`}
    >
      {/* Indicador de estado (circulito) */}
      <span
        className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
          solicitud.estado === "pendiente"
            ? "bg-estado-advertencia"
            : solicitud.estado === "a_bordo"
            ? "bg-estado-exito"
            : "bg-acento-secundario"
        }`}
      />

      {/* Datos */}
      <div className="flex-1 min-w-0">
        {/* Nombre del pasajero */}
        <p className="font-bold text-texto-principal text-sm flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-acento-secundario shrink-0" aria-hidden="true" />
          {solicitud.pasajero}
        </p>

        {/* Origen → Destino */}
        <p className="text-xs text-acento-secundario mt-1 flex items-center gap-1 flex-wrap">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[9rem]">{solicitud.paradaSubida}</span>
          <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[9rem]">{solicitud.paradaDestino}</span>
        </p>

        {/* Tiempo + badges */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs text-acento-secundario flex items-center gap-0.5">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {tiempoTranscurrido(solicitud.fechaHoraInicio)}
          </span>
          {solicitud.discapacidadVisual && (
            <BadgeEstado variante="discapacidad" />
          )}
          <BadgeEstado variante={solicitud.estado} />
        </div>

        {/* Mientras el pasajero está a bordo, se puede confirmar la bajada
            en cualquier momento desde acá — sin esperar a que el modal de
            recordatorio reaparezca (ver useConductorRealtime → programarRecordatorio). */}
        {solicitud.estado === "a_bordo" && onConfirmarBajada && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirmarBajada(solicitud.numeroSolicitud);
            }}
            className="mt-3 w-full bg-estado-exito text-fondo-principal font-bold text-sm h-10 rounded-md transition-opacity hover:opacity-90"
          >
            El pasajero ha bajado
          </button>
        )}
      </div>
    </div>
  );
}