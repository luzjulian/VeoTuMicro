// src/components/admin/SolicitudesBandeja.jsx
import { useMemo } from "react";
import { SolicitudFiltros } from "./SolicitudFiltros";
import { SolicitudRow } from "./SolicitudRow";

export function SolicitudesBandeja({
  solicitudes,
  solicitudesFiltradas,
  filtroActivo,
  onFiltroChange,
  cargando,
  onVer,
}) {
  const conteos = useMemo(() => {
    return solicitudes.reduce(
      (acc, s) => {
        acc.todas += 1;
        acc[s.estado] = (acc[s.estado] || 0) + 1;
        return acc;
      },
      { todas: 0, pendiente: 0, aceptado: 0, rechazado: 0 }
    );
  }, [solicitudes]);

  return (
    <section
      aria-labelledby="bandeja-titulo"
      className="bg-superficie-primaria/60 border border-superficie-media/40 rounded-xl overflow-hidden"
    >
      {/* Título + filtros */}
      <div className="p-4 sm:p-5 border-b border-superficie-media/40 flex flex-col gap-4">
        <h2
          id="bandeja-titulo"
          className="text-lg sm:text-xl font-bold text-texto-principal uppercase tracking-wide"
        >
          Certificados pendientes de validación
        </h2>
        <SolicitudFiltros
          filtroActivo={filtroActivo}
          onFiltroChange={onFiltroChange}
          conteos={conteos}
        />
      </div>

      {/* Lista */}
      <div>
        {cargando ? (
          <div className="p-8 text-center text-acento-secundario">
            Cargando solicitudes…
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-acento-secundario">
            No hay solicitudes en este estado.
          </div>
        ) : (
          solicitudesFiltradas.map((sol) => (
            <SolicitudRow key={sol.id} solicitud={sol} onVer={onVer} />
          ))
        )}
      </div>
    </section>
  );
}