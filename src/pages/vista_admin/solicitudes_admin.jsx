import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getApiUrl } from "../../config/api.js";
import "./visualizadores_admin.css";

export default function SolicitudesAdmin() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [mapaUsuarios, setMapaUsuarios] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // =========================================================
  // CARGAR SOLICITUDES Y USUARIOS DESDE EL BACKEND REAL
  // =========================================================
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Consultamos en paralelo las solicitudes y los usuarios registrados
      const [resSolicitudes, resUsuarios] = await Promise.all([
        fetch(getApiUrl("/report-requests?status=PENDING"), { headers }),
        fetch(getApiUrl("/users"), { headers }).catch(() => null),
      ]);

      // Mapeamos los usuarios para buscar rápidamente por UID o por correo
      if (resUsuarios && resUsuarios.ok) {
        const listaUsuarios = await resUsuarios.json();
        const mapa = {};
        listaUsuarios.forEach((usr) => {
          if (usr.uid && usr.nombre) mapa[usr.uid] = usr.nombre;
          if (usr.email && usr.nombre) mapa[usr.email.toLowerCase()] = usr.nombre;
        });
        setMapaUsuarios(mapa);
      }

      if (resSolicitudes.ok) {
        const data = await resSolicitudes.json();
        setSolicitudes(data.items || []);
      } else {
        console.error("Error al obtener solicitudes");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // =========================================================
  // FUNCIÓN PARA OBTENER EL NOMBRE COMPLETO REAL
  // =========================================================
  const obtenerNombreCompleto = (solicitud) => {
    const uid = solicitud.requester_uid;
    const email = (solicitud.requester_email || "").toLowerCase();

    // 1. Si existe en la lista de usuarios por UID o Correo, usamos su nombre real
    if (uid && mapaUsuarios[uid]) return mapaUsuarios[uid];
    if (email && mapaUsuarios[email]) return mapaUsuarios[email];

    // 2. Si la solicitud ya traía nombre directo
    if (solicitud.requester_name) return solicitud.requester_name;

    // 3. Fallback de emergencia extrayendo del correo
    if (!solicitud.requester_email) return "Especialista Desconocido";
    const parteLocal = solicitud.requester_email.split("@")[0];
    return parteLocal
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // =========================================================
  // FILTRAR POR BÚSQUEDA
  // =========================================================
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const termino = busqueda.toLowerCase();
    const nombreCompleto = obtenerNombreCompleto(sol).toLowerCase();

    return (
      (sol.session_id || "").toLowerCase().includes(termino) ||
      (sol.requester_email || "").toLowerCase().includes(termino) ||
      nombreCompleto.includes(termino)
    );
  });

  // =========================================================
  // ACCIONES: APROBAR O RECHAZAR (PATCH a la API)
  // =========================================================
  const handleAccion = (idUnico, accion) => {
    const isApproved = accion === "aprobada";
    const verbo = isApproved ? "Aprobar" : "Rechazar";
    const color = isApproved ? "#16a34a" : "#dc3545";

    if (!idUnico) {
      toast.error("Error: La solicitud no tiene un ID válido.");
      return;
    }

    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: color,
            }}>
            ¿{verbo} esta solicitud de descarga?
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className={isApproved ? "btn-toast-azul" : "btn-toast-rojo"}
              style={isApproved ? { backgroundColor: "#16a34a" } : {}}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastLoading = toast.loading("Procesando solicitud...");

                try {
                  const token = localStorage.getItem("token");
                  const bodyData = { approved: isApproved };

                  if (!isApproved) {
                    bodyData.reason = "Rechazado por el administrador.";
                  }

                  const respuesta = await fetch(
                    getApiUrl(`/report-requests/${idUnico}/review`),
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(bodyData),
                    }
                  );

                  if (!respuesta.ok) {
                    const errorData = await respuesta.json().catch(() => ({}));
                    throw new Error(
                      errorData.error || `Error del servidor: ${respuesta.status}`
                    );
                  }

                  setSolicitudes((prev) =>
                    prev.filter(
                      (s) => s.id !== idUnico && s.request_id !== idUnico
                    )
                  );

                  toast.success(`Solicitud ${accion} con éxito`, {
                    id: toastLoading,
                    duration: 4000,
                  });
                } catch (error) {
                  console.error(error);
                  toast.error(`Error: ${error.message}`, {
                    id: toastLoading,
                    duration: 6000,
                  });
                }
              }}>
              Confirmar
            </button>
            <button
              className="btn-toast-gris"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: `alerta-${idUnico}` }
    );
  };

  return (
    <div className="contenedor-tabla-admin">
      <div className="cabecera-tabla">
        <h2>Gestión de Solicitudes de Informes</h2>
      </div>

      <div className="contenedor-buscador">
        <input
          type="text"
          className="input-buscador"
          placeholder="🔍 Buscar por sesión, nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-responsive">
        <table className="tabla-estilizada">
          <thead>
            <tr>
              <th>ID de Sesión</th>
              <th>Especialista</th>
              <th>Formato</th>
              <th>Fecha Solicitud</th>
              <th>Estado</th>
              <th className="texto-centro">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="6" className="tabla-vacia">
                  Cargando solicitudes pendientes...
                </td>
              </tr>
            ) : solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((solicitud) => {
                const idUnico = solicitud.request_id || solicitud.id;
                const tipoDoc =
                  solicitud.motivo === "PDF" || solicitud.motivo === "EXCEL"
                    ? solicitud.motivo
                    : "DOC";
                const isPdf = tipoDoc === "PDF";

                const fechaCorta = solicitud.created_at
                  ? new Date(solicitud.created_at).toLocaleDateString("es-CL")
                  : "Desconocida";

                // Obtenemos el nombre completo cruzado con la lista de usuarios
                const nombreMostrar = obtenerNombreCompleto(solicitud);

                return (
                  <tr key={idUnico}>
                    <td className="fw-bold">{solicitud.session_id}</td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "600", color: "#17315E" }}>
                          {nombreMostrar}
                        </span>
                        {/* AQUÍ SE AGRANDÓ LA LETRA A 13.5px */}
                        <span style={{ fontSize: "13.5px", color: "#6b7280" }}>
                          {solicitud.requester_email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className="badge-rol"
                        style={{
                          backgroundColor: isPdf ? "#fecaca" : "#bbf7d0",
                          color: isPdf ? "#991b1b" : "#166534",
                        }}>
                        {tipoDoc}
                      </span>
                    </td>
                    <td>{fechaCorta}</td>
                    <td>
                      <span
                        className="badge-estado inactivo"
                        style={{
                          backgroundColor: "#fef08a",
                          color: "#854d0e",
                        }}>
                        Pendiente
                      </span>
                    </td>

                    <td className="celda-acciones">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}>
                        <button
                          className="btn-accion btn-activar"
                          onClick={() => handleAccion(idUnico, "aprobada")}
                          title="Aprobar Solicitud"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "auto",
                            height: "auto",
                            padding: "6px 12px",
                            borderRadius: "6px",
                          }}>
                          <span
                            style={{
                              fontSize: "16px",
                              marginBottom: "2px",
                              lineHeight: "1",
                            }}>
                            ✅
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "600" }}>
                            Aceptar
                          </span>
                        </button>

                        <button
                          className="btn-accion btn-eliminar"
                          onClick={() => handleAccion(idUnico, "rechazada")}
                          title="Rechazar Solicitud"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "auto",
                            height: "auto",
                            padding: "6px 12px",
                            borderRadius: "6px",
                          }}>
                          <span
                            style={{
                              fontSize: "16px",
                              marginBottom: "2px",
                              lineHeight: "1",
                            }}>
                            ❌
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "600" }}>
                            Denegar
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="tabla-vacia">
                  {busqueda
                    ? "No se encontraron solicitudes con esos criterios."
                    : "No hay solicitudes de descarga pendientes."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}