// src/components/admin/SolicitudFiltros.jsx
import { cn } from "@/lib/utils";

const OPCIONES = [
  { valor: "todas", label: "Todas" },
  { valor: "pendiente", label: "Pendientes" },
  { valor: "aceptado", label: "Aprobadas" },
  { valor: "rechazado", label: "Rechazadas" },
];

export function SolicitudFiltros({ filtroActivo, onFiltroChange, conteos }) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar solicitudes por estado"
      className="flex flex-wrap gap-2"
    >
      {OPCIONES.map((op) => {
        const activo = filtroActivo === op.valor;
        const conteo = conteos?.[op.valor];

        return (
          <button
            key={op.valor}
            role="tab"
            aria-selected={activo}
            onClick={() => onFiltroChange(op.valor)}
            className={cn(
              "px-4 py-2 rounded-full text-sm sm:text-base font-bold border-2 transition-all",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-primario",
              activo
                ? "bg-acento-primario text-fondo-principal border-acento-primario shadow-lg shadow-acento-primario/40"
                : "bg-transparent text-texto-principal border-superficie-media/60 hover:bg-superficie-primaria hover:border-acento-secundario"
            )}
          >
            {op.label}
            {typeof conteo === "number" && (
              <span
                className={cn(
                  "ml-2 text-xs px-2 py-0.5 rounded-full",
                  activo
                    ? "bg-fondo-principal/20 text-fondo-principal"
                    : "bg-superficie-media/60 text-texto-principal"
                )}
              >
                {conteo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}