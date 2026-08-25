// frontend/src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("pasajero");

const handleLogin = (data) => {
  // data = { rol, email, password }
  // Acá después conectamos el fetch/axios al backend
  console.log("Login submit:", data);
};

  return (
    <div className="min-h-dvh bg-fondo-principal flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md lg:max-w-lg flex flex-col items-center bg-superficie-primaria/40 lg:bg-transparent rounded-xl lg:rounded-none p-6 lg:p-0">

        {/* Encabezado */}
        <h1 className="text-3xl sm:text-4xl font-bold text-texto-principal mb-2 text-center">
          Veo Tu Micro
        </h1>
        <p className="text-acento-secundario text-base sm:text-lg mb-8 text-center">
          Sistema de accesibilidad en transporte
        </p>

        {/* Contenedor de Pestañas */}
        <Tabs defaultValue="pasajero" className="w-full" onValueChange={setActiveTab}>

          {/* Botones de las Pestañas */}
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-superficie-primaria h-auto min-h-14 rounded-lg gap-1 p-1">
            <TabsTrigger
              value="pasajero"
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal data-[state=active]:shadow-lg data-[state=active]:shadow-acento-primario/40 data-[state=active]:scale-[1.02] text-texto-principal text-sm sm:text-lg font-bold rounded-md py-2 sm:py-0 whitespace-nowrap transition-all"
            >
              Pasajero
            </TabsTrigger>
            <TabsTrigger
              value="conductor"
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal data-[state=active]:shadow-lg data-[state=active]:shadow-acento-primario/40 data-[state=active]:scale-[1.02] text-texto-principal text-sm sm:text-lg font-bold rounded-md py-2 sm:py-0 whitespace-nowrap transition-all"
            >
              Conductor
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="data-[state=active]:bg-acento-primario data-[state=active]:text-fondo-principal data-[state=active]:shadow-lg data-[state=active]:shadow-acento-primario/40 data-[state=active]:scale-[1.02] text-texto-principal text-sm sm:text-lg font-bold rounded-md py-2 sm:py-0 whitespace-nowrap transition-all"
            >
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Contenido Pestaña: Pasajero */}
          <TabsContent value="pasajero" className="flex flex-col items-center w-full">
            <LoginForm rol="Pasajero" onSubmit={handleLogin} />

            <div className="mt-8 w-full border-t-2 border-superficie-primaria pt-6 text-center">
              <p className="text-texto-principal text-base sm:text-lg mb-2">¿No tenés cuenta?</p>
              <Link
                to="/registro"
                className="inline-block w-full border-2 border-acento-secundario text-acento-primario hover:bg-superficie-primaria font-bold text-base sm:text-lg py-3 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-primario"
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