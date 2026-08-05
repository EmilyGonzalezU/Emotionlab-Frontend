import React, { useState, useEffect } from 'react';
import './cuenta_admin.css';

export default function CuentaAdmin() {
//guardamos el correo y nombre del admin para q se visualice, el "cargando" es netamente para que se vea estético, se queda hasta que se traen los datos del backend
  const [datosUser, setDatosUser] = useState({ nombre: 'Cargando...', email: 'Cargando...' });
  //este es para las contraseñas ehh la nueva, la actual y para confirmar contraseña
  const [claves, setClaves] = useState({ actual: '', nueva: '', confirmar: '' });
  //los mensajes que se mostraran
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); 
  //el cargando es para q el usuario no mande la solicitud 2 veces
  const [cargando, setCargando] = useState(false);

  //el useEffect para q se muestre solo una vez
  useEffect(() => {
    const obtenerMisDatos = async () => {
      try {
        //obtenemos el token q se creo cuando el usuario inicia sesion
        const token = localStorage.getItem('token');
        //se conecta con el backend
        const respuesta = await fetch('http://localhost:5000/users/me', {
          method: 'GET', //solo leemos info
          headers: { 'Authorization': `Bearer ${token}` }
        });

        //si fue exitoso se actualizan los datos, osea se obtiene el nombre y el correo y se muestran
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setDatosUser({ nombre: datos.nombre || 'Sin nombre', email: datos.email || 'Sin correo' });
        }
      } catch (error) {
        console.error("Error al obtener los datos de la cuenta", error);
      }
    };
    //se llama la funcion
    obtenerMisDatos();
  }, []);

  //esto hace q se guarden los cambios en lo de las claves
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClaves(prev => ({ ...prev, [name]: value }));
  };

  // cambiar contraseña
  const cambiarContrasena = async (e) => {
    e.preventDefault(); 

    //si algo esta vacio pide q llenen campos
    if (!claves.actual || !claves.nueva || !claves.confirmar) {
      setMensaje({ texto: 'Por favor, llena todos los campos.', tipo: 'error' });
      return;
    }
    //si no es igual la clave nueva a la de confirmacion tira un anuncio d error
    if (claves.nueva !== claves.confirmar) {
      setMensaje({ texto: 'Las contraseñas nuevas no coinciden.', tipo: 'error' });
      return;
    }

    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
        //se obtiene el token q hace el cambio y se usa patch pq se esta editando
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/users/me/password', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: claves.actual,
          new_password: claves.nueva
        })
      });

      //se lee la respuesta
      const data = await respuesta.json();

      if (respuesta.ok) {
        //si fue exitoso muestra un anuncio
        setMensaje({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
        setClaves({ actual: '', nueva: '', confirmar: '' });
      } else {
        //si fue fallido por equivocacion de contraseña actual muestra un error 
        setMensaje({ texto: data.error || 'Hubo un error al cambiar la contraseña.', tipo: 'error' });
      }
    } catch (error) {
        //si no se conecta con el backend u ptra cosa tira otro error diferente
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
        //pase lo q pase se libera el boton
      setCargando(false);
    }
  };

  //todo el diseño

  return (
    <div className="sync-dashboard">
      <h2 className="sync-titulo">Mi Cuenta</h2>

      <div className="dashboard-layout">
        
        {/* PANEL IZQUIERDO: Datos del Usuario */}
        <div className="panel-izquierdo">
          <div className="logs-container">
            <h3 className="logs-titulo">Información Personal</h3>
            
            <div className="info-cuenta-lista">
              <div className="info-grupo">
                <p className="info-etiqueta">Nombre Completo</p>
                <p className="info-valor">{datosUser.nombre}</p>
              </div>

              <div className="info-grupo">
                <p className="info-etiqueta">Correo Electrónico</p>
                <p className="info-valor">{datosUser.email}</p>
              </div>

              <div className="info-grupo sin-borde">
                <p className="info-etiqueta" style={{ marginBottom: '10px' }}>Rol en el Sistema</p>
                <span className="badge-estado listo badge-rol">Administrador</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Cambiar Contraseña */}
        <div className="panel-derecho">
          <div className="logs-container">
            <h3 className="logs-titulo">Seguridad</h3>
            <p className="seguridad-desc">Actualiza tu contraseña de acceso aquí.</p>

            <form onSubmit={cambiarContrasena} className="form-cuenta">
              
              <div className="form-grupo">
                <label className="form-label">Contraseña Actual</label>
                <input 
                  type="password" 
                  name="actual"
                  value={claves.actual}
                  onChange={manejarCambio}
                  placeholder="Ingresa tu contraseña actual"
                  className="form-input"
                />
              </div>

              <div className="form-grupo">
                <label className="form-label">Nueva Contraseña</label>
                <input 
                  type="password" 
                  name="nueva"
                  value={claves.nueva}
                  onChange={manejarCambio}
                  placeholder="Crea una nueva contraseña"
                  className="form-input"
                />
              </div>

              <div className="form-grupo">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  name="confirmar"
                  value={claves.confirmar}
                  onChange={manejarCambio}
                  placeholder="Repite la nueva contraseña"
                  className="form-input"
                />
              </div>

              {mensaje.texto && (
                <div className={`mensaje-alerta ${mensaje.tipo}`}>
                  {mensaje.texto}
                </div>
              )}

              <button 
                type="submit" 
                disabled={cargando}
                className={`btn-guardar ${cargando ? 'cargando' : ''}`}
              >
                {cargando ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}