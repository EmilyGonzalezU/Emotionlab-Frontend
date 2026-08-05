import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visualizadores_admin.css';

export default function ListaVisualizadores() {
  const navigate = useNavigate();
  const [visualizadores, setVisualizadores] = useState([]);
  
  //  buscador
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const obtenerVisualizadores = async () => {
      try {
        const token = localStorage.getItem('token'); 
        // se obtienen los datos del backend, en este caso de user_routes.py
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

    obtenerVisualizadores();
  }, []);

  //  filtramos segun lo q el admin escriba
  const visualizadoresFiltrados = visualizadores.filter((visor) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      visor.nombre?.toLowerCase().includes(textoBuscado) || 
      visor.email?.toLowerCase().includes(textoBuscado)
    );
  });

  // funciones vacias para los botones (por ahora)
  const handleEditar = (uid) => {
    console.log("Editar usuario con ID:", uid);
    // navigate(`/admin/editar-visualizador/${uid}`);
  };

  const handleDesactivar = (uid) => {
    console.log("Desactivar/Activar usuario con ID:", uid);
    // Aquí iría el fetch tipo PATCH
  };

  const handleEliminar = (uid) => {
    console.log("Eliminar usuario con ID:", uid);
    // Aquí iría el fetch tipo DELETE
  };

  return (
    <div className="contenedor-tabla-admin">
      
      <div className="cabecera-tabla">
        <h2>Gestión de Visualizadores</h2>
        <button 
          className="btn-crear" 
          onClick={() => navigate('/admin/crear-visualizador')}
        >
          + Crear Visualizador
        </button>
      </div>

      {/* Nueva barra de búsqueda */}
      <div className="contenedor-buscador">
        <input 
          type="text" 
          className="input-buscador" 
          placeholder="Buscar por nombre o correo..." 
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
                <tr key={index}>
                  <td className="fw-bold">{visor.nombre}</td>
                  <td>{visor.email}</td>
                  <td><span className="badge-rol">{visor.rol}</span></td>
                  <td><span className="badge-estado activo">Activo</span></td>
                  
                  {/* Nueva columna de acciones */}
                  <td className="celda-acciones">
                    <button className="btn-accion btn-editar" onClick={() => handleEditar(visor.uid || visor.email)} title="Editar">
                      ✏️
                    </button>
                    <button className="btn-accion btn-desactivar" onClick={() => handleDesactivar(visor.uid || visor.email)} title="Desactivar">
                      🚫
                    </button>
                    <button className="btn-accion btn-eliminar" onClick={() => handleEliminar(visor.uid || visor.email)} title="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="tabla-vacia">
                  {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'No hay visualizadores registrados aún.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}