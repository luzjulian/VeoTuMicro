// src/components/conductor/SolicitudItem.jsx
import { BadgeEstado } from "@/components/conductor/BadgeEstado";
import { tiempoTranscurrido } from "@/utils/tiempoTranscurrido";

export function SolicitudItem({ solicitud, onSeleccionar }) {
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
        <p className="font-bold text-texto-principal text-sm">
          {solicitud.pasajero}
        </p>
        <p className="text-xs text-acento-secundario mt-0.5">
          {solicitud.nroLinea} · {solicitud.paradaSubida} → {solicitud.paradaDestino}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {solicitud.discapacidadVisual && (
            <BadgeEstado variante="discapacidad" />
          )}
          <BadgeEstado variante={solicitud.estado} />
        </div>
      </div>

      {/* Tiempo */}
      <span className="text-xs text-acento-secundario whitespace-nowrap shrink-0">
        {tiempoTranscurrido(solicitud.fechaHoraInicio)}
      </span>
    </div>
  );
}