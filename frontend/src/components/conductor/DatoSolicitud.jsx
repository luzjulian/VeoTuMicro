// src/components/conductor/DatoSolicitud.jsx

export function DatoSolicitud({ etiqueta, valor, icono }) {
  return (
    <div className="bg-fondo-secundario rounded-lg p-3">
      <span className="flex items-center gap-1 text-xs text-acento-secundario mb-1">
        {icono}
        {etiqueta}
      </span>
      <span className="block font-bold text-texto-principal text-sm">
        {valor}
      </span>
    </div>
  );
}