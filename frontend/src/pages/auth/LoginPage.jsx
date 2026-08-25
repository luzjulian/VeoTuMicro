import { useState } from "react";
import { Link } from "react-router-dom"; // Asegurate de tener instalado react-router-dom
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "../../components/auth/LoginForm";

export default function LoginPage() {
  // Estado del padre para saber en qué pestaña estamos (Datos)
  const [activeTab, setActiveTab] = useState("pasajero");

  // Función que recibe el evento del hijo (Eventos arriba)
  const handleLogin = (e) => {
    // Más adelante acá validaremos con el Backend (Node.js)
    console.log(`Intentando iniciar sesión en el rol: ${activeTab}`);
  };

  return (
    <div className="min-h-screen bg-fondo-principal flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Encabezado */}
        <h1 className="text-4xl font-bold text-texto-principal mb-2">Veo Tu Micro</h1>
        <p className="text-acento-secundario text-lg mb-8">Sistema de accesibilidad en transporte</p>

        {/* Contenedor de Pestañas */}
        <Tabs defaultValue="pasajero" className="w-full" onValueChange={setActiveTab}>
          
          {/* Botones de las Pestañas */}
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-superficie-primaria h-14 rounded-lg">
            <TabsTrigger 
              value="pasajero" 
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal text-texto-principal text-lg font-bold rounded-md"
            >
              Pasajero
            </TabsTrigger>
            <TabsTrigger 
              value="conductor" 
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal text-texto-principal text-lg font-bold rounded-md"
            >
              Conductor
            </TabsTrigger>
            <TabsTrigger 
              value="admin" 
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal text-texto-principal text-lg font-bold rounded-md"
            >
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Contenido Pestaña: Pasajero */}
          <TabsContent value="pasajero" className="flex flex-col items-center w-full">
            <LoginForm rol="Pasajero" onSubmit={handleLogin} />
            
            {/* Divisor y enlace de registro exclusivo para pasajero */}
            <div className="mt-8 w-full border-t-2 border-superficie-primaria pt-6 text-center">
              <p className="text-texto-principal text-lg mb-2">¿No tenés cuenta?</p>
              <Link 
                to="/registro" 
                className="inline-block w-full border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-lg py-3 rounded-md transition-colors"
              >
                Registrarme como pasajero
              </Link>
            </div>
          </TabsContent>

          {/* Contenido Pestaña: Conductor */}
          <TabsContent value="conductor" className="flex flex-col items-center w-full">
            <LoginForm rol="Conductor" onSubmit={handleLogin} />
          </TabsContent>

          {/* Contenido Pestaña: Admin */}
          <TabsContent value="admin" className="flex flex-col items-center w-full">
            <LoginForm rol="Administrador" onSubmit={handleLogin} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}