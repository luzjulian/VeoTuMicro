// src/components/conductor/BandejaSolicitudes.jsx
import { SolicitudItem } from "@/components/conductor/SolicitudItem";

export function BandejaSolicitudes({ solicitudes, onSeleccionar }) {
  if (solicitudes.length === 0) {
    return (
      <p className="text-sm text-acento-secundario text-center py-8">
        No hay solicitudes en este momento
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Bandeja de solicitudes">
      {solicitudes.map((s) => (
        <li key={s.numeroSolicitud}>
          <SolicitudItem solicitud={s} onSeleccionar={onSeleccionar} />
        </li>
      ))}
    </ul>
  );
}