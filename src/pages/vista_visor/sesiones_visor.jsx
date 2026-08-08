import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './sesiones_visor.css';

const SesionesVisor = () => {
  const [sesionesOriginales, setSesionesOriginales] = useState([]);
  const [sesionesFiltradas, setSesionesFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Estados de Filtros
  const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false);
  const [submenúAbierto, setSubmenúAbierto] = useState(null);
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estado para la ventana de búsqueda por ID (Modal)
  const [modalBusquedaAbierta, setModalBusquedaAbierta] = useState(false);
  const [busquedaId, setBusquedaId] = useState('');

  // Estados de Paginación (Configurado a 8 sesiones por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const sesionesPorPagina = 8;

  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const opcionesGenero = ['Femenino', 'Masculino', 'Prefiero no decir'];

  const [searchParams] = useSearchParams();
  const fechaFiltroUrl = searchParams.get('fecha');

  useEffect(() => {
    const obtenerSesiones = async () => {
      try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch('http://localhost:5000/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!respuesta.ok) {
          throw new Error('Error al obtener las sesiones');
        }

        const data = await respuesta.json();

        let listaProcesada = data.map((item, index) => {
          const fechaRaw = item.updated_at || item.created_at || item.fecha;
          const objetoFecha = fechaRaw ? new Date(fechaRaw) : null;

          const fechaTexto = objetoFecha 
            ? objetoFecha.toLocaleDateString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) 
            : 'Sin fecha';

          const horaTexto = objetoFecha 
            ? objetoFecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) 
            : '';

          const cursoRaw = item.curso || item.course || 'Curso no asignado';

          return {
            id: item.id || item.session_id || `SES-${index + 1}`,
            fechaRaw: objetoFecha,
            fechaFormateada: `${fechaTexto} ${horaTexto}`.trim(),
            fechaComparar: fechaTexto.replaceAll('/', '-'),
            curso: cursoRaw,
            cursoNormalizado: cursoRaw.toLowerCase().trim(),
            genero: item.genero || item.gender || item.participante_genero || ''
          };
        });

        listaProcesada.sort((a, b) => (b.fechaRaw || 0) - (a.fechaRaw || 0));

        if (fechaFiltroUrl) {
          listaProcesada = listaProcesada.filter(
            (s) => s.fechaComparar === fechaFiltroUrl
          );
        }

        const cursosUnicos = [];
        const cursosVistos = new Set();

        listaProcesada.forEach((s) => {
          const clave = s.cursoNormalizado;
          if (!cursosVistos.has(clave) && clave !== 'curso no asignado') {
            cursosVistos.add(clave);
            cursosUnicos.push(s.curso);
          }
        });

        setCursosDisponibles(cursosUnicos);
        setSesionesOriginales(listaProcesada);
        setSesionesFiltradas(listaProcesada);
      } catch (err) {
        console.error("Error en el fetch:", err);
        setError("No se pudieron obtener las sesiones.");
      } finally {
        setCargando(false);
      }
    };

    obtenerSesiones();
  }, [fechaFiltroUrl]);

  // Aplicar filtros + Búsqueda por ID
  useEffect(() => {
    let resultado = [...sesionesOriginales];

    if (busquedaId.trim()) {
      resultado = resultado.filter((s) =>
        s.id.toLowerCase().includes(busquedaId.toLowerCase().trim())
      );
    }

    if (filtroGenero) {
      resultado = resultado.filter(
        (s) => s.genero.toLowerCase().trim() === filtroGenero.toLowerCase().trim()
      );
    }

    if (filtroCurso) {
      resultado = resultado.filter(
        (s) => s.cursoNormalizado === filtroCurso.toLowerCase().trim()
      );
    }

    if (fechaDesde) {
      const desdeDate = new Date(`${fechaDesde}T00:00:00`);
      resultado = resultado.filter(
        (s) => s.fechaRaw && s.fechaRaw >= desdeDate
      );
    }

    if (fechaHasta) {
      const hastaDate = new Date(`${fechaHasta}T23:59:59`);
      resultado = resultado.filter(
        (s) => s.fechaRaw && s.fechaRaw <= hastaDate
      );
    }

    setSesionesFiltradas(resultado);
    setPaginaActual(1);
  }, [busquedaId, filtroGenero, filtroCurso, fechaDesde, fechaHasta, sesionesOriginales]);

  const limpiarFiltros = () => {
    setFiltroGenero('');
    setFiltroCurso('');
    setFechaDesde('');
    setFechaHasta('');
    setSubmenúAbierto(null);
    setMenuFiltrosAbierto(false);
  };

  const totalPaginas = Math.ceil(sesionesFiltradas.length / sesionesPorPagina);
  const indiceUltimaSesion = paginaActual * sesionesPorPagina;
  const indicePrimeraSesion = indiceUltimaSesion - sesionesPorPagina;
  const sesionesPaginadas = sesionesFiltradas.slice(indicePrimeraSesion, indiceUltimaSesion);

  const hayFiltrosActivos = filtroGenero || filtroCurso || fechaDesde || fechaHasta;

  return (
    <div className="layout-pagina-visor">
      {/* Componente Sidebar Fijo */}
      <Sidebar />

      {/* Área del Contenido Principal */}
      <div className="main-content">
        <header className="sesiones-header">
          <h2>
            {fechaFiltroUrl 
              ? `Sesiones del día: ${fechaFiltroUrl.replaceAll('-', '/')}` 
              : 'Todas las fechas de las sesiones'}
          </h2>

          {/* Acciones de Filtro y Búsqueda */}
          <div className="acciones-header">
            {/* Botón Lupita para buscar por ID */}
            <button 
              className={`btn-lupa ${busquedaId ? 'activo' : ''}`}
              onClick={() => setModalBusquedaAbierta(true)}
              title="Buscar por ID"
            >
              🔍
            </button>

            {/* Menú de Filtros */}
            <div className="filtros-wrapper">
              <button 
                className={`btn-filtros ${menuFiltrosAbierto ? 'activo' : ''}`}
                onClick={() => {
                  setMenuFiltrosAbierto(!menuFiltrosAbierto);
                  setSubmenúAbierto(null);
                }}
              >
                Filtros {hayFiltrosActivos && '•'}
              </button>

              {menuFiltrosAbierto && (
                <div className="dropdown-filtros">
                  <div className="dropdown-menu-principal">
                    <div 
                      className={`dropdown-item ${submenúAbierto === 'fecha' ? 'seleccionado' : ''}`}
                      onClick={() => setSubmenúAbierto(submenúAbierto === 'fecha' ? null : 'fecha')}
                    >
                      <span>Por Fecha {(fechaDesde || fechaHasta) && '✓'}</span>
                      <span>▸</span>
                    </div>

                    <div 
                      className={`dropdown-item ${submenúAbierto === 'genero' ? 'seleccionado' : ''}`}
                      onClick={() => setSubmenúAbierto(submenúAbierto === 'genero' ? null : 'genero')}
                    >
                      <span>Por Género {filtroGenero && `(${filtroGenero})`}</span>
                      <span>▸</span>
                    </div>

                    <div 
                      className={`dropdown-item ${submenúAbierto === 'curso' ? 'seleccionado' : ''}`}
                      onClick={() => setSubmenúAbierto(submenúAbierto === 'curso' ? null : 'curso')}
                    >
                      <span>Por Curso {filtroCurso && `(${filtroCurso})`}</span>
                      <span>▸</span>
                    </div>

                    {hayFiltrosActivos && (
                      <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
                        Limpiar Filtros
                      </button>
                    )}
                  </div>

                  {submenúAbierto === 'fecha' && (
                    <div className="dropdown-submenu dropdown-submenu-fecha">
                      <div className="submenu-header">Rango de Fechas</div>
                      <div className="filtro-fecha-container">
                        <label>Desde:</label>
                        <input 
                          type="date" 
                          value={fechaDesde} 
                          onChange={(e) => setFechaDesde(e.target.value)}
                          className="input-fecha"
                        />
                      </div>
                      <div className="filtro-fecha-container">
                        <label>Hasta:</label>
                        <input 
                          type="date" 
                          value={fechaHasta} 
                          onChange={(e) => setFechaHasta(e.target.value)}
                          className="input-fecha"
                        />
                      </div>
                    </div>
                  )}

                  {submenúAbierto === 'genero' && (
                    <div className="dropdown-submenu">
                      <div className="submenu-header">Seleccionar Género</div>
                      {opcionesGenero.map((genero) => (
                        <div 
                          key={genero} 
                          className={`submenu-item ${filtroGenero === genero ? 'activo' : ''}`}
                          onClick={() => {
                            setFiltroGenero(filtroGenero === genero ? '' : genero);
                          }}
                        >
                          {genero}
                        </div>
                      ))}
                    </div>
                  )}

                  {submenúAbierto === 'curso' && (
                    <div className="dropdown-submenu">
                      <div className="submenu-header">Seleccionar Curso</div>
                      {cursosDisponibles.length === 0 ? (
                        <div className="submenu-item" style={{ color: '#999', cursor: 'default' }}>
                          Sin cursos registrados
                        </div>
                      ) : (
                        cursosDisponibles.map((curso) => (
                          <div 
                            key={curso} 
                            className={`submenu-item ${filtroCurso === curso ? 'activo' : ''}`}
                            onClick={() => {
                              setFiltroCurso(filtroCurso === curso ? '' : curso);
                            }}
                          >
                            {curso}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* VENTANA MODAL PARA BÚSQUEDA POR ID */}
        {modalBusquedaAbierta && (
          <div className="modal-overlay" onClick={() => setModalBusquedaAbierta(false)}>
            <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Buscar Sesión por ID</h3>
                <button className="btn-cerrar-modal" onClick={() => setModalBusquedaAbierta(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <input 
                  type="text" 
                  placeholder="Ejemplo: session_c691347f..." 
                  value={busquedaId}
                  onChange={(e) => setBusquedaId(e.target.value)}
                  className="input-busqueda-id"
                  autoFocus
                />
                {busquedaId && (
                  <button className="btn-limpiar-busqueda" onClick={() => setBusquedaId('')}>
                    Borrar búsqueda
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <section className="sesiones-container">
          <div className="sesiones-list">
            {cargando ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                Cargando sesiones...
              </p>
            ) : error ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#EF4444' }}>
                {error}
              </p>
            ) : sesionesPaginadas.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                No hay sesiones registradas que coincidan con la búsqueda.
              </p>
            ) : (
              sesionesPaginadas.map((sesion) => (
                <div 
                  key={sesion.id} 
                  className="sesion-card"
                  onClick={() => navigate(`/teacher/sesiones/${sesion.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sesion-col sesion-col-id">{sesion.id}</span>
                  <span className="sesion-col">{sesion.fechaFormateada}</span>
                  <span className="sesion-col">{sesion.curso}</span>
                  <span className="sesion-col sesion-col-genero">
                    {sesion.genero || '—'}
                  </span>
                </div>
              ))
            )}
          </div>

          {!cargando && totalPaginas > 1 && (
            <div className="paginacion-container">
              <button 
                className="btn-paginacion" 
                onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
              <span className="info-paginacion">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button 
                className="btn-paginacion" 
                onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SesionesVisor;