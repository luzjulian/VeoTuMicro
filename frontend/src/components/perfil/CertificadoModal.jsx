// frontend/src/components/perfil/CertificadoModal.jsx
import { useEffect } from "react";

/**
 * Modal que muestra el certificado de discapacidad en un iframe.
 * Se cierra con la tecla Escape o con el botón "Cerrar".
 */
export function CertificadoModal({ abierto, onClose, certificado }) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Evitamos scroll del body mientras el modal está abierto
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onClose]);

  if (!abierto || !certificado) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cert"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-fondo-principal border border-superficie-primaria rounded-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="titulo-cert"
            className="text-xl font-bold text-texto-principal"
          >
            Certificado de discapacidad
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-texto-principal text-3xl leading-none px-2 hover:text-acento-primario transition-colors"
          >
            ×
          </button>
        </div>

        <div className="bg-fondo-secundario border border-superficie-primaria rounded-lg p-2 mb-4">
          <iframe
            src={certificado.url}
            title="Vista previa del certificado de discapacidad"
            className="w-full h-\[420px\] rounded"
          />
        </div>

        <p className="text-sm text-acento-secundario mb-4">
          {certificado.nombreArchivo} · Cargado el {certificado.fechaCarga}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-base sm:text-lg py-3 rounded-md transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}