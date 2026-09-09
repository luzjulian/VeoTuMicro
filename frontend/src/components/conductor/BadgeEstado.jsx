// src/components/conductor/BadgeEstado.jsx

const VARIANTES = {
  pendiente: "bg-estado-advertencia/20 text-estado-advertencia",
  aceptada: "bg-acento-primario/20 text-acento-primario",
  a_bordo: "bg-estado-exito/20 text-estado-exito",
  finalizada: "bg-superficie-media/40 text-acento-secundario",
  rechazada: "bg-estado-error/20 text-estado-error",
  discapacidad: "bg-acento-secundario/20 text-acento-secundario",
  detencion: "bg-estado-error/20 text-estado-error",
};

const ETIQUETAS = {
  pendiente: "Ascenso",
  aceptada: "Aceptada",
  a_bordo: "A bordo",
  finalizada: "Finalizada",
  rechazada: "Rechazada",
  discapacidad: "Discapacidad visual",
  detencion: "Detención obligatoria",
};

export function BadgeEstado({ variante, etiqueta, className = "" }) {
  const colores = VARIANTES[variante] ?? VARIANTES.pendiente;
  const texto = etiqueta ?? ETIQUETAS[variante] ?? variante;

  return (
    <span
      className={`inline-block text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${colores} ${className}`}
    >
      {texto}
    </span>
  );
}