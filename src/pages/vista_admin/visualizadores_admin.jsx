import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./visualizadores_admin.css";
import { getApiUrl } from "../../config/api.js";

export default function ListaEspecialistas() {
  const navigate = useNavigate();
  const [especialistas, setEspecialistas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: "",
    email: "",
    rol: "",
  });

  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  // Función formateadora para transformar "admin" -> "Administrador" y "teacher" -> "Especialista"
  const obtenerNombreRol = (rol) => {
    const rolLower = String(rol || "").toLowerCase().trim();
    if (rolLower === "admin") return "Administrador";
    if (rolLower === "teacher" || rolLower === "visor" || rolLower === "visualizador" || rolLower === "especialista") {
      return "Especialista";
    }
    return rol;
  };

  const obtenerEspecialistas = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (!mountedRef.current) return;
      const token = localStorage.getItem("token");
      const respuesta = await fetch(getApiUrl("/users"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`);
      const dataReales = await respuesta.json();
      if (mountedRef.current) {
        setEspecialistas(dataReales);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("Error con el backend:", error);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    obtenerEspecialistas();
    return () => {
      mountedRef.current = false;
    };
  }, [obtenerEspecialistas]);

  const especialistasFiltrados = especialistas.filter((especialista) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      especialista.nombre?.toLowerCase().includes(textoBuscado) ||
      especialista.email?.toLowerCase().includes(textoBuscado)
    );
  });

  const iniciarEdicion = (especialista) => {
    setEditandoId(especialista.uid);
    setDatosEdicion({
      nombre: especialista.nombre,
      email: especialista.email,
      rol: especialista.rol,
    });
  };

  const handleChangeEdicion = (e) => {
    setDatosEdicion({ ...datosEdicion, [e.target.name]: e.target.value });
  };

  const guardarEdicion = async (uid) => {
    if (guardando) return
    
    setGuardando(true); // Bloqueamos todo
    const toastId = toast.loading("Guardando cambios...", { id: "editar-usuario" });

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(getApiUrl(`/users/${uid}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosEdicion),
      });

      if (!respuesta.ok) throw new Error("Error al actualizar");

      setEspecialistas(
        especialistas.map((especialista) =>
          especialista.uid === uid ? { ...especialista, ...datosEdicion } : especialista,
        ),
      );

      setEditandoId(null);
      toast.success("Usuario actualizado correctamente", { id: toastId, duration: 5000 });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un problema al guardar los cambios", { id: toastId, duration: 5000 });
    } finally {
      setGuardando(false); // Liberamos el botón al terminar
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  // Función para DESACTIVAR usuario
  const handleDesactivar = (uid) => {
    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: "#17315E",
            }}>
            ¿Desactivar este usuario?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-toast-azul"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const token = localStorage.getItem("token");
                  const respuesta = await fetch(
                    getApiUrl(`/users/${uid}/disable`),
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );
                  if (!respuesta.ok) throw new Error("Error al desactivar");

                  // Actualizar el estado local
                  setEspecialistas(
                    especialistas.map((especialista) =>
                      especialista.uid === uid ? { ...especialista, activo: false } : especialista,
                    ),
                  );

                  toast.success("Usuario desactivado con éxito", {
                    duration: 5000,
                  });
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("No se pudo desactivar al usuario", {
                    duration: 5000,
                  });
                }
              }}>
              Desactivar
            </button>
            <button
              className="btn-toast-gris"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: "alerta-confirmacion" },
    );
  };

  // Función para ACTIVAR usuario
  const handleActivar = (uid) => {
    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: "#17315E",
            }}>
            ¿Activar este usuario?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-toast-azul"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const token = localStorage.getItem("token");
                  const respuesta = await fetch(
                    getApiUrl(`/users/${uid}/enable`),
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );
                  if (!respuesta.ok) throw new Error("Error al activar");

                  // Actualizar el estado local
                  setEspecialistas(
                    especialistas.map((especialista) =>
                      especialista.uid === uid ? { ...especialista, activo: true } : especialista,
                    ),
                  );

                  toast.success("Usuario activado con éxito", {
                    duration: 5000,
                  });
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("No se pudo activar al usuario", {
                    duration: 5000,
                  });
                }
              }}>
              Activar
            </button>
            <button
              className="btn-toast-gris"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: "alerta-confirmacion" },
    );
  };

  // Función para ELIMINAR usuario
  const handleEliminar = (uid) => {
    toast(
      (t) => (
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "bold",
              color: "#dc3545",
            }}>
            ⚠️ ¿Eliminar a este usuario?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-toast-rojo"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const token = localStorage.getItem("token");
                  const respuesta = await fetch(
                    getApiUrl(`/users/${uid}`),
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );
                  if (!respuesta.ok) throw new Error("Error al eliminar");

                  setEspecialistas(
                    especialistas.filter((especialista) => especialista.uid !== uid),
                  );
                  toast.success("Usuario eliminado correctamente", {
                    duration: 5000,
                  });
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("No se pudo eliminar al usuario", {
                    duration: 5000,
                  });
                }
              }}>
              Eliminar
            </button>
            <button
              className="btn-toast-gris"
              onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: "alerta-confirmacion" },
    );
  };

  let miUid = null;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      miUid = payload.sub || payload.identity || payload.uid;
    }
  } catch {
    // Token mal formado o no base64 válido → miUid queda null.
  }

  return (
    <div className="contenedor-tabla-admin">
      <div className="cabecera-tabla">
        <h2>Gestión de Especialistas</h2>
        <button
          className="btn-crear"
          onClick={() => navigate("/admin/crear-visualizador")}>
          + Crear Especialista
        </button>
      </div>

      <div className="contenedor-buscador">
        <input
          type="text"
          className="input-buscador"
          placeholder="🔍 Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-responsive">
        <table className="tabla-estilizada">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="texto-centro">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialistasFiltrados.length > 0 ? (
              especialistasFiltrados.map((especialista, index) => (
                <tr key={especialista.uid || index}>
                  {editandoId === especialista.uid ? (
                    <>
                      <td>
                        <input
                          name="nombre"
                          value={datosEdicion.nombre}
                          onChange={handleChangeEdicion}
                          className="input-buscador"
                          style={{ padding: "6px 10px", width: "90%" }}
                        />
                      </td>
                      <td>
                        <input
                          name="email"
                          value={datosEdicion.email}
                          onChange={handleChangeEdicion}
                          className="input-buscador"
                          style={{ padding: "6px 10px", width: "90%" }}
                        />
                      </td>
                      <td>
                        <select
                          name="rol"
                          value={datosEdicion.rol}
                          onChange={handleChangeEdicion}
                          className="input-buscador"
                          disabled={especialista.uid === miUid}
                          title={especialista.uid === miUid ? "No puedes cambiar tu propio rol" : ""}
                          style={{ padding: "6px 10px" }}>
                          <option value="teacher">Especialista</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`badge-estado ${especialista.activo ? "activo" : "inactivo"}`}>
                          {especialista.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button
                          className="btn-accion btn-editar"
                          onClick={() => guardarEdicion(especialista.uid)}
                          title="Guardar Cambios">
                          💾
                        </button>
                        <button
                          className="btn-accion btn-eliminar"
                          onClick={cancelarEdicion}
                          title="Cancelar">
                          ❌
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="fw-bold">{especialista.nombre}</td>
                      <td>{especialista.email}</td>
                      <td>
                        <span className="badge-rol">
                          {obtenerNombreRol(especialista.rol)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge-estado ${especialista.activo ? "activo" : "inactivo"}`}>
                          {especialista.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button
                          className="btn-accion btn-editar"
                          onClick={() => iniciarEdicion(especialista)}
                          title="Editar">
                          ✏️
                        </button>

                      {especialista.activo ? (
                        <button
                          className="btn-accion btn-desactivar"
                          onClick={() => handleDesactivar(especialista.uid)}
                          disabled={especialista.uid === miUid}
                          title={especialista.uid === miUid ? "No puedes desactivar tu propia cuenta" : "Desactivar"}>
                          🚫
                        </button>
                        ) : (
                        <button
                          className="btn-accion btn-activar"
                          onClick={() => handleActivar(especialista.uid)}
                          disabled={especialista.uid === miUid}
                          title={especialista.uid === miUid ? "No puedes activar tu propia cuenta" : "Activar"}>
                          ✅
                        </button>
                        )}
                        <button
                          className="btn-accion btn-eliminar"
                          onClick={() => handleEliminar(especialista.uid)}
                          disabled={especialista.uid === miUid} 
                          title={especialista.uid === miUid ? "No puedes eliminar tu propia cuenta" : "Eliminar"}>
                          🗑️
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="tabla-vacia">
                  {busqueda
                    ? "No se encontraron resultados."
                    : "No hay especialistas registrados aún."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}