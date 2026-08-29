// src/components/conductor/DatoSolicitud.jsx

export function DatoSolicitud({ etiqueta, valor }) {
  return (
    <div className="bg-fondo-secundario rounded-lg p-3">
      <span className="block text-xs text-acento-secundario mb-1">
        {etiqueta}
      </span>
      <span className="block font-bold text-texto-principal text-sm">
        {valor}
      </span>
    </div>
  );
}
