import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './indicadoresSync.css';

export default function IndicadoresSync() {
  //aca empieza a arrancar con 0, para q despues se actualice, datospie es donde se guarda la imfo
  //para crear los graficos
  const [estadoGrafico, setEstadoGrafico] = useState({
    cargando: true,
    totalUsuarios: 0,
    activos: 0,
    inactivos: 0,
    datosPie: []
  });

  //sellama el backend
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        //se obtiene el token del inicio sesion
        const token = localStorage.getItem('token');
        //se conecta al backend
        const respuesta = await fetch('http://localhost:5000/users', {
          method: 'GET', //para listar a los usuarios
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        //si la conexion sale bien transformamos la respuesta en js
        if (respuesta.ok) {
          const listaUsuarios = await respuesta.json();

          //inicializamos con contadores en 0
          let contActivos = 0;
          let contInactivos = 0;
          let contAdmins = 0;
          let contVisualizadores = 0;
          let total = 0;

          //verificamos q haya llegado la lista de manera correcta y con estructura
          if (Array.isArray(listaUsuarios)) {
            total = listaUsuarios.length;
            
            //se analiza usuario x usuario
            listaUsuarios.forEach(usuario => {
              // 1. Contamos Activos vs Inactivos (Para las tarjetas)
              if (usuario.activo === true || usuario.activo === 'true' || usuario.activo === 1) {
                contActivos++;
              } else {
                contInactivos++;
              }

              // Contamos los Roles para el grafico, hace todo minusculas para q no confunda "Admin" con "admin"
              //como si fueran otras personas
              const rol = String(usuario.rol || '').toLowerCase();
              if (rol === 'admin' || rol === 'administrador' || rol === 'role_admin') {
                contAdmins++;
              } else {
                contVisualizadores++;
              }
            });
          }

          // Armamos el gráfico con los ROLES
          const formatoGrafico = [
            { name: 'Director (Admin)', value: contAdmins, color: '#F59E0B' }, // Naranja/Dorado
            { name: 'Visualizadores', value: contVisualizadores, color: '#3B82F6' } // Azul
          ];

          //AHORA guardamos los datos recopilados para q se muestren
          setEstadoGrafico({
            cargando: false,
            totalUsuarios: total,
            activos: contActivos,
            inactivos: contInactivos,
            datosPie: formatoGrafico
          });

          //errores

        } else {
          setEstadoGrafico(prev => ({ ...prev, cargando: false }));
        }
      } catch (error) {
        console.error("Error consultando usuarios:", error);
        setEstadoGrafico(prev => ({ ...prev, cargando: false }));
      }
    };

    obtenerUsuarios();
  }, []);

  return (
    <div className="sync-dashboard">
      
      <div className="dashboard-layout">
        
        {/* PANEL IZQUIERDO: Tarjetas de Resumen Numérico (Activos/Inactivos) */}
        <div className="panel-izquierdo" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="sync-card">
            <div className="card-icono">👥</div>
            <div className="card-info">
              <h3>Total de Usuarios Registrados</h3>
              <p>{estadoGrafico.cargando ? '...' : estadoGrafico.totalUsuarios}</p>
            </div>
          </div>

          <div className="dashboard-layout" style={{ gap: '20px' }}>
            <div className="sync-card" style={{ flex: 1 }}>
              <div className="card-icono" style={{ backgroundColor: '#DCFCE7', color: '#22C55E' }}>✓</div>
              <div className="card-info">
                <h3>Cuentas Activas</h3>
                <p>{estadoGrafico.cargando ? '...' : estadoGrafico.activos}</p>
              </div>
            </div>

            <div className="sync-card" style={{ flex: 1 }}>
              <div className="card-icono" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>✕</div>
              <div className="card-info">
                <h3>Cuentas Inactivas</h3>
                <p>{estadoGrafico.cargando ? '...' : estadoGrafico.inactivos}</p>
              </div>
            </div>
          </div>

        </div>

        {/* PANEL DERECHO: El Gráfico Circular (Roles) */}
        <div className="panel-derecho">
          <div className="logs-container">
            <h3 className="logs-titulo">Distribución de Roles</h3>
            
            <div style={{ height: '280px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              
              {estadoGrafico.cargando ? (
                <p style={{ color: '#64748B' }}>Cargando gráfico...</p>
              ) : estadoGrafico.totalUsuarios === 0 ? (
                <p style={{ color: '#64748B', fontStyle: 'italic' }}>No hay usuarios para mostrar</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadoGrafico.datosPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={65} 
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {estadoGrafico.datosPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}