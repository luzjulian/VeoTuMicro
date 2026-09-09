// src/components/admin/KpiGrid.jsx
import { KpiCard } from "./KpiCard";

export function KpiGrid({ kpis, cargando }) {
  if (cargando || !kpis) {
    // Skeleton simple: 4 tarjetas placeholder con la misma grilla.
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-superficie-primaria/50 border border-superficie-media/30 h-28 animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  const delta = kpis.deltaVsAyer;
  const flechaDelta = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <KpiCard
        titulo="Solicitudes hoy"
        valor={kpis.solicitudesHoy}
        subtitulo={`${flechaDelta} ${Math.abs(delta)} vs ayer`}
      />
      <KpiCard
        titulo="Pasajeros activos"
        valor={kpis.pasajerosActivos}
        subtitulo="registrados"
      />
      <KpiCard
        titulo="Cert. pendientes"
        valor={kpis.certPendientes}
        subtitulo="Requieren revisión"
        variant="warning"
      />
      <KpiCard
        titulo="Conductores en ruta"
        valor={kpis.conductoresEnRuta}
        subtitulo="activos ahora"
      />
    </div>
  );
}