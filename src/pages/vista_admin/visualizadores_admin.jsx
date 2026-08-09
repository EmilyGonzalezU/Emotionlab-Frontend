import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./visualizadores_admin.css";

export default function ListaVisualizadores() {
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  const [visualizadores, setVisualizadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: "",
    email: "",
    rol: "",
  });
  const [cargandoLista, setCargandoLista] = useState(true);

  const obtenerVisualizadores = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setCargandoLista(true);
      const token = localStorage.getItem("token");
      const respuesta = await fetch("http://localhost:5000/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`);
      const dataReales = await respuesta.json();
      setVisualizadores(dataReales || []);
    } catch (error) {
      console.error("Error con el backend:", error);
      toast.error("No se pudo cargar la lista de usuarios.");
    } finally {
      setCargandoLista(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerVisualizadores();
  }, [obtenerVisualizadores]);

  const visualizadoresFiltrados = visualizadores.filter((visor) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      (visor.nombre || "").toLowerCase().includes(textoBuscado) ||
      (visor.email || "").toLowerCase().includes(textoBuscado)
    );
  });

  const iniciarEdicion = (visor) => {
    setEditandoId(visor.uid);
    setDatosEdicion({
      nombre: visor.nombre || "",
      email: visor.email || "",
      rol: visor.rol || "",
    });
  };

  const handleChangeEdicion = (e) => {
    setDatosEdicion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const guardarEdicion = async (uid) => {
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(`http://localhost:5000/users/${uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosEdicion),
      });
      if (!respuesta.ok) {
        let msg = "Error al actualizar";
        try {
          const err = await respuesta.json();
          if (err && err.error) msg = err.error;
        } catch (_) { /* noop */ }
        throw new Error(msg);
      }
      setVisualizadores((prev) =>
        prev.map((visor) =>
          visor.uid === uid
            ? {
                ...visor,
                nombre: datosEdicion.nombre ?? visor.nombre,
                email: datosEdicion.email ?? visor.email,
                rol: datosEdicion.rol ?? visor.rol,
              }
            : visor,
        ),
      );
      setEditandoId(null);
      toast.success("¡Usuario actualizado correctamente!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Hubo un problema al guardar los cambios.");
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const handleDesactivar = async (uid) => {
    const ok = window.confirm("¿Desea desactivar este usuario?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        `http://localhost:5000/users/${uid}/disable`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!respuesta.ok) throw new Error("Error al desactivar");
      setVisualizadores((prev) =>
        prev.map((v) => (v.uid === uid ? { ...v, activo: false } : v)),
      );
      toast.success("¡Usuario desactivado con éxito!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("No fue posible desactivar el usuario.");
    }
  };

  const handleActivar = async (uid) => {
    const ok = window.confirm("¿Desea activar este usuario?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        `http://localhost:5000/users/${uid}/enable`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!respuesta.ok) {
        throw new Error("Error al activar");
      }
      setVisualizadores((prev) =>
        prev.map((v) => (v.uid === uid ? { ...v, activo: true } : v)),
      );
      toast.success("Usuario activado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No fue posible activar el usuario.");
    }
  };

  const handleEliminar = async (uid) => {
    const ok = window.confirm("¡ALERTA! ¿Eliminar a este usuario para siempre?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(`http://localhost:5000/users/${uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!respuesta.ok) throw new Error("Error al eliminar");
      setVisualizadores((prev) => prev.filter((visor) => visor.uid !== uid));
      toast.success("Usuario eliminado correctamente.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("No fue posible eliminar el usuario.");
    }
  };

  return (
    <div className="contenedor-tabla-admin">
      <div className="cabecera-tabla">
        <h2>Gestión de Usuarios</h2>
        <button
          className="btn-crear"
          onClick={() => navigate("/admin/crear-visualizador")}>
          + Crear Usuario
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
            {cargandoLista ? (
              <tr>
                <td colSpan="5" className="tabla-vacia">
                  Cargando usuarios...
                </td>
              </tr>
            ) : visualizadoresFiltrados.length > 0 ? (
              visualizadoresFiltrados.map((visor, index) => (
                <tr key={visor.uid || index}>
                  {editandoId === visor.uid ? (
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
                          style={{ padding: "6px 10px" }}>
                          <option value="teacher">Visualizador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`badge-estado ${
                            visor.activo === true ? "activo" : "inactivo"
                          }`}>
                          {visor.activo === true ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button
                          className="btn-accion btn-editar"
                          onClick={() => guardarEdicion(visor.uid)}
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
                      <td className="fw-bold">{visor.nombre}</td>
                      <td>{visor.email}</td>
                      <td>
                        <span className="badge-rol">{visor.rol}</span>
                      </td>
                      <td>
                        <span
                          className={`badge-estado ${
                            visor.activo === true ? "activo" : "inactivo"
                          }`}>
                          {visor.activo === true ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button
                          className="btn-accion btn-editar"
                          onClick={() => iniciarEdicion(visor)}
                          title="Editar">
                          ✏️
                        </button>

                        {visor.activo === true ? (
                          <button
                            className="btn-accion btn-desactivar"
                            onClick={() => handleDesactivar(visor.uid)}
                            title="Desactivar">
                            🚫
                          </button>
                        ) : (
                          <button
                            className="btn-accion btn-activar"
                            onClick={() => handleActivar(visor.uid)}
                            title="Activar">
                            ✅
                          </button>
                        )}

                        <button
                          className="btn-accion btn-eliminar"
                          onClick={() => handleEliminar(visor.uid)}
                          title="Eliminar">
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
                    : "No hay visualizadores registrados aún."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

