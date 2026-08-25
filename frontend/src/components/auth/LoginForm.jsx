// frontend/src/components/auth/LoginForm.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm({ rol, onSubmit, textoBoton = "Iniciar sesión" }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Completá correo y contraseña.");
      return;
    }

    onSubmit?.({ rol, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm mt-4" noValidate>

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
        <Label htmlFor={`email-${rol}`} className="text-texto-principal text-lg">
          Correo electrónico
        </Label>
        <Input
          id={`email-${rol}`}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@correo.com"
          required
          aria-required="true"
          aria-invalid={!!error}
          className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`password-${rol}`} className="text-texto-principal text-lg">
          Contraseña
        </Label>
        <Input
          id={`password-${rol}`}
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
          aria-required="true"
          aria-invalid={!!error}
          className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold text-lg h-14"
      >
        {textoBoton}
      </Button>

    </form>
  );
}