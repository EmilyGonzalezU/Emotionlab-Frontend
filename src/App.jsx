import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Vistas públicas y Admin
import Login from "./pages/login.jsx";
import MenuAdmin from "./pages/vista_admin/menu_admin.jsx";
import HomeAdmin from "./pages/vista_admin/home_admin.jsx";
import ListaVisualizadores from "./pages/vista_admin/visualizadores_admin.jsx";
import CrearVisualizador from "./pages/vista_admin/creacion_visor.jsx";
import CuentaAdmin from "./pages/vista_admin/cuenta_admin.jsx";

// Vistas Teacher / Visor
import MenuVisor from "./pages/vista_visor/menu_visor.jsx";
import HomeTeacher from "./pages/vista_visor/home_visor.jsx";
import CuentaVisor from "./pages/vista_visor/cuenta_visor.jsx";
import SesionesVisor from "./pages/vista_visor/sesiones_visor.jsx";
import SesionDetalle from "./pages/vista_visor/sesion_detalle.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Login */}
        <Route path="/" element={<Login />} />

        {/* Layout Admin */}
        <Route path="/admin" element={<MenuAdmin />}>
          <Route index element={<HomeAdmin />} />
          <Route path="visualizadores" element={<ListaVisualizadores />} />
          <Route path="crear-visualizador" element={<CrearVisualizador />} />
          <Route path="cuenta" element={<CuentaAdmin />} />
        </Route>

        {/* Layout Visor / Teacher */}
        <Route path="/teacher" element={<MenuVisor />}>
          <Route index element={<HomeTeacher />} />
          <Route path="sesiones" element={<SesionesVisor />} />
          <Route path="sesiones/:id" element={<SesionDetalle />} />
          <Route path="cuenta" element={<CuentaVisor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
