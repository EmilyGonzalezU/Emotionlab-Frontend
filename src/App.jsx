import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Actualizacion from "./pages/Actualizacion/Actualizacion";
import { useElectronUpdater } from "./hooks/useElectronUpdater";

import Alertas from "./components/alertas.jsx";
import RutaProtegida from "./components/rutaProtegida.jsx";
import ForgotPassword from "./components/forgotPassword.jsx";
import ResetPassword from "./pages/resetPassword.jsx";

// ADMIN
import Login from "./pages/login.jsx";
import MenuAdmin from "./pages/vista_admin/menu_admin.jsx";
import HomeAdmin from "./pages/vista_admin/home_admin.jsx";
import ListaEspecialistas from "./pages/vista_admin/visualizadores_admin.jsx";
import CrearEspecialista from "./pages/vista_admin/creacion_visor.jsx";
import CuentaAdmin from "./pages/vista_admin/cuenta_admin.jsx";
import SolicitudesAdmin from "./pages/vista_admin/solicitudes_admin.jsx";
import AuditLogs from "./pages/vista_admin/auditLogs.jsx";

// TEACHER / ESPECIALISTA
import MenuEspecialista from "./pages/vista_visor/menu_visor.jsx";
import HomeEspecialista from "./pages/vista_visor/home_visor.jsx";
import CuentaEspecialista from "./pages/vista_visor/cuenta_visor.jsx";
import SesionesEspecialista from "./pages/vista_visor/sesiones_visor.jsx";
import SesionDetalle from "./pages/vista_visor/sesion_detalle.jsx";
import SolicitudesEspecialista from "./pages/vista_visor/solicitudes_visor.jsx";

function App() {
  /*
   * ============================================================
   * ACTUALIZADOR DE ELECTRON
   * ============================================================
   *
   * En desarrollo el hook simplemente no hace nada porque
   * window.electronAPI.updater no existe.
   *
   * En la aplicación empaquetada, Electron enviará los estados:
   *
   * idle
   * checking
   * available
   * not-available
   * downloading
   * downloaded
   * error
   */
  const update = useElectronUpdater();

  /*
   * ============================================================
   * PANTALLA DE ACTUALIZACIÓN
   * ============================================================
   *
   * Cuando la actualización ya comenzó a descargarse,
   * mostramos la pantalla de actualización de EmotionLab
   * en lugar de las pantallas normales.
   *
   * La pantalla también permanece visible cuando la descarga
   * terminó, mientras Electron prepara la instalación.
   */

  if (
    update.status === "downloading" ||
    update.status === "downloaded"
  ) {
    return (
      <Actualizacion
        version={update.version}
        percent={update.percent}
        status={update.status}
      />
    );
  }

  return (
    <>
      <HashRouter>
        <Routes>
          {/* ==================================================
              LOGIN
             ================================================== */}

          <Route
            path="/"
            element={<Login />}
          />

          <Route
            path="/recuperar-contrasena"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ==================================================
              ADMIN
             ================================================== */}

          <Route
            path="/admin"
            element={
              <RutaProtegida rolPermitido="admin">
                <MenuAdmin />
              </RutaProtegida>
            }
          >
            <Route
              index
              element={<HomeAdmin />}
            />

            <Route
              path="visualizadores"
              element={<ListaEspecialistas />}
            />

            <Route
              path="crear-visualizador"
              element={<CrearEspecialista />}
            />

            <Route
              path="solicitudes"
              element={<SolicitudesAdmin />}
            />

            <Route
              path="auditoria"
              element={<AuditLogs />}
            />

            <Route
              path="cuenta"
              element={<CuentaAdmin />}
            />
          </Route>

          {/* ==================================================
              TEACHER / ESPECIALISTA
             ================================================== */}

          <Route
            path="/teacher"
            element={
              <RutaProtegida rolPermitido="teacher">
                <MenuEspecialista />
              </RutaProtegida>
            }
          >
            <Route
              index
              element={<HomeEspecialista />}
            />

            <Route
              path="sesiones"
              element={<SesionesEspecialista />}
            />

            <Route
              path="sesiones/:id"
              element={<SesionDetalle />}
            />

            <Route
              path="solicitudes"
              element={<SolicitudesEspecialista />}
            />

            <Route
              path="cuenta"
              element={<CuentaEspecialista />}
            />
          </Route>

          {/* ==================================================
              ALIAS ESPECIALISTA
             ================================================== */}

          <Route
            path="/especialista"
            element={
              <RutaProtegida rolPermitido="teacher">
                <MenuEspecialista />
              </RutaProtegida>
            }
          >
            <Route
              index
              element={<HomeEspecialista />}
            />

            <Route
              path="sesiones"
              element={<SesionesEspecialista />}
            />

            <Route
              path="sesiones/:id"
              element={<SesionDetalle />}
            />

            <Route
              path="solicitudes"
              element={<SolicitudesEspecialista />}
            />

            <Route
              path="cuenta"
              element={<CuentaEspecialista />}
            />
          </Route>
        </Routes>
      </HashRouter>

      <Alertas />
    </>
  );
}

export default App;