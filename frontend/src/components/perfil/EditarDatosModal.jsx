// frontend/src/components/perfil/EditarDatosModal.jsx
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Modal para editar los datos del perfil (nombre, email, teléfono).
 * - El DNI se muestra pero no se puede modificar.
 * - Validaciones equivalentes a las de RegisterPage (campos obligatorios).
 * - Además valida formato de email básico (mismo criterio que type="email" nativo).
 */
export function EditarDatosModal({ abierto, datosIniciales, onClose, onGuardar }) {
  const [formData, setFormData] = useState(datosIniciales);
  const [error, setError] = useState(null);

  // Reiniciamos el formulario cada vez que se abre el modal
  useEffect(() => {
    if (abierto) {
      setFormData(datosIniciales);
      setError(null);
    }
  }, [abierto, datosIniciales]);

  // Escape para cerrar + bloquear scroll del body
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Campos obligatorios (mismo criterio que RegisterPage)
    if (!formData.nombre || !formData.email || !formData.telefono) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    // Formato de email (equivalente al type="email" del RegisterPage)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!emailValido) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    // Acá después conectamos con el backend (PATCH /api/perfil)
    onGuardar(formData);
  };

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-fondo-principal border border-superficie-primaria rounded-xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id="titulo-editar"
            className="text-xl font-bold text-texto-principal"
          >
            Editar datos
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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-estado-error text-base font-medium"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-texto-principal text-lg">
              Nombre completo
            </Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre y apellido"
              required
              aria-required="true"
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-texto-principal text-lg">
              Correo electrónico
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
              aria-required="true"
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-texto-principal text-lg">
              Teléfono
            </Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+54 221 555 1234"
              required
              aria-required="true"
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dni" className="text-texto-principal text-lg">
              DNI
            </Label>
            <Input
              id="dni"
              name="dni"
              type="text"
              value={formData.dni}
              disabled
              aria-disabled="true"
              className="bg-fondo-secundario border-superficie-primaria text-acento-secundario text-lg h-12 cursor-not-allowed"
            />
            <p className="text-sm text-acento-secundario">
              El DNI no puede modificarse.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-base sm:text-lg h-14"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold text-base sm:text-lg h-14"
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}