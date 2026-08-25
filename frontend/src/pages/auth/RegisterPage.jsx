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

    // Acá después conectamos con el backend (multipart/form-data por el PDF)
    console.log("Registro submit:", { ...formData, certificado });

    navigate("/registro/pendiente"); // cuando el backend confirme el alta
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
            <p role="alert" aria-live="polite" className="text-estado-error text-base font-medium">
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
            <Label htmlFor="password" className="text-texto-principal text-lg">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              aria-required="true"
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-texto-principal text-lg">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              aria-required="true"
              className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-texto-principal text-lg">
              Certificado de discapacidad (PDF)
            </Label>
            <FileUpload onFileSelect={setCertificado} />
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