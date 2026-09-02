// src/hooks/useSolicitudes.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  evaluarSolicitudMock,
  obtenerSolicitudesMock,
} from "@/services/mock/mockAdminService";

export const FILTROS = ["todas", "pendiente", "aceptado", "rechazado"];

export function useSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState("pendiente");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(null); // id de la solicitud siendo evaluada

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerSolicitudesMock();
      // Ordenamos: pendientes primero, luego por fecha desc.
      data.sort((a, b) => {
        if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
        if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;
        return (
          new Date(b.fechaHoraRegistro).getTime() -
          new Date(a.fechaHoraRegistro).getTime()
        );
      });
      setSolicitudes(data);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const solicitudesFiltradas = useMemo(() => {
    if (filtroActivo === "todas") return solicitudes;
    return solicitudes.filter((s) => s.estado === filtroActivo);
  }, [solicitudes, filtroActivo]);

  const evaluar = useCallback(async (id, decision) => {
    setAccionEnCurso(id);
    // Optimistic update: reflejamos el cambio antes de que responda el mock.
    const nuevoEstado = decision === "aceptar" ? "aceptado" : "rechazado";
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );

    try {
      const actualizada = await evaluarSolicitudMock(id, decision);
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? actualizada : s))
      );
      return actualizada;
    } catch (err) {
      // Rollback si falla.
      setError(err);
      await recargar();
      throw err;
    } finally {
      setAccionEnCurso(null);
    }
  }, [recargar]);

  return {
    solicitudes,
    solicitudesFiltradas,
    filtroActivo,
    setFiltroActivo,
    cargando,
    error,
    accionEnCurso,
    evaluar,
    recargar,
  };
}