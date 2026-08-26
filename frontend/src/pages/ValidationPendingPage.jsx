// frontend/src/pages/auth/ValidationPendingPage.jsx
import { Link } from "react-router-dom";

export default function ValidationPendingPage() {
  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md lg:max-w-lg flex flex-col items-center">

        {/* Card principal */}
        <div className="w-full bg-estado-advertencia/10 border border-estado-advertencia/40 rounded-xl p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-estado-advertencia mb-4">
            ¡Registro enviado!
          </h1>

          <p className="text-texto-principal text-base sm:text-lg mb-4">
            Tus datos y certificado de discapacidad fueron recibidos correctamente.
          </p>

          <p className="text-texto-principal/80 text-base sm:text-lg mb-6">
            Un administrador validará tu cuenta a la brevedad. Recibirás un correo
            cuando tu acceso sea habilitado.
          </p>

          {/* Badge de estado */}
          <span
            role="status"
            aria-live="polite"
            className="inline-block border border-estado-advertencia text-estado-advertencia text-sm sm:text-base font-bold px-4 py-2 rounded-full"
          >
            Validación pendiente
          </span>
        </div>

        {/* Volver al inicio */}
        <Link
          to="/login"
          className="mt-8 w-full text-center border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-base sm:text-lg py-3 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-primario"
        >
          Volver al inicio
        </Link>

      </div>
    </div>
  );
}   