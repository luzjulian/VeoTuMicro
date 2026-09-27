// src/components/conductor/RecordatorioBajadaModal.jsx
import { AlertTriangle, User, MapPin } from 'lucide-react';

export function RecordatorioBajadaModal({ solicitud, onConfirmarBajada }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fondo-principal/90 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Recordatorio de bajada"
    >
      <div className="w-full max-w-lg bg-fondo-terciario border border-estado-advertencia/40 rounded-2xl p-6 text-center">
        {/* Ícono */}
        <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-estado-advertencia/20 mb-4">
          <AlertTriangle className="h-8 w-8 text-estado-advertencia" aria-hidden="true" />
        </span>

        <p className="text-xs font-bold uppercase tracking-wider text-estado-advertencia mb-1">
          Recordatorio de bajada
        </p>
        <p className="text-lg font-bold text-texto-principal mb-6">
          {solicitud.pasajero ?? 'Pasajero con discapacidad visual'} debe descender
        </p>

        {/* Datos del pasajero */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 bg-fondo-secundario rounded-lg p-3">
            <span className="h-8 w-8 rounded-full bg-superficie-media shrink-0 flex items-center justify-center">
              <User className="h-4 w-4 text-acento-secundario" aria-hidden="true" />
            </span>
            <div className="text-left">
              <span className="block text-xs text-acento-secundario">Pasajero</span>
              <span className="block font-bold text-texto-principal text-sm">
                {solicitud.pasajero}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-fondo-secundario rounded-lg p-3">
            <span className="h-8 w-8 rounded-full bg-superficie-media shrink-0 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-estado-exito" aria-hidden="true" />
            </span>
            <div className="text-left">
              <span className="block text-xs text-acento-secundario">
                Destino solicitado
              </span>
              <span className="block font-bold text-estado-exito text-sm">
                {solicitud.paradaDestino}
              </span>
            </div>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-estado-advertencia/10 border border-estado-advertencia/40 text-estado-advertencia text-sm rounded-lg p-3 mb-6 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Busque la parada más próxima al destino y detenga el colectivo</span>
        </div>

        {/* Botón principal — alto contraste */}
        <button
          type="button"
          onClick={() => onConfirmarBajada(solicitud.numeroSolicitud)}
          className="w-full bg-estado-exito text-fondo-principal font-bold text-lg h-16 rounded-md transition-opacity hover:opacity-90"
        >
          El pasajero ha bajado
        </button>
      </div>
    </div>
  );
}