import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visualizadores_admin.css';

export default function ListaVisualizadores() {
  const navigate = useNavigate();
  const [visualizadores, setVisualizadores] = useState([]); //guarda los usuarios 
  const [busqueda, setBusqueda] = useState(''); //barra d busqueda
  const [editandoId, setEditandoId] = useState(null); // guarda el id del usuario que estamos editando
  const [datosEdicion, setDatosEdicion] = useState({ nombre: '', email: '', rol: '' }); //temporal para inputs

  //carga la vista al abrir la vista
  useEffect(() => {
    obtenerVisualizadores();
  }, []);

  const obtenerVisualizadores = async () => {
    try {
        //token del login
      const token = localStorage.getItem('token'); 
      // conexion al backend y obtencion de datos
      const respuesta = await fetch('http://localhost:5000/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      //si tdo va bien
      if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`);
      const dataReales = await respuesta.json();
      setVisualizadores(dataReales); //guardamos los usuarios
    } catch (error) {
    //si error
      console.error("Error con el backend:", error);
    }
  };

  //revisa usuario x usuario para ver que lo q se escriba en "buscar" se muestre
  const visualizadoresFiltrados = visualizadores.filter((visor) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      visor.nombre?.toLowerCase().includes(textoBuscado) || 
      visor.email?.toLowerCase().includes(textoBuscado)
    );
  });

  // activa el modo edicion por inputs para no tener q crear otra vista para edicion
  const iniciarEdicion = (visor) => {
    setEditandoId(visor.uid); // transformacion de filas en inputs, esto para no tener q crear pags aparte para editar o eliminar un usuario
    setDatosEdicion({ nombre: visor.nombre, email: visor.email, rol: visor.rol });
  };

  //captura lo q se escribe en los inputs
  const handleChangeEdicion = (e) => {
    setDatosEdicion({ ...datosEdicion, [e.target.name]: e.target.value });
  };

  //manda los cambios al backend
  const guardarEdicion = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      // se usa el put del admin
      const respuesta = await fetch(`http://localhost:5000/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEdicion)
      });

      if (!respuesta.ok) throw new Error("Error al actualizar");

      // actualizamos la tabla visualmente sin tener que recargar la página
      setVisualizadores(visualizadores.map(visor => 
        visor.uid === uid ? { ...visor, ...datosEdicion } : visor
      ));
      
      setEditandoId(null); // cerramos el modo edición
      alert("¡Usuario actualizado correctamente!");

    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al guardar los cambios.");
    }
  };


  //se deja como estaba si se cancela
  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  // activar/eliminar
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

  //todo el diseño

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