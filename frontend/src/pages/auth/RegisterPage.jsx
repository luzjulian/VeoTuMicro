// frontend/src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/common/FileUpload";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombre || !formData.email || !formData.password) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!certificado) {
      setError("Necesitás adjuntar tu certificado de discapacidad en PDF.");
      return;
    }

    console.log("Registro submit:", { ...formData, certificado });

    navigate("/registro/pendiente");
  };

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md lg:max-w-lg flex flex-col items-center">

        <h1 className="text-3xl sm:text-4xl font-bold text-texto-principal mb-2 text-center">
          Crear cuenta de Pasajero
        </h1>
        <p className="text-acento-secundario text-base sm:text-lg mb-8 text-center">
          Sistema de accesibilidad en transporte
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 w-full" noValidate>

          {error && (
            <p role="alert" id="form-error" className="text-estado-error text-base font-medium">
              {error}
            </p>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label id="nombre-label" htmlFor="nombre" className="text-texto-principal text-lg">
              Nombre completo
            </Label>
            <p id="nombre-hint" className="text-acento-secundario text-sm">
              Ingresa tu nombre y apellido.
            </p>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Pepe Argento"
              required
              aria-required="true"
              aria-labelledby="nombre-label nombre-hint"
              aria-describedby={error ? "form-error" : undefined}
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label id="email-label" htmlFor="email" className="text-texto-principal text-lg">
              Correo electrónico
            </Label>
            <p id="email-hint" className="text-acento-secundario text-sm">
              Ingresa tu correo electrónico.
            </p>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="pepeargento@correo.com"
              required
              aria-required="true"
              aria-labelledby="email-label email-hint"
              aria-describedby={error ? "form-error" : undefined}
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label id="password-label" htmlFor="password" className="text-texto-principal text-lg">
              Contraseña
            </Label>
            <p id="password-hint" className="text-acento-secundario text-sm">
              Ingresa una contraseña.
            </p>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              aria-required="true"
              aria-labelledby="password-label password-hint"
              aria-describedby={error ? "form-error" : undefined}
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          {/* Confirmar password */}
          <div className="space-y-2">
            <Label id="confirmPassword-label" htmlFor="confirmPassword" className="text-texto-principal text-lg">
              Confirmar contraseña
            </Label>
            <p id="confirmPassword-hint" className="text-acento-secundario text-sm">
              Repite la contraseña.
            </p>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              aria-required="true"
              aria-labelledby="confirmPassword-label confirmPassword-hint"
              aria-describedby={error ? "form-error" : undefined}
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          {/* Certificado */}
          <div className="space-y-2">
            <Label id="certificado-label" htmlFor="certificado" className="text-texto-principal text-lg">
              Certificado de discapacidad (PDF)
            </Label>
            <p id="certificado-hint" className="text-acento-secundario text-sm">
              Adjunta tu certificado de discapacidad en formato PDF.
            </p>
            <FileUpload
              id="certificado"
              onFileSelect={setCertificado}
              aria-labelledby="certificado-label certificado-hint"
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold text-lg h-14"
          >
            Crear cuenta
          </Button>

        </form>

        <div className="mt-8 w-full border-t-2 border-superficie-primaria pt-6 text-center">
          <p className="text-texto-principal text-base sm:text-lg mb-2">¿Ya tenés cuenta?</p>
          <Link
            to="/login"
            className="inline-block w-full border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-base sm:text-lg py-3 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-primario"
          >
            Iniciar sesión
          </Link>
        </div>

      </div>
    </div>
  );
}