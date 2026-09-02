// src/components/common/EstadoBadge.jsx
import { cn } from "@/lib/utils";

const ESTILOS = {
  pendiente: {
    label: "Pendiente",
    className:
      "bg-estado-advertencia/15 text-estado-advertencia border border-estado-advertencia/50",
  },
  aceptado: {
    label: "Aprobado",
    className:
      "bg-estado-exito/15 text-estado-exito border border-estado-exito/50",
  },
  rechazado: {
    label: "Rechazado",
    className:
      "bg-estado-error/15 text-estado-error border border-estado-error/50",
  },
};

export function EstadoBadge({ estado, className }) {
  const estilo = ESTILOS[estado] ?? ESTILOS.pendiente;

  return (
    <span
      role="status"
      className={cn(
        "inline-block text-xs sm:text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap",
        estilo.className,
        className
      )}
    >
      {estilo.label}
    </span>
  );
}