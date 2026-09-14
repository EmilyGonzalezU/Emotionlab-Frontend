import React, { useMemo, useState } from "react";
import { FiInbox, FiSearch } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import ReportStatusBadge from "./ReportStatusBadge.jsx";
import ReportReview from "./ReportReview.jsx";
import { usePendingReportRequests, useUsersDirectory } from "./useReports.js";
import "./ReportsList.css";

function construirMapaUsuarios(usuarios) {
  const mapa = {};
  (usuarios || []).forEach((usr) => {
    if (usr.uid && usr.nombre) mapa[usr.uid] = usr.nombre;
    if (usr.email && usr.nombre) mapa[usr.email.toLowerCase()] = usr.nombre;
  });
  return mapa;
}

// Extraído literalmente de la lógica ya validada en
// pages/vista_admin/solicitudes_admin.jsx: cruza la solicitud con la
// lista de usuarios por UID o correo y, si no hay coincidencia, arma
// un nombre legible a partir del correo como último recurso.
function obtenerNombreEspecialista(solicitud, mapaUsuarios) {
  const uid = solicitud.requester_uid;
  const email = (solicitud.requester_email || "").toLowerCase();

  if (uid && mapaUsuarios[uid]) return mapaUsuarios[uid];
  if (email && mapaUsuarios[email]) return mapaUsuarios[email];
  if (solicitud.requester_name) return solicitud.requester_name;
  if (!solicitud.requester_email) return "Especialista desconocido";

  const parteLocal = solicitud.requester_email.split("@")[0];
  return parteLocal.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Reemplaza pages/vista_admin/solicitudes_admin.jsx.
 *
 * Usa CSS propia y autocontenida en vez de reutilizar
 * visualizadores_admin.css: ese archivo lo sigue importando
 * pages/vista_admin/visualizadores_admin.jsx (pantalla "Visualizadores",
 * fuera de alcance de esta fase), así que no se toca ni se reutiliza
 * para no arriesgar esa pantalla — mismo criterio que se aplicó con
 * sesiones_visor.css en la Fase 3.
 *
 * Reemplaza también el patrón de "toast como confirmación" por
 * ConfirmationDialog (dentro de ReportReview) y elimina los emojis
 * ✅/❌ de las acciones.
 */
export default function ReportsList() {
  const { data, isLoading, isError } = usePendingReportRequests();
  const { data: usuariosData } = useUsersDirectory();
  const [busqueda, setBusqueda] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const mapaUsuarios = useMemo(() => construirMapaUsuarios(usuariosData), [usuariosData]);
  const solicitudes = data?.items || [];

  const solicitudesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return solicitudes;

    return solicitudes.filter((s) => {
      const nombre = obtenerNombreEspecialista(s, mapaUsuarios).toLowerCase();
      return (
        (s.session_id || "").toLowerCase().includes(termino) ||
        (s.requester_email || "").toLowerCase().includes(termino) ||
        nombre.includes(termino)
      );
    });
  }, [busqueda, solicitudes, mapaUsuarios]);

  return (
    <div className="el-reports-list">
      <PageHeader
        title="Solicitudes de reportes"
        description="Revisa el contexto de cada sesión y valida las solicitudes de reportes enviadas por los especialistas."
      />

      <div className="el-reports-search">
        <FiSearch aria-hidden="true" />
        <input
          type="text"
          className="el-reports-search-input"
          placeholder="Buscar por sesión, nombre o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar solicitudes de reportes"
        />
      </div>

      <section className="el-reports-table-card">
        {isLoading ? (
          <SkeletonRows rows={5} columns={5} />
        ) : isError ? (
          <EmptyState
            title="No se pudieron obtener las solicitudes"
            description="Ocurrió un problema al conectar con el servidor. Intenta nuevamente."
          />
        ) : solicitudesFiltradas.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title="Sin solicitudes pendientes"
            description={
              busqueda
                ? "No se encontraron solicitudes con esos criterios."
                : "No hay solicitudes de reportes pendientes de revisión."
            }
          />
        ) : (
          <div className="el-reports-table-scroll">
            <table className="el-reports-table">
              <thead>
                <tr>
                  <th>Sesión</th>
                  <th>Especialista</th>
                  <th>Formato</th>
                  <th>Fecha de solicitud</th>
                  <th>Estado</th>
                  <th className="el-reports-table-col-actions">Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((solicitud) => {
                  const idUnico = solicitud.request_id || solicitud.id;
                  const nombre = obtenerNombreEspecialista(solicitud, mapaUsuarios);
                  const fecha = solicitud.created_at
                    ? new Date(solicitud.created_at).toLocaleDateString("es-CL")
                    : "No disponible";

                  return (
                    <tr key={idUnico}>
                      <td className="el-reports-table-id">{solicitud.session_id}</td>
                      <td>
                        <div className="el-reports-table-specialist">
                          <span>{nombre}</span>
                          <span className="el-reports-table-specialist-email">
                            {solicitud.requester_email}
                          </span>
                        </div>
                      </td>
                      <td>{solicitud.motivo || "No disponible"}</td>
                      <td>{fecha}</td>
                      <td>
                        <ReportStatusBadge status={solicitud.status} />
                      </td>
                      <td className="el-reports-table-col-actions">
                        <Button variant="secondary" size="sm" onClick={() => setSolicitudSeleccionada(solicitud)}>
                          Revisar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReportReview
        solicitud={solicitudSeleccionada}
        nombreEspecialista={
          solicitudSeleccionada ? obtenerNombreEspecialista(solicitudSeleccionada, mapaUsuarios) : ""
        }
        onClose={() => setSolicitudSeleccionada(null)}
      />
    </div>
  );
}
