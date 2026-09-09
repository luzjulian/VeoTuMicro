// src/components/admin/KpiCard.jsx
import { cn } from "@/lib/utils";

/**
 * Tarjeta KPI del Panel Administrativo.
 *
 * variant:
 *   - "default" → superficie normal
 *   - "warning" → resalte ámbar (usado para "Certificados pendientes")
 */
export function KpiCard({
  titulo,
  valor,
  subtitulo,
  variant = "default",
  className,
}) {
  const variantClasses = {
    default: "bg-superficie-primaria border-superficie-media/40",
    warning:
      "bg-estado-advertencia/10 border-estado-advertencia/40",
  };

  const subtituloColor =
    variant === "warning" ? "text-estado-advertencia" : "text-acento-secundario";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5 flex flex-col gap-1",
        variantClasses[variant],
        className
      )}
    >
      <p className="text-texto-principal/70 text-sm sm:text-base font-medium">
        {titulo}
      </p>
      <p
        className={cn(
          "text-3xl sm:text-4xl font-bold leading-tight",
          variant === "warning"
            ? "text-estado-advertencia"
            : "text-texto-principal"
        )}
      >
        {valor}
      </p>
      {subtitulo && (
        <p className={cn("text-xs sm:text-sm mt-1", subtituloColor)}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}