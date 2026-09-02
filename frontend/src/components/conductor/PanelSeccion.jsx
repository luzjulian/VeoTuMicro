// src/components/conductor/PanelSeccion.jsx

export function PanelSeccion({ titulo, contador, children }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-acento-secundario">
          {titulo}
        </h2>
        {contador != null && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
            {contador} {contador === 1 ? "solicitud" : "solicitudes"}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}