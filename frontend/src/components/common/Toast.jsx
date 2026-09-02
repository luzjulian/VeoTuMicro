// frontend/src/components/common/Toast.jsx
import { useEffect } from "react";

/**
 * Toast simple y accesible.
 * - Se auto-cierra a los `duration` ms (default 3000).
 * - role="status" + aria-live="polite" para lectores de pantalla.
 * - Variantes: "exito" (verde) y "error" (rojo).
 */
export function Toast({ mensaje, variante = "exito", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [mensaje, duration, onClose]);

  if (!mensaje) return null;

  const colorBase =
    variante === "error"
      ? "bg-estado-error text-fondo-principal"
      : "bg-estado-exito text-fondo-principal";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-bold text-base sm:text-lg shadow-lg ${colorBase}`}
    >
      {mensaje}
    </div>
  );
}