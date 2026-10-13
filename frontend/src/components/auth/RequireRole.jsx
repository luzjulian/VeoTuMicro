// src/components/auth/RequireRole.jsx
//
// Ruta protegida. Se usa como "layout route" en App.jsx:
//
//   <Route element={<RequireRole roles={["administrativo"]} />}>
//     <Route path="/admin" element={<AdminPanelPage />} />
//   </Route>
//
//   - Sin `roles`: alcanza con tener sesión (por ejemplo /perfil).
//   - Sin sesión → /login.
//   - Con sesión pero de otro rol → a la pantalla de su propio rol.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { RUTA_POR_ROL } from "@/services/api/authApi";

export function RequireRole({ roles }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-dvh bg-fondo-principal flex items-center justify-center text-texto-principal text-lg"
      >
        Cargando sesión…
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={RUTA_POR_ROL[usuario.rol] ?? "/login"} replace />;
  }

  return <Outlet />;
}
