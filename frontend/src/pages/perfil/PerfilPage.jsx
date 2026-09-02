// frontend/src/pages/perfil/PerfilPage.jsx
import { useEffect, useMemo, useState } from "react";
import { EditarDatosModal } from "@/components/perfil/EditarDatosModal";
import { CertificadoModal } from "@/components/perfil/CertificadoModal";
import { Toast } from "@/components/common/Toast";
import { getPerfil, actualizarPerfil } from "@/services/mock/mockPerfilService";

/**
 * Vista de Perfil (Pasajero / Conductor / Admin).
 * - Muestra info general del usuario (nombre, DNI, email, teléfono, fecha registro).
 * - Permite editar datos vía modal (excepto DNI).
 * - Si el rol es "pasajero", muestra la card del certificado con modal visor.
 */

const ROL_LABEL = {
  pasajero: "Pasajero",
  conductor: "Conductor",
  admin: "Administrador",
};

export default function PerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCertificado, setModalCertificado] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getPerfil()
      .then(setUsuario)
      .finally(() => setCargando(false));
  }, []);

  const iniciales = useMemo(() => {
    if (!usuario?.nombre) return "";
    const partes = usuario.nombre.trim().split(/\s+/);
    const primera = partes[0]?.[0] ?? "";
    const segunda = partes[1]?.[0] ?? "";
    return (primera + segunda).toUpperCase();
  }, [usuario?.nombre]);

  const handleGuardar = async (datosActualizados) => {
    try {
      const actualizado = await actualizarPerfil(datosActualizados);
      setUsuario(actualizado);
      setModalEditar(false);
      setToast({ mensaje: "Datos actualizados", variante: "exito" });
    } catch {
      setToast({ mensaje: "No se pudieron guardar los cambios", variante: "error" });
    }
  };

  if (cargando) {
    return (
      <div className="min-h-dvh bg-fondo-principal flex items-center justify-center p-4">
        <p className="text-texto-principal text-lg" role="status" aria-live="polite">
          Cargando perfil…
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-dvh bg-fondo-principal flex items-center justify-center p-4">
        <p className="text-estado-error text-lg" role="alert">
          No se pudo cargar el perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md lg:max-w-lg flex flex-col">

        {/* Header — mismo patrón que las páginas del flujo pasajero */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-texto-principal">
              Veo Tu Micro
            </h1>
            <p className="text-sm text-acento-secundario">Mi cuenta</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
            Perfil
          </span>
        </header>

        {/* Card de identidad */}
        <div className="flex items-center gap-4 p-5 bg-fondo-secundario border border-superficie-primaria rounded-xl mb-6">
          <div
            aria-hidden="true"
            className="w-16 h-16 rounded-full bg-acento-primario text-fondo-principal flex items-center justify-center text-2xl font-bold shrink-0"
          >
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-texto-principal mb-1 truncate">
              {usuario.nombre}
            </p>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-superficie-primaria text-acento-primario">
              {ROL_LABEL[usuario.rol]}
            </span>
          </div>
        </div>

        {/* Info general */}
        <ul className="space-y-3 mb-5" aria-label="Información general de la cuenta">
          <li className="p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg">
            <p className="text-sm text-acento-secundario font-medium mb-1">
              Nombre completo
            </p>
            <p className="text-base font-bold text-texto-principal">
              {usuario.nombre}
            </p>
          </li>
          <li className="p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg">
            <p className="text-sm text-acento-secundario font-medium mb-1">DNI</p>
            <p className="text-base font-bold text-texto-principal">
              {usuario.dni}
            </p>
          </li>
          <li className="p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg">
            <p className="text-sm text-acento-secundario font-medium mb-1">Email</p>
            <p className="text-base font-bold text-texto-principal break-all">
              {usuario.email}
            </p>
          </li>
          <li className="p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg">
            <p className="text-sm text-acento-secundario font-medium mb-1">
              Teléfono
            </p>
            <p className="text-base font-bold text-texto-principal">
              {usuario.telefono}
            </p>
          </li>
          <li className="p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg">
            <p className="text-sm text-acento-secundario font-medium mb-1">
              Fecha de registro
            </p>
            <p className="text-base font-bold text-texto-principal">
              {usuario.fechaRegistro}
            </p>
          </li>
        </ul>

        {/* Certificado — solo pasajero */}
        {usuario.rol === "pasajero" && usuario.certificado && (
          <div className="flex items-center gap-3 p-4 bg-fondo-secundario border border-superficie-primaria rounded-lg mb-6">
            <div
              aria-hidden="true"
              className="w-11 h-11 rounded-md bg-superficie-primaria text-acento-primario flex items-center justify-center text-sm font-bold shrink-0"
            >
              PDF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-texto-principal mb-0.5">
                Certificado de discapacidad
              </p>
              <p className="text-xs text-acento-secundario truncate">
                {usuario.certificado.nombreArchivo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalCertificado(true)}
              className="px-4 py-2 text-sm font-bold text-acento-primario border border-acento-secundario rounded-md hover:bg-superficie-primaria transition-colors whitespace-nowrap"
            >
              Ver
            </button>
          </div>
        )}

        {/* CTA principal */}
        <button
          type="button"
          onClick={() => setModalEditar(true)}
          className="w-full bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold text-lg h-14 rounded-md transition-colors"
        >
          Editar datos
        </button>

      </div>

      {/* Modales */}
      <EditarDatosModal
        abierto={modalEditar}
        datosIniciales={{
          nombre: usuario.nombre,
          email: usuario.email,
          telefono: usuario.telefono,
          dni: usuario.dni,
        }}
        onClose={() => setModalEditar(false)}
        onGuardar={handleGuardar}
      />

      {usuario.rol === "pasajero" && (
        <CertificadoModal
          abierto={modalCertificado}
          onClose={() => setModalCertificado(false)}
          certificado={usuario.certificado}
        />
      )}

      {/* Toast */}
      <Toast
        mensaje={toast?.mensaje}
        variante={toast?.variante}
        onClose={() => setToast(null)}
      />
    </div>
  );
}