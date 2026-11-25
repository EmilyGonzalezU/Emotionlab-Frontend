import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import { useElectronUpdater } from "./hooks/useElectronUpdater";

import Alertas from "./components/alertas.jsx";
import RutaProtegida from "./components/rutaProtegida.jsx";
import { SkeletonPage } from "./ui/LoadingState.jsx";

const Actualizacion = lazy(() => import("./pages/Actualizacion/Actualizacion"));
const ForgotPassword = lazy(() => import("./components/forgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/resetPassword.jsx"));
const Login = lazy(() => import("./pages/login.jsx"));
const MenuAdmin = lazy(() => import("./pages/vista_admin/menu_admin.jsx"));
const HomeAdmin = lazy(() => import("./pages/vista_admin/home_admin.jsx"));
const ListaEspecialistas = lazy(() => import("./pages/vista_admin/visualizadores_admin.jsx"));
const CrearEspecialista = lazy(() => import("./pages/vista_admin/creacion_visor.jsx"));
const CuentaAdmin = lazy(() => import("./pages/vista_admin/cuenta_admin.jsx"));
const SolicitudesAdmin = lazy(() => import("./pages/vista_admin/solicitudes_admin.jsx"));
const AuditLogs = lazy(() => import("./pages/vista_admin/auditLogs.jsx"));
const MenuEspecialista = lazy(() => import("./pages/vista_visor/menu_visor.jsx"));
const HomeEspecialista = lazy(() => import("./pages/vista_visor/home_visor.jsx"));
const CuentaEspecialista = lazy(() => import("./pages/vista_visor/cuenta_visor.jsx"));
const SesionesEspecialista = lazy(() => import("./pages/vista_visor/sesiones_visor.jsx"));
const SesionDetalle = lazy(() => import("./pages/vista_visor/sesion_detalle.jsx"));
const SolicitudesEspecialista = lazy(() => import("./pages/vista_visor/solicitudes_visor.jsx"));
const TrackingsPage = lazy(() => import("./features/trackings/TrackingsPage.jsx"));
const TrackingInspectPage = lazy(() => import("./features/trackings/TrackingInspectPage.jsx"));

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
        <Suspense fallback={<SkeletonPage variant="dashboard" label="Cargando vista" />}>
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
              path="experiencias"
              element={<TrackingsPage />}
            />
            <Route path="experiencias/:trackingId" element={<TrackingInspectPage />} />


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
              path="experiencias"
              element={<TrackingsPage />}
            />
            <Route path="experiencias/:trackingId" element={<TrackingInspectPage />} />

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
        </Suspense>
      </HashRouter>

      <Alertas />
    </>
  );
}

export default App;
