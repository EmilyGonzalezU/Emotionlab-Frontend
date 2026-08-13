import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./sesiones_visor.css";
import { getApiUrl } from "../../config/api.js";

const procesarSesionRaw = (item, index) => {
  const fechaRaw = item.created_at || item.fecha_inicio || item.fecha || item.updated_at;
  const objetoFecha = fechaRaw ? new Date(fechaRaw) : null;

  const fechaTexto = objetoFecha
    ? objetoFecha.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Sin fecha";

  const horaTexto = objetoFecha
    ? objetoFecha.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const cursoRaw = item.curso || item.course || "Curso no asignado";
  const fechaISO = objetoFecha ? objetoFecha.toISOString().split("T")[0] : "";

  return {
    id: item.id || item.session_id || `SES-${index + 1}`,
    _raw: item,
    fechaRaw: objetoFecha,
    fechaFormateada: `${fechaTexto} ${horaTexto}`.trim(),
    fechaComparar: fechaTexto.replaceAll("/", "-"),
    fechaISO: fechaISO,
    curso: cursoRaw,
    cursoNormalizado: cursoRaw.toLowerCase().trim(),
    genero: item.genero || item.gender || item.participante_genero || "",
  };
};

const SesionesVisor = () => {
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  const [sesionesOriginales, setSesionesOriginales] = useState([]);
  const [sesionesFiltradas, setSesionesFiltradas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [importando, setImportando] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState("");
  const [tipoMensajeImportacion, setTipoMensajeImportacion] = useState("");

  const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false);
  const [submenúAbierto, setSubmenúAbierto] = useState(null);

  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [modalBusquedaAbierta, setModalBusquedaAbierta] = useState(false);
  const [busquedaId, setBusquedaId] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);

  const sesionesPorPagina = 8;

  const [cursosDisponibles, setCursosDisponibles] = useState([]);

  const opcionesGenero = ["Femenino", "Masculino", "Prefiero no decir"];

  const [searchParams] = useSearchParams();
  const fechaFiltroUrl = searchParams.get("fecha");

  const actualizarCursosYFiltros = useCallback((lista) => {
    const cursosUnicos = [];
    const cursosVistos = new Set();
    lista.forEach((s) => {
      const clave = s.cursoNormalizado;
      if (!cursosVistos.has(clave) && clave !== "curso no asignado") {
        cursosVistos.add(clave);
        cursosUnicos.push(s.curso);
      }
    });
    setCursosDisponibles(cursosUnicos);
    setSesionesFiltradas(lista);
  }, []);

  const obtenerSesiones = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      const respuesta = await fetch(getApiUrl("/sessions"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error("Error al obtener las sesiones");
      }

      const data = await respuesta.json();
      let listaProcesada = data.map((item, index) => procesarSesionRaw(item, index));
      listaProcesada.sort((a, b) => (b.fechaRaw || 0) - (a.fechaRaw || 0));

      if (fechaFiltroUrl) {
        const fTarget = fechaFiltroUrl.replaceAll("/", "-").trim();
        listaProcesada = listaProcesada.filter((s) => {
          const fComp = (s.fechaComparar || "").replaceAll("/", "-").trim();
          const fISO = s.fechaISO;
          return fComp === fTarget || fISO === fTarget;
        });
      }

      setSesionesOriginales(listaProcesada);
      actualizarCursosYFiltros(listaProcesada);
    } catch (err) {
      console.error("Error en el fetch:", err);
      setError("No se pudieron obtener las sesiones.");
    } finally {
      setCargando(false);
      fetchingRef.current = false;
    }
  }, [fechaFiltroUrl, actualizarCursosYFiltros]);

  const importarSesiones = async () => {
    if (importando) return;
    try {
      setImportando(true);
      setMensajeImportacion("");
      setTipoMensajeImportacion("");
      setError(null);

      const token = localStorage.getItem("token");

      const respuesta = await fetch(getApiUrl("/sessions/import"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data = {};
      try {
        data = await respuesta.json();
      } catch {
        data = {};
      }

      if (!respuesta.ok) {
        throw new Error(data.error || "No se pudieron importar las sesiones.");
      }

      const cantidadNuevas =
        data.nuevas ??
        data.imported ??
        data.importadas ??
        data.pending_identification?.length ??
        data.created ??
        0;

      const cantSkip =
        data.omitidas_existentes ??
        data.skipped_existing?.length ??
        data.skipped ??
        0;

      if (cantidadNuevas > 0) {
        setMensajeImportacion(
          `Se importaron ${cantidadNuevas} sesiones nuevas.`,
        );
        setTipoMensajeImportacion("exito");
        toast.success(`¡${cantidadNuevas} sesiones nuevas importadas!`);
      } else {
        setMensajeImportacion(
          cantSkip > 0
            ? `No hay sesiones nuevas (${cantSkip} ya existentes).`
            : "No hay sesiones nuevas para importar.",
        );
        setTipoMensajeImportacion("info");
      }

      await obtenerSesiones();
    } catch (error) {
      console.error("Error importando sesiones:", error);
      setMensajeImportacion(error.message || "Error al importar las sesiones.");
      setTipoMensajeImportacion("error");
      toast.error(error.message || "Error al importar las sesiones.");
    } finally {
      setImportando(false);
    }
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerSesiones();
  }, [obtenerSesiones]);

  // ============================================================
  // APLICAR FILTROS + BÚSQUEDA
  // ============================================================

  useEffect(() => {
    let resultado = [...sesionesOriginales];

    // ==========================================================
    // BÚSQUEDA POR ID
    // ==========================================================

    if (busquedaId.trim()) {
      resultado = resultado.filter((s) =>
        s.id.toLowerCase().includes(busquedaId.toLowerCase().trim()),
      );
    }

    // ==========================================================
    // FILTRO GÉNERO
    // ==========================================================

    if (filtroGenero) {
      resultado = resultado.filter(
        (s) =>
          s.genero.toLowerCase().trim() === filtroGenero.toLowerCase().trim(),
      );
    }

    // ==========================================================
    // FILTRO CURSO
    // ==========================================================

    if (filtroCurso) {
      resultado = resultado.filter(
        (s) => s.cursoNormalizado === filtroCurso.toLowerCase().trim(),
      );
    }

    // ==========================================================
    // FECHA DESDE
    // ==========================================================

    if (fechaDesde) {
      const desdeDate = new Date(`${fechaDesde}T00:00:00`);

      resultado = resultado.filter(
        (s) => s.fechaRaw && s.fechaRaw >= desdeDate,
      );
    }

    // ==========================================================
    // FECHA HASTA
    // ==========================================================

    if (fechaHasta) {
      const hastaDate = new Date(`${fechaHasta}T23:59:59`);

      resultado = resultado.filter(
        (s) => s.fechaRaw && s.fechaRaw <= hastaDate,
      );
    }

    // ==========================================================
    // ACTUALIZAR
    // ==========================================================

    setSesionesFiltradas(resultado);

    setPaginaActual(1);
  }, [
    busquedaId,
    filtroGenero,
    filtroCurso,
    fechaDesde,
    fechaHasta,
    sesionesOriginales,
  ]);

  // ============================================================
  // LIMPIAR FILTROS
  // ============================================================

  const limpiarFiltros = () => {
    setFiltroGenero("");

    setFiltroCurso("");

    setFechaDesde("");

    setFechaHasta("");

    setSubmenúAbierto(null);

    setMenuFiltrosAbierto(false);
  };

  // ============================================================
  // PAGINACIÓN
  // ============================================================

  const totalPaginas = Math.ceil(sesionesFiltradas.length / sesionesPorPagina);

  const indiceUltimaSesion = paginaActual * sesionesPorPagina;

  const indicePrimeraSesion = indiceUltimaSesion - sesionesPorPagina;

  const sesionesPaginadas = sesionesFiltradas.slice(
    indicePrimeraSesion,
    indiceUltimaSesion,
  );

  // ============================================================
  // FILTROS ACTIVOS
  // ============================================================

  const hayFiltrosActivos =
    filtroGenero || filtroCurso || fechaDesde || fechaHasta;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sesiones-main-content">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <header className="sesiones-header">
        <h2>
          {fechaFiltroUrl
            ? `Sesiones del día: ${fechaFiltroUrl.replaceAll("-", "/")}`
            : "Todas las fechas de las sesiones"}
        </h2>

        {/* ====================================================
            ACCIONES
           ==================================================== */}

        <div className="acciones-header">
          {/* ==================================================
              BOTÓN IMPORTAR NUEVAS SESIONES
             ================================================== */}

          <button
            className="btn-importar-sesiones"
            onClick={importarSesiones}
            disabled={importando}
            title={"Buscar nuevas sesiones en AWS"}>
            {importando ? "⏳ Importando..." : "⬇ Importar nuevas sesiones"}
          </button>

          {/* ==================================================
              MENSAJE DE IMPORTACIÓN
             ================================================== */}

          {mensajeImportacion && (
            <span className={`mensaje-importacion ${tipoMensajeImportacion}`}>
              {mensajeImportacion}
            </span>
          )}

          {/* ==================================================
              BOTÓN BÚSQUEDA POR ID
             ================================================== */}

          <button
            className={`btn-lupa ${busquedaId ? "activo" : ""}`}
            onClick={() => setModalBusquedaAbierta(true)}
            title="Buscar por ID">
            🔍
          </button>

          {/* ==================================================
              MENÚ FILTROS
             ================================================== */}

          <div className="filtros-wrapper">
            <button
              className={`btn-filtros ${menuFiltrosAbierto ? "activo" : ""}`}
              onClick={() => {
                setMenuFiltrosAbierto(!menuFiltrosAbierto);

                setSubmenúAbierto(null);
              }}>
              Filtros
              {hayFiltrosActivos && " •"}
            </button>

            {menuFiltrosAbierto && (
              <div className="dropdown-filtros">
                <div className="dropdown-menu-principal">
                  {/* ================================
                      FECHA
                     ================================= */}

                  <div
                    className={`dropdown-item ${
                      submenúAbierto === "fecha" ? "seleccionado" : ""
                    }`}
                    onClick={() =>
                      setSubmenúAbierto(
                        submenúAbierto === "fecha" ? null : "fecha",
                      )
                    }>
                    <span>
                      Por Fecha
                      {(fechaDesde || fechaHasta) && " ✓"}
                    </span>

                    <span>▸</span>
                  </div>

                  {/* ================================
                      GÉNERO
                     ================================= */}

                  <div
                    className={`dropdown-item ${
                      submenúAbierto === "genero" ? "seleccionado" : ""
                    }`}
                    onClick={() =>
                      setSubmenúAbierto(
                        submenúAbierto === "genero" ? null : "genero",
                      )
                    }>
                    <span>
                      Por Género
                      {filtroGenero && ` (${filtroGenero})`}
                    </span>

                    <span>▸</span>
                  </div>

                  {/* ================================
                      CURSO
                     ================================= */}

                  <div
                    className={`dropdown-item ${
                      submenúAbierto === "curso" ? "seleccionado" : ""
                    }`}
                    onClick={() =>
                      setSubmenúAbierto(
                        submenúAbierto === "curso" ? null : "curso",
                      )
                    }>
                    <span>
                      Por Curso
                      {filtroCurso && ` (${filtroCurso})`}
                    </span>

                    <span>▸</span>
                  </div>

                  {/* ================================
                      LIMPIAR
                     ================================= */}

                  {hayFiltrosActivos && (
                    <button
                      className="btn-limpiar-filtros"
                      onClick={limpiarFiltros}>
                      Limpiar Filtros
                    </button>
                  )}
                </div>

                {/* ==================================================
                    SUBMENÚ FECHA
                   ================================================== */}

                {submenúAbierto === "fecha" && (
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

                {/* ==================================================
                    SUBMENÚ GÉNERO
                   ================================================== */}

                {submenúAbierto === "genero" && (
                  <div className="dropdown-submenu">
                    <div className="submenu-header">Seleccionar Género</div>

                    {opcionesGenero.map((genero) => (
                      <div
                        key={genero}
                        className={`submenu-item ${
                          filtroGenero === genero ? "activo" : ""
                        }`}
                        onClick={() => {
                          setFiltroGenero(
                            filtroGenero === genero ? "" : genero,
                          );
                        }}>
                        {genero}
                      </div>
                    ))}
                  </div>
                )}

                {/* ==================================================
                    SUBMENÚ CURSO
                   ================================================== */}

                {submenúAbierto === "curso" && (
                  <div className="dropdown-submenu">
                    <div className="submenu-header">Seleccionar Curso</div>

                    {cursosDisponibles.length === 0 ? (
                      <div
                        className="submenu-item"
                        style={{
                          color: "#999",
                          cursor: "default",
                        }}>
                        Sin cursos registrados
                      </div>
                    ) : (
                      cursosDisponibles.map((curso) => (
                        <div
                          key={curso}
                          className={`submenu-item ${
                            filtroCurso === curso ? "activo" : ""
                          }`}
                          onClick={() => {
                            setFiltroCurso(filtroCurso === curso ? "" : curso);
                          }}>
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

      {/* ======================================================
          MODAL BÚSQUEDA POR ID
         ====================================================== */}

      {modalBusquedaAbierta && (
        <div
          className="modal-overlay"
          onClick={() => setModalBusquedaAbierta(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buscar Sesión por ID</h3>

              <button
                className="btn-cerrar-modal"
                onClick={() => setModalBusquedaAbierta(false)}>
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
                <button
                  className="btn-limpiar-busqueda"
                  onClick={() => setBusquedaId("")}>
                  Borrar búsqueda
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LISTADO DE SESIONES
         ====================================================== */}

      <section className="sesiones-container">
        <div className="sesiones-list">
          {cargando ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#64748B",
              }}>
              Cargando sesiones...
            </p>
          ) : error ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#EF4444",
              }}>
              {error}
            </p>
          ) : sesionesPaginadas.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#64748B",
              }}>
              No hay sesiones registradas que coincidan con la búsqueda.
            </p>
          ) : (
            sesionesPaginadas.map((sesion) => (
              <div
                key={sesion.id}
                className="sesion-card"
                onClick={() => navigate(`/teacher/sesiones/${sesion.id}`)}
                style={{
                  cursor: "pointer",
                }}>
                <span className="sesion-col sesion-col-id">{sesion.id}</span>

                <span className="sesion-col">{sesion.fechaFormateada}</span>

                <span className="sesion-col">{sesion.curso}</span>

                <span className="sesion-col sesion-col-genero">
                  {sesion.genero || "—"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* ====================================================
            PAGINACIÓN
           ==================================================== */}

        {!cargando && totalPaginas > 1 && (
          <div className="paginacion-container">
            <button
              className="btn-paginacion"
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}>
              Anterior
            </button>

            <span className="info-paginacion">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              className="btn-paginacion"
              onClick={() =>
                setPaginaActual((p) => Math.min(p + 1, totalPaginas))
              }
              disabled={paginaActual === totalPaginas}>
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default SesionesVisor;