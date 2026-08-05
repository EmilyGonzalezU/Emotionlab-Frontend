import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visualizadores_admin.css';

export default function ListaVisualizadores() {
  const navigate = useNavigate();
  const [visualizadores, setVisualizadores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null); // Guarda el UID del usuario que estamos editando
  const [datosEdicion, setDatosEdicion] = useState({ nombre: '', email: '', rol: '' });

  useEffect(() => {
    obtenerVisualizadores();
  }, []);

  const obtenerVisualizadores = async () => {
    try {
      const token = localStorage.getItem('token'); 
      // conexion al backend y obtencion de datos
      const respuesta = await fetch('http://localhost:5000/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
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

  // --- FUNCIONES DE EDICIÓN ---
  const iniciarEdicion = (visor) => {
    setEditandoId(visor.uid); // transformacion de filas en inputs, esto para no tener q crear pags aparte para editar o eliminar un usuario
    setDatosEdicion({ nombre: visor.nombre, email: visor.email, rol: visor.rol });
  };

  const handleChangeEdicion = (e) => {
    setDatosEdicion({ ...datosEdicion, [e.target.name]: e.target.value });
  };

  const guardarEdicion = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      // ¡Aquí usamos el PUT que hizo tu compañera!
      const respuesta = await fetch(`http://localhost:5000/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEdicion)
      });

      if (!respuesta.ok) throw new Error("Error al actualizar");

      // Actualizamos la tabla visualmente sin tener que recargar la página
      setVisualizadores(visualizadores.map(visor => 
        visor.uid === uid ? { ...visor, ...datosEdicion } : visor
      ));
      
      setEditandoId(null); // Cerramos el modo edición
      alert("¡Usuario actualizado correctamente!");

    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al guardar los cambios.");
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  // --- FUNCIONES ACTIVAR/ELIMINAR ---
  const handleDesactivar = async (uid) => {
    if (!window.confirm("¿Cambiar el estado de este usuario?")) return;
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/users/${uid}/disable`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error("Error al cambiar estado");
      alert("¡Usuario desactivado con éxito!");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEliminar = async (uid) => {
    if (!window.confirm("¡ALERTA! ¿Eliminar a este usuario para siempre?")) return;
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/users/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error("Error al eliminar");
      
      setVisualizadores(visualizadores.filter(visor => visor.uid !== uid));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="contenedor-tabla-admin">
      <div className="cabecera-tabla">
        <h2>Gestión de Visualizadores</h2>
        <button className="btn-crear" onClick={() => navigate('/admin/crear-visualizador')}>
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
                  
                  {/* LA MAGIA SUCEDE AQUÍ: ¿Estamos editando esta fila? */}
                  {editandoId === visor.uid ? (
                    <>
                      {/* MODO EDICIÓN */}
                      <td>
                        <input name="nombre" value={datosEdicion.nombre} onChange={handleChangeEdicion} className="input-buscador" style={{ padding: '6px 10px', width: '90%' }} />
                      </td>
                      <td>
                        <input name="email" value={datosEdicion.email} onChange={handleChangeEdicion} className="input-buscador" style={{ padding: '6px 10px', width: '90%' }} />
                      </td>
                      <td>
                        <select name="rol" value={datosEdicion.rol} onChange={handleChangeEdicion} className="input-buscador" style={{ padding: '6px 10px' }}>
                          <option value="visualizador">Visualizador</option>
                          <option value="admin">Administrador</option>
                          <option value="profesor">Profesor</option>
                        </select>
                      </td>
                      <td><span className="badge-estado activo">Activo</span></td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-editar" onClick={() => guardarEdicion(visor.uid)} title="Guardar Cambios">💾</button>
                        <button className="btn-accion btn-eliminar" onClick={cancelarEdicion} title="Cancelar">❌</button>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* MODO LECTURA NORMAL */}
                      <td className="fw-bold">{visor.nombre}</td>
                      <td>{visor.email}</td>
                      <td><span className="badge-rol">{visor.rol}</span></td>
                      <td><span className="badge-estado activo">Activo</span></td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-editar" onClick={() => iniciarEdicion(visor)} title="Editar">✏️</button>
                        <button className="btn-accion btn-desactivar" onClick={() => handleDesactivar(visor.uid)} title="Desactivar">🚫</button>
                        <button className="btn-accion btn-eliminar" onClick={() => handleEliminar(visor.uid)} title="Eliminar">🗑️</button>
                      </td>
                    </>
                  )}

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="tabla-vacia">
                  {busqueda ? 'No se encontraron resultados.' : 'No hay visualizadores registrados aún.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}