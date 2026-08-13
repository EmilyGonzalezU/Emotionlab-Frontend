import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Alertas from "./components/alertas.jsx";
import RutaProtegida from "./components/rutaProtegida.jsx";
import ForgotPassword from './components/forgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

// ADMIN
import Login from "./pages/login.jsx";
import MenuAdmin from "./pages/vista_admin/menu_admin.jsx";
import HomeAdmin from "./pages/vista_admin/home_admin.jsx";
import ListaVisualizadores from "./pages/vista_admin/visualizadores_admin.jsx";
import CrearVisualizador from "./pages/vista_admin/creacion_visor.jsx";
import CuentaAdmin from "./pages/vista_admin/cuenta_admin.jsx";

// TEACHER
import MenuVisor from "./pages/vista_visor/menu_visor.jsx";
import HomeTeacher from "./pages/vista_visor/home_visor.jsx";
import CuentaVisor from "./pages/vista_visor/cuenta_visor.jsx";
import SesionesVisor from "./pages/vista_visor/sesiones_visor.jsx";
import SesionDetalle from "./pages/vista_visor/sesion_detalle.jsx";

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          {/* LOGIN */}
          <Route path="/" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================
              ADMIN
             ========================= */}

          <Route
            path="/admin"
            element={
              <RutaProtegida rolPermitido="admin">
                <MenuAdmin />
              </RutaProtegida>
            }>
            <Route index element={<HomeAdmin />} />

            <Route path="visualizadores" element={<ListaVisualizadores />} />

            <Route path="crear-visualizador" element={<CrearVisualizador />} />

            <Route path="cuenta" element={<CuentaAdmin />} />
          </Route>

          {/* =========================
              TEACHER
             ========================= */}

          <Route
            path="/teacher"
            element={
              <RutaProtegida rolPermitido="teacher">
                <MenuVisor />
              </RutaProtegida>
            }>
            <Route index element={<HomeTeacher />} />

            <Route path="sesiones" element={<SesionesVisor />} />

            <Route path="sesiones/:id" element={<SesionDetalle />} />

            <Route path="cuenta" element={<CuentaVisor />} />
          </Route>

          {/* =========================
              ALIAS VISUALIZADOR
             ========================= */}

          <Route
            path="/visualizador"
            element={
              <RutaProtegida rolPermitido="teacher">
                <MenuVisor />
              </RutaProtegida>
            }>
            <Route index element={<HomeTeacher />} />

            <Route path="sesiones" element={<SesionesVisor />} />

            <Route path="sesiones/:id" element={<SesionDetalle />} />

            <Route path="cuenta" element={<CuentaVisor />} />
          </Route>
        </Routes>
      </HashRouter>
      <Alertas />
    </>
  );
}

export default App;
