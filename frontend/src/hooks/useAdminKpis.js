// src/hooks/useAdminKpis.js
import { useCallback, useEffect, useState } from "react";
import {
  obtenerKpisMock,
  suscribirseAKpisMock,
} from "@/services/mock/mockAdminService";

export function useAdminKpis() {
  const [kpis, setKpis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerKpisMock();
      setKpis(data);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Suscripción a actualizaciones en vivo (pasajeros activos / conductores en ruta).
  useEffect(() => {
    const unsubscribe = suscribirseAKpisMock((evento, payload) => {
      if (evento === "kpis_actualizados") {
        setKpis((prev) => (prev ? { ...prev, ...payload } : prev));
      }
    });
    return unsubscribe;
  }, []);

  return { kpis, cargando, error, recargar };
}