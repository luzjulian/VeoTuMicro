import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function LoginForm({ rol, onSubmit, textoBoton = "Iniciar sesión" }) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego enviaremos los datos al backend
    console.log(`Intentando iniciar sesión como: ${rol}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm mt-4">
      
      {/* Campo de Correo Electrónico */}
      <div className="space-y-2">
        <Label htmlFor={`email-${rol}`} className="text-texto-principal text-lg">
          Correo electrónico
        </Label>
        <Input 
          id={`email-${rol}`}
          type="email" 
          placeholder="tu@correo.com" 
          required
          className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
          aria-label="Ingresar correo electrónico"
        />
      </div>

      {/* Campo de Contraseña */}
      <div className="space-y-2">
        <Label htmlFor={`password-${rol}`} className="text-texto-principal text-lg">
          Contraseña
        </Label>
        <Input 
          id={`password-${rol}`}
          type="password" 
          placeholder="••••••••" 
          required
          className="bg-superficie-primaria border-acento-secundario text-texto-principal placeholder:text-acento-secundario/50 text-lg h-12"
          aria-label="Ingresar contraseña"
        />
      </div>

      {/* Botón de Acción Principal */}
      <Button 
        type="submit" 
        className="w-full bg-estado-exito hover:bg-estado-exito/80 text-fondo-principal font-bold text-lg h-14"
      >
        {textoBoton}
      </Button>

    </form>
  );
}