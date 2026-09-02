// src/components/admin/CertificadoModal.jsx
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/common/EstadoBadge";

function formatearDNI(dni) {
  if (!dni) return "";
  return String(dni).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Modal accesible para revisar el certificado de discapacidad del pasajero
 * y aceptar/rechazar la solicitud sin salir del dashboard.
 *
 * Si la solicitud ya fue evaluada (aceptado/rechazado), se muestra en modo
 * solo lectura con un botón Cerrar.
 */
export function CertificadoModal({
  solicitud,
  onCerrar,
  onAceptar,
  onRechazar,
  procesando,
}) {
  // Cerrar con Escape.
  useEffect(() => {
    if (!solicitud) return;
    const handler = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [solicitud, onCerrar]);

  // Bloquear scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (!solicitud) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [solicitud]);

  if (!solicitud) return null;

  const esPendiente = solicitud.estado === "pendiente";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cert-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onCerrar}
        className="absolute inset-0 bg-fondo-principal/80 backdrop-blur-sm"
      />

      {/* Contenido */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-fondo-secundario border border-superficie-media rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-superficie-media/60">
          <div className="min-w-0">
            <h2
              id="modal-cert-titulo"
              className="text-xl sm:text-2xl font-bold text-texto-principal truncate"
            >
              {solicitud.apellido}, {solicitud.nombre}
            </h2>
            <p className="text-acento-secundario text-sm sm:text-base mt-1">
              DNI: {formatearDNI(solicitud.dni)}
            </p>
            <p className="text-acento-secundario/80 text-xs sm:text-sm">
              Certificado de discapacidad
            </p>
          </div>
          <EstadoBadge estado={solicitud.estado} />
        </div>

        {/* Visor del PDF */}
        <div className="flex-1 overflow-hidden bg-superficie-primaria">
          <iframe
            src={solicitud.certificadoUrl}
            title={`Certificado de discapacidad de ${solicitud.nombre} ${solicitud.apellido}`}
            className="w-full h-full min-h-[400px] border-0"
          />
        </div>

        {/* Footer / acciones */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-superficie-media/60 bg-fondo-secundario">
          {esPendiente ? (
            <>
              <Button
                onClick={onCerrar}
                disabled={procesando}
                variant="outline"
                className="border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold h-11 px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => onRechazar(solicitud)}
                disabled={procesando}
                className="bg-estado-error hover:bg-estado-error/80 text-fondo-principal font-bold h-11 px-6"
              >
                Rechazar
              </Button>
              <Button
                onClick={() => onAceptar(solicitud)}
                disabled={procesando}
                className="bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold h-11 px-6"
              >
                Aceptar
              </Button>
            </>
          ) : (
            <Button
              onClick={onCerrar}
              className="bg-acento-primario hover:bg-acento-primario/80 text-fondo-principal font-bold h-11 px-6"
            >
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}