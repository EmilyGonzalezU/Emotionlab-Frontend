import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./visualizadores_admin.css";

export default function ListaVisualizadores() {
  const navigate = useNavigate();
  const [visualizadores, setVisualizadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: "",
    email: "",
    rol: "",
  });

  useEffect(() => {
    obtenerVisualizadores();
  }, []);

  const obtenerVisualizadores = async () => {
    try {
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
      setVisualizadores(dataReales);
    } catch (error) {
      console.error("Error con el backend:", error);
    }
  };

  const visualizadoresFiltrados = visualizadores.filter((visor) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      visor.nombre?.toLowerCase().includes(textoBuscado) ||
      visor.email?.toLowerCase().includes(textoBuscado)
    );
  });

  const iniciarEdicion = (visor) => {
    setEditandoId(visor.uid);
    setDatosEdicion({
      nombre: visor.nombre,
      email: visor.email,
      rol: visor.rol,
    });
  };

  const handleChangeEdicion = (e) => {
    setDatosEdicion({ ...datosEdicion, [e.target.name]: e.target.value });
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

      if (!respuesta.ok) throw new Error("Error al actualizar");

      setVisualizadores(
        visualizadores.map((visor) =>
          visor.uid === uid ? { ...visor, ...datosEdicion } : visor,
        ),
      );

      setEditandoId(null);
      toast.success("Usuario actualizado correctamente", { duration: 5000 });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un problema al guardar los cambios", {
        duration: 5000,
      });
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

                  // Actualizar el estado local
                  setVisualizadores(
                    visualizadores.map((visor) =>
                      visor.uid === uid ? { ...visor, activo: false } : visor,
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
      { duration: 6000 },
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
                    `http://localhost:5000/users/${uid}/enable`,
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
                  setVisualizadores(
                    visualizadores.map((visor) =>
                      visor.uid === uid ? { ...visor, activo: true } : visor,
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
      { duration: 6000 },
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
                    `http://localhost:5000/users/${uid}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );
                  if (!respuesta.ok) throw new Error("Error al eliminar");

                  setVisualizadores(
                    visualizadores.filter((visor) => visor.uid !== uid),
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
      { duration: 6000 },
    );
  };

  return (
    <div className="contenedor-tabla-admin">
      <div className="cabecera-tabla">
        <h2>Gestión de Visualizadores</h2>
        <button
          className="btn-crear"
          onClick={() => navigate("/admin/crear-visualizador")}>
          + Crear Visualizador
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
            {visualizadoresFiltrados.length > 0 ? (
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
                          <option value="visualizador">Visualizador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`badge-estado ${visor.activo ? "activo" : "inactivo"}`}>
                          {visor.activo ? "Activo" : "Inactivo"}
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
                          className={`badge-estado ${visor.activo ? "activo" : "inactivo"}`}>
                          {visor.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button
                          className="btn-accion btn-editar"
                          onClick={() => iniciarEdicion(visor)}
                          title="Editar">
                          ✏️
                        </button>

                        {/* Mostrar botón de activar/desactivar según el estado */}
                        {visor.activo ? (
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
