// src/components/pasajero/BottomNav.jsx
import { NavLink } from "react-router-dom";
import { Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

// NOTA: "/pasajero/inicio" y "/pasajero/perfil" todavía no tienen pantalla
// propia (fuera del alcance de esta tanda). "Inicio" apunta al comienzo del
// flujo (2.4) como placeholder razonable hasta que se defina el dashboard.
export function BottomNav({ bloqueado = false }) {
  const linkClass = ({ isActive }) =>
    cn(
      "flex flex-col items-center gap-1 text-sm py-3 flex-1",
      isActive ? "text-acento-primario" : "text-acento-secundario"
    );

  return (
    <nav
      className={cn(
        "border-t border-superficie-primaria bg-fondo-secundario flex max-w-md w-full mx-auto",
        bloqueado && "pointer-events-none opacity-40"
      )}
      aria-label="Navegación principal"
    >
      <NavLink to="/pasajero/linea" className={linkClass} aria-disabled={bloqueado}>
        <Home className="h-5 w-5" />
        Inicio
      </NavLink>
      <NavLink to="/pasajero/perfil" className={linkClass} aria-disabled={bloqueado}>
        <User className="h-5 w-5" />
        Perfil
      </NavLink>
    </nav>
  );
}