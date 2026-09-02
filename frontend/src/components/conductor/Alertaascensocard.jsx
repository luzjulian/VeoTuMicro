// src/components/conductor/AlertaAscensoCard.jsx
import { BadgeEstado } from "@/components/conductor/BadgeEstado";
import { DatoSolicitud } from "@/components/conductor/DatoSolicitud";
import { tiempoTranscurrido } from "@/utils/tiempoTranscurrido";

export function AlertaAscensoCard({ solicitud, onAceptar, onRechazar }) {
  return (
    <div
      className="bg-fondo-terciario border border-superficie-media rounded-xl p-5"
      role="alert"
      aria-live="assertive"
    >
      {/* Encabezado */}
      <div className="flex items-start gap-3 mb-4">
        <span className="h-10 w-10 rounded-full bg-superficie-media shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-texto-principal">
            Pasajero con discapacidad visual
          </p>
          <p className="text-sm text-acento-secundario">
            Solicitud de ascenso — {tiempoTranscurrido(solicitud.fechaHoraInicio)}
          </p>
          <BadgeEstado variante="detencion" className="mt-2" />
        </div>
      </div>

      {/* Grid de datos 2×2 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <DatoSolicitud etiqueta="Parada de subida" valor={solicitud.paradaSubida} />
        <DatoSolicitud etiqueta="Bajada solicitada" valor={solicitud.paradaDestino} />
        <DatoSolicitud etiqueta="Pasajero" valor={solicitud.pasajero} />
        <DatoSolicitud
          etiqueta="Recibido"
          valor={tiempoTranscurrido(solicitud.fechaHoraInicio)}
        />
      </div>

      {/* Banner de advertencia */}
      <div className="bg-estado-advertencia/10 border border-estado-advertencia/40 text-estado-advertencia text-sm rounded-lg p-3 mb-4">
        Detener el colectivo completamente. Aguardar el ascenso completo antes de
        continuar la marcha.
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAceptar(solicitud.numeroSolicitud)}
          className="bg-estado-exito text-fondo-principal font-bold text-sm h-12 rounded-md transition-opacity hover:opacity-90"
        >
          Aceptar solicitud
        </button>
        <button
          type="button"
          onClick={() => onRechazar(solicitud.numeroSolicitud)}
          className="bg-estado-error text-fondo-principal font-bold text-sm h-12 rounded-md transition-opacity hover:opacity-90"
        >
          Rechazar solicitud
        </button>
      </div>
    </div>
  );
}