// src/components/admin/SolicitudRow.jsx
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/common/EstadoBadge";

function formatearDNI(dni) {
  if (!dni) return "";
  // Formato AR con puntos de miles: 12345678 → 12.345.678
  return String(dni).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatearFechaEnvio(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Fila de la bandeja de solicitudes.
 * Ya no expone acciones de aceptar/rechazar: la decisión se toma dentro del
 * modal, después de haber visto el certificado. El único botón acá es "Ver".
 */
export function SolicitudRow({ solicitud, onVer }) {
  const { nombre, apellido, dni, fechaHoraRegistro, estado } = solicitud;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 border-b border-superficie-media/30 last:border-b-0">
      {/* Datos del pasajero */}
      <div className="flex-1 min-w-0">
        <p className="text-texto-principal text-base sm:text-lg font-bold truncate">
          {apellido}, {nombre}
        </p>
        <p className="text-acento-secundario text-sm sm:text-base">
          DNI: {formatearDNI(dni)}
        </p>
        <p className="text-acento-secundario/80 text-xs sm:text-sm">
          Enviada: {formatearFechaEnvio(fechaHoraRegistro)}
        </p>
      </div>

      {/* Estado + acción única */}
      <div className="flex items-center gap-3 shrink-0">
        <EstadoBadge estado={estado} />
        <Button
          onClick={() => onVer(solicitud)}
          className="bg-acento-primario hover:bg-acento-primario/80 text-fondo-principal font-bold h-9 px-5"
        >
          Ver
        </Button>
      </div>
    </div>
  );
}