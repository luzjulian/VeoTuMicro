import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirigir la ruta raíz al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Nuestra pantalla de Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Ruta temporal para el registro (para que no rompa el enlace) */}
        <Route path="/registro" element={<div className="p-8 text-white">Próximamente: Pantalla de Registro</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;