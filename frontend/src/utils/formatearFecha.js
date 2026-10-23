// Muestra una fecha ISO (UTC) como "23 de octubre de 2026", en hora de Argentina.
export function formatearFecha(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}