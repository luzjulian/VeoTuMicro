// src/pages/admin/AdminPanelPage.jsx
//
// Panel Administrativo (interfaz 2.9).
// Vista única de tipo dashboard: KPIs en vivo + bandeja de solicitudes de
// registro de pasajeros con discapacidad visual, con filtros por estado.
//
// La decisión de aceptar/rechazar se toma dentro del modal, después de que
// el admin haya visto el certificado. Las filas de la bandeja solo exponen
// un botón "Ver" que abre el modal.
//
// TODO: envolver esta ruta en un RequireRole('admin') cuando exista AuthContext.

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { KpiGrid } from "@/components/admin/KpiGrid";
import { SolicitudesBandeja } from "@/components/admin/SolicitudesBandeja";
import { CertificadoModal } from "@/components/admin/CertificadoModal";
import { useAdminKpis } from "@/hooks/useAdminKpis";
import { useSolicitudes } from "@/hooks/useSolicitudes";

export default function AdminPanelPage() {
  const { kpis, cargando: cargandoKpis, recargar: recargarKpis } = useAdminKpis();
  const {
    solicitudes,
    solicitudesFiltradas,
    filtroActivo,
    setFiltroActivo,
    cargando: cargandoSolicitudes,
    accionEnCurso,
    evaluar,
    recargar: recargarSolicitudes,
  } = useSolicitudes();

  const [solicitudEnModal, setSolicitudEnModal] = useState(null);
  const [feedback, setFeedback] = useState(null); // { tipo, mensaje }

  const mostrarFeedback = useCallback((tipo, mensaje) => {
    setFeedback({ tipo, mensaje });
    setTimeout(() => setFeedback(null), 3500);
  }, []);

  const abrirCertificado = useCallback((solicitud) => {
    setSolicitudEnModal(solicitud);
  }, []);

  const cerrarModal = useCallback(() => {
    setSolicitudEnModal(null);
  }, []);

  const handleAceptar = useCallback(
    async (solicitud) => {
      try {
        await evaluar(solicitud.id, "aceptar");
        mostrarFeedback(
          "exito",
          `Solicitud aceptada — ${solicitud.nombre} ${solicitud.apellido}`
        );
        cerrarModal();
        recargarKpis();
      } catch {
        mostrarFeedback("error", "No se pudo procesar la solicitud.");
      }
    },
    [evaluar, mostrarFeedback, cerrarModal, recargarKpis]
  );

  const handleRechazar = useCallback(
    async (solicitud) => {
      try {
        await evaluar(solicitud.id, "rechazar");
        mostrarFeedback(
          "exito",
          `Solicitud rechazada — ${solicitud.nombre} ${solicitud.apellido}`
        );
        cerrarModal();
        recargarKpis();
      } catch {
        mostrarFeedback("error", "No se pudo procesar la solicitud.");
      }
    },
    [evaluar, mostrarFeedback, cerrarModal, recargarKpis]
  );

  const handleActualizar = useCallback(() => {
    recargarKpis();
    recargarSolicitudes();
  }, [recargarKpis, recargarSolicitudes]);

  return (
    <div className="min-h-dvh bg-fondo-principal">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header del panel */}
        <header className="flex items-start justify-between gap-4 bg-fondo-secundario border border-superficie-media/40 rounded-xl p-4 sm:p-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-texto-principal">
              Veo Tu Micro
            </h1>
            <p className="text-acento-secundario text-sm sm:text-base">
              Panel administrativo
            </p>
          </div>
          <Button
            onClick={handleActualizar}
            variant="outline"
            className="border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold h-10 px-4"
          >
            Actualizar
          </Button>
        </header>

        {/* KPIs */}
        <KpiGrid kpis={kpis} cargando={cargandoKpis} />

        {/* Bandeja de solicitudes */}
        <SolicitudesBandeja
          solicitudes={solicitudes}
          solicitudesFiltradas={solicitudesFiltradas}
          filtroActivo={filtroActivo}
          onFiltroChange={setFiltroActivo}
          cargando={cargandoSolicitudes}
          onVer={abrirCertificado}
        />
      </div>

      {/* Modal de revisión del certificado */}
      <CertificadoModal
        solicitud={solicitudEnModal}
        onCerrar={cerrarModal}
        onAceptar={handleAceptar}
        onRechazar={handleRechazar}
        procesando={accionEnCurso === solicitudEnModal?.id}
      />

      {/* Toast de feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-lg shadow-2xl font-bold border-2 ${
            feedback.tipo === "exito"
              ? "bg-estado-exito/20 border-estado-exito text-estado-exito"
              : "bg-estado-error/20 border-estado-error text-estado-error"
          }`}
        >
          {feedback.mensaje}
        </div>
      )}
    </div>
  );
}