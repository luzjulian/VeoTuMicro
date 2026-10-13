// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ValidationPendingPage from "./pages/auth/ValidationPendingPage";
import { PasajeroFlowLayout } from "./components/pasajero/PasajeroFlowLayout";
import SeleccionLineaPage from "./pages/pasajero/SeleccionLineaPage";
import SeleccionDestinoPage from "./pages/pasajero/SeleccionDestinoPage";
import EsperaPage from "./pages/pasajero/EsperaPage";
import ABordoPage from "./pages/pasajero/ABordoPage";
import PanelConductorPage from "./pages/conductor/PanelConductorPage";
import AdminPanelPage from "./pages/admin/Adminpanelpage";
import PerfilPage from "./pages/perfil/PerfilPage";
import { RequireRole } from "./components/auth/RequireRole";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/registro/pendiente" element={<ValidationPendingPage />} />

        {/* Rutas protegidas: sin sesión van a /login; con otro rol, a la pantalla de su rol */}
        <Route element={<RequireRole roles={["pasajero"]} />}>
          <Route path="/pasajero" element={<PasajeroFlowLayout />}>
            <Route index element={<Navigate to="linea" replace />} />
            <Route path="linea" element={<SeleccionLineaPage />} />
            <Route path="destino" element={<SeleccionDestinoPage />} />
            <Route path="espera" element={<EsperaPage />} />
            <Route path="viaje" element={<ABordoPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole roles={["chofer"]} />}>
          <Route path="/conductor" element={<PanelConductorPage />} />
        </Route>

        <Route element={<RequireRole roles={["administrativo"]} />}>
          <Route path="/admin" element={<AdminPanelPage />} />
        </Route>

        <Route element={<RequireRole />}>
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;