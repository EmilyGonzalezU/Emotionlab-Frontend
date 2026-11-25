import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiSearch, FiChevronLeft, FiChevronRight, FiInbox, FiRefreshCw, FiInfo, FiCheck, FiX } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import { useSessions } from "./useSessions.js";
import { api } from "../../lib/apiClient.js";
import toast from "react-hot-toast";
import { useMyReportRequests } from "../reports/useReports.js";
import { procesarSesionRaw } from "./sessionListHelpers.js";
import { getV8SessionSummary } from "./sessionModelDisplay.js";
import V8CaptureSummary from "./V8CaptureSummary.jsx";
import SessionsFilters from "./SessionsFilters.jsx";
import "./SessionsList.css";

const SESIONES_POR_PAGINA = 8;

// Estados en los que la experiencia existe en el backend y todavía no ha
// terminado: mientras estén presentes, el botón del encabezado debe permitir
// retomarla y finalizarla en vez de iniciar una nueva.
const ESTADOS_EXPERIENCIA_ACTIVA = ["capturing", "finalizing", "importing"];

/**
 * Listado de sesiones. Reemplaza sesiones_visor.jsx manteniendo
 * exactamente el mismo contrato con el backend (GET /sessions, POST
 * /sessions/import) y el mismo criterio de filtrado/orden/paginación
 * (todo en frontend — ver nota de "paginación en frontend" en el
 * informe de Fase 3, no se inventa una API de paginación nueva).
 */
export default function SessionsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fechaFiltroUrl = searchParams.get("fecha");

  const { data, isLoading, isError, refetch: refetchSessions } = useSessions();
  const { refetch: refetchMyRequests } = useMyReportRequests();

  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busquedaId, setBusquedaId] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [refrescando, setRefrescando] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [displayCode, setDisplayCode] = useState("");
  const [experience, setExperience] = useState(null);
  const [captureState, setCaptureState] = useState("idle");
  const [captureError, setCaptureError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const requestBusy = React.useRef(false);

  const handleRefrescar = async () => {
    setRefrescando(true);
    // El listado de solicitudes se actualiza en segundo plano cada 10 s;
    // no debe mantener ocupado el botón de actualización de sesiones.
    void refetchMyRequests();
    try {
      await refetchSessions();
    } finally {
      setRefrescando(false);
    }
  };

  const verifyAndStart = async (code) => {
    if (!/^\d{6}$/.test(code) || requestBusy.current || experience) return;
    requestBusy.current = true; setCaptureState("verifying"); setCaptureError("");
    try {
      const started = await api.post("/captures", { display_code: code, request_token: crypto.randomUUID() });
      if (!started?.session_id) throw new Error("El servidor no devolvió el identificador de sesión.");
      setExperience(started); setCaptureState(started.status || "capturing");
    } catch (e) {
      setCaptureState("invalid");
      const messagesByCode = {
        PIN_INVALIDO: "El código ingresado no es válido. Verifica el código que aparece en los lentes VR e inténtalo nuevamente.",
        PIN_EXPIRADO: "El código expiró. Solicita un código vigente en los lentes VR e inténtalo nuevamente.",
        PIN_YA_CONFIRMADO: "Este código ya fue confirmado. Verifica el código que aparece en los lentes VR e inténtalo nuevamente.",
        LENTE_LIMITADO: "El servicio de los lentes limitó los intentos. Espera unos minutos antes de volver a probar.",
        LIMITE_INTENTOS_PIN: "Se alcanzó el límite de intentos. Espera unos minutos antes de volver a probar.",
        LENTE_NO_DISPONIBLE: "El servicio de los lentes no está disponible ahora. Inténtalo más tarde.",
        LENTE_RESPUESTA_INVALIDA: "No se pudo validar la respuesta del servicio de los lentes.",
        CONFIRMACION_INDETERMINADA: "La confirmación quedó pendiente. No vuelvas a ingresar otro código; contacta al administrador para resolver el estado de la captura.",
        DISPOSITIVO_OCUPADO: "Ya existe una experiencia activa. Finalízala antes de iniciar otra.",
        LIMITADOR_NO_DISPONIBLE: "No se pudo comprobar el límite de intentos. Inténtalo más tarde.",
      };
      const messagesByStatus = {
        0: "No se pudo conectar con el servidor. Comprueba tu conexión y vuelve a intentarlo.",
        400: "El código ingresado no es válido. Verifica el código que aparece en los lentes VR e inténtalo nuevamente.",
        404: "El código ingresado no es válido. Verifica el código que aparece en los lentes VR e inténtalo nuevamente.",
        409: "No se pudo iniciar la captura. Comprueba el estado de la experiencia e inténtalo nuevamente.",
        410: "El código expiró. Solicita un código vigente en los lentes VR e inténtalo nuevamente.",
        429: "Se alcanzó el límite de intentos. Espera unos minutos antes de volver a probar.",
        502: "No se pudo validar la respuesta del servicio de los lentes.",
        503: "El servicio requerido no está disponible ahora. Inténtalo más tarde.",
      };
      setCaptureError(messagesByCode[e?.data?.error] || messagesByStatus[e?.status] || "No se pudo iniciar la experiencia. Comprueba tu conexión y vuelve a intentarlo.");
      // El inicio pudo completarse en el backend aunque la respuesta no
      // llegara (corte de conexión, por ejemplo). Se refresca el listado para
      // que el encabezado ofrezca finalizar la experiencia activa.
      refetchSessions();
    }
    finally { requestBusy.current = false; }
  };

  useEffect(() => {
    if (!experience?.session_id || !["capturing", "finalizing", "importing"].includes(captureState)) return;
    const timer = window.setInterval(async () => {
      try {
        const latest = await api.get(`/captures/${encodeURIComponent(experience.session_id)}`);
        setExperience((current) => ({ ...current, ...latest }));
        setCaptureState(latest.status || captureState);
        if (["captured", "capture_import_error"].includes(latest.status)) {
          await refetchSessions();
          if (latest.status === "captured") { setExperienceOpen(false); setExperience(null); setDisplayCode(""); }
        }
      } catch (e) { setCaptureError(e?.message || "No se pudo consultar el estado de la experiencia."); }
    }, 3500);
    return () => window.clearInterval(timer);
  }, [experience?.session_id, captureState, refetchSessions]);

  const finishExperience = async () => {
    if (!experience?.session_id || requestBusy.current) return;
    requestBusy.current = true; setCaptureError(""); setCaptureState("finalizing");
    try {
      await api.post(`/captures/${encodeURIComponent(experience.session_id)}/finalize`, {});
      const result = await api.post(`/captures/${encodeURIComponent(experience.session_id)}/complete`, {});
      const detail = result.status === "captured" ? await api.get(`/captures/${encodeURIComponent(experience.session_id)}`) : null;
      const finalState = { ...result, ...(detail || {}) };
      setExperience((current) => ({ ...current, ...finalState })); setCaptureState(finalState.status || "importing");
      if (finalState.status === "captured") {
        await refetchSessions(); setExperienceOpen(false); setExperience(null); setDisplayCode("");
        const analysis = finalState.model_processing?.status || finalState.ai_status || finalState.extraction?.processing_status;
        if (analysis && !["analyzed"].includes(analysis)) toast.error(`La captura fue persistida; el análisis EmotionLab terminó en estado: ${analysis}. Revisa el detalle de sesión.`);
        else toast.success("Experiencia recopilada y sesión actualizada.");
      }
      else if (result.status === "capture_import_error") setCaptureError(result.extraction?.import_status === "no_data"
        ? "La sesión se cerró, pero los lentes no entregaron registros asociados. Puedes reintentar la recopilación cuando la transferencia haya terminado."
        : "La extracción o el procesamiento no finalizaron correctamente. Revisa el estado de la sesión antes de continuar.");
    } catch (e) { setCaptureError(e?.message || "No se pudo finalizar la experiencia."); }
    finally { requestBusy.current = false; }
  };

  // Experiencia activa del usuario, detectada desde el listado de sesiones
  // (el backend solo admite una experiencia activa en todo el sistema y la
  // publica en el listado con su estado). Es la que permite finalizar.
  const experienciaActiva = useMemo(() => {
    const activa = (data || []).find((session) =>
      ESTADOS_EXPERIENCIA_ACTIVA.includes(String(session?.status || session?.estado || "").toLowerCase())
    );
    return activa?.session_id || activa?.id || null;
  }, [data]);

  // El botón del encabezado inicia una experiencia nueva o retoma la activa
  // para poder finalizarla cuando el modal no llegó a abrirse.
  const handleExperienceButton = async () => {
    setCaptureError("");
    if (!experienciaActiva) {
      setExperienceOpen(true); setCaptureState("idle");
      return;
    }
    requestBusy.current = true;
    setExperience({ session_id: experienciaActiva, status: "capturing" });
    setCaptureState("capturing"); setExperienceOpen(true);
    try {
      const latest = await api.get(`/captures/${encodeURIComponent(experienciaActiva)}`);
      setExperience((current) => ({ ...current, ...latest }));
      setCaptureState(latest.status || "capturing");
    } catch (e) { setCaptureError(e?.message || "No se pudo consultar la experiencia activa."); }
    finally { requestBusy.current = false; }
  };

  const sesionesProcesadas = useMemo(() => {
    if (!data) return [];

    let lista = data.map((item, index) => procesarSesionRaw(item, index));
    lista.sort((a, b) => (b.fechaRaw?.getTime() || 0) - (a.fechaRaw?.getTime() || 0));

    if (fechaFiltroUrl) {
      const fTarget = fechaFiltroUrl.replaceAll("/", "-").trim();
      lista = lista.filter((s) => {
        const fComp = (s.fechaComparar || "").replaceAll("/", "-").trim();
        return fComp === fTarget || s.fechaISO === fTarget;
      });
    }

    return lista;
  }, [data, fechaFiltroUrl]);

  const sesionesFiltradas = useMemo(() => {
    let resultado = sesionesProcesadas;

    if (busquedaId.trim()) {
      const term = busquedaId.toLowerCase().trim();
      resultado = resultado.filter((s) => `${s.id} ${s.nombre}`.toLowerCase().includes(term));
    }

    if (filtroEstado) resultado = resultado.filter((s) => s.estadoSesionLabel === filtroEstado);

    if (fechaDesde) {
      resultado = resultado.filter((s) => s.fechaISO && s.fechaISO >= fechaDesde);
    }

    if (fechaHasta) {
      resultado = resultado.filter((s) => s.fechaISO && s.fechaISO <= fechaHasta);
    }

    return resultado;
  }, [busquedaId, filtroEstado, fechaDesde, fechaHasta, sesionesProcesadas]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaId, filtroEstado, fechaDesde, fechaHasta]);

  const totalPaginas = Math.ceil(sesionesFiltradas.length / SESIONES_POR_PAGINA) || 1;
  const indiceUltima = paginaActual * SESIONES_POR_PAGINA;
  const sesionesPaginadas = sesionesFiltradas.slice(indiceUltima - SESIONES_POR_PAGINA, indiceUltima);

  // Paso actual del diálogo de captura: 1 captura, 2 recopilación, 3 análisis.
  const pasoExperiencia = captureState === "captured"
    ? 3
    : ["finalizing", "importing"].includes(captureState) ? 2 : 1;

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setFechaDesde("");
    setFechaHasta("");
  };

  return (
    <div className="el-sessions-list">
      <PageHeader
        title={
          fechaFiltroUrl
            ? `Sesiones del día ${fechaFiltroUrl.replaceAll("-", "/")}`
            : "Sesiones"
        }
        description="Historial de sesiones con el estado y los resultados del cálculo automatizado disponibles."
        actions={
          <div className="el-sessions-list-actions">
            <Button
              variant="secondary"
              size="sm"
              icon={FiRefreshCw}
              onClick={handleRefrescar}
              loading={refrescando || isLoading}
            >
              Actualizar
            </Button>
            <Button variant="primary" size="sm" onClick={handleExperienceButton}>{experienciaActiva ? "Finalizar experiencia" : "Iniciar experiencia"}</Button>
            <SessionsFilters
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              fechaDesde={fechaDesde}
              setFechaDesde={setFechaDesde}
              fechaHasta={fechaHasta}
              setFechaHasta={setFechaHasta}
              onLimpiar={limpiarFiltros}
            />
          </div>
        }
      />

      <section className="el-sessions-overview" aria-label="Resumen de sesiones"><strong>{sesionesProcesadas.length}</strong><span>{sesionesProcesadas.length === 1 ? "sesión registrada" : "sesiones registradas"}</span><span className="el-sessions-overview-filtered">{sesionesFiltradas.length !== sesionesProcesadas.length ? ` · ${sesionesFiltradas.length} coinciden con los filtros` : ""}</span></section>
      <div className="el-session-inline-search"><label htmlFor="session-id-search"><FiSearch aria-hidden="true"/>Buscar por alumno o ID de sesión</label><div><input id="session-id-search" type="search" value={busquedaId} onChange={event=>setBusquedaId(event.target.value)} placeholder="Nombre o identificador" autoComplete="off"/><button type="button" onClick={()=>setBusquedaId("")} disabled={!busquedaId} aria-label="Limpiar búsqueda"><FiX/>Limpiar</button></div></div>

      <section className="el-sessions-table-card">
        {isLoading ? (
          <SkeletonRows rows={6} columns={4} />
        ) : isError ? (
          <EmptyState
            title="No se pudieron obtener las sesiones"
            description="Ocurrió un problema al conectar con el servidor. Intenta nuevamente."
          />
        ) : sesionesPaginadas.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title={busquedaId ? "No hay coincidencias" : "Sin sesiones"}
            description={busquedaId ? `No se encontró un alumno o identificador que coincida con “${busquedaId}”. Limpia la búsqueda para ver todas las sesiones.` : "No hay sesiones registradas que coincidan con los filtros actuales."}
          />
        ) : (
          <div className="el-sessions-table-scroll">
            <table className="el-table el-sessions-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Cálculo con IA</th>
                  <th>ID de sesión</th>
                </tr>
              </thead>
              <tbody>
                {sesionesPaginadas.map((sesion) => (
                  <tr
                    key={sesion.id}
                    onClick={() => navigate(`/teacher/sesiones/${sesion.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/teacher/sesiones/${sesion.id}`);
                    }}
                  >
                    <td>{sesion.fechaFormateada}</td>
                    <td><Badge tone={sesion.estadoSesionLabel === "Completada" ? "success" : sesion.estadoSesionLabel === "Error de procesamiento" ? "warning" : "neutral"}>{sesion.estadoSesionLabel}</Badge></td>
                    <td><Badge tone={getV8SessionSummary(sesion._raw).statusTone}>{sesion.analisisLabel}</Badge></td>
                    <td className="el-sessions-table-id">{sesion.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPaginas > 1 && (
          <div className="el-pagination el-sessions-pagination">
            <Button
              variant="secondary"
              size="sm"
              icon={FiChevronLeft}
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
            >
              Anterior
            </Button>
            <span className="el-sessions-pagination-info">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={FiChevronRight}
              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        )}
      </section>
      {experienceOpen && <div className="el-experience-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !experience && !requestBusy.current) setExperienceOpen(false); }}>
        <section className="el-experience-dialog" role="dialog" aria-modal="true" aria-labelledby="el-experience-title">
          <button className="el-experience-close" aria-label="Cerrar" disabled={Boolean(experience) || requestBusy.current} onClick={() => setExperienceOpen(false)}>×</button>
          {!experience ? <>
            <header className="el-experience-head">
              <span className="el-experience-head-icon" aria-hidden="true">◉</span>
              <div className="el-experience-head-text">
                <h2 id="el-experience-title">Iniciar experiencia</h2>
                <p>Ingresa el código de seis dígitos que aparece en los lentes VR.</p>
              </div>
            </header>
            <div className="el-experience-code">
              <label htmlFor="el-experience-code">Código de los lentes</label>
              <input id="el-experience-code" autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength={6} aria-label="Código de los lentes VR" placeholder="000000" value={displayCode} onChange={(event) => { const value = event.target.value.replace(/\D/g, "").slice(0, 6); setDisplayCode(value); setCaptureError(""); if (value.length === 6) verifyAndStart(value); }} disabled={captureState === "verifying" || captureState === "starting"} />
              <p className="el-experience-code-hint">La verificación comienza sola al completar los seis dígitos.</p>
            </div>
            {(captureState === "verifying" || captureState === "starting") && <p role="status" className="el-experience-progress"><span className="el-spinner"/>Estamos verificando el código…</p>}
            {captureError && <p className="el-experience-alert" role="alert">{captureError}</p>}
            <button className="el-experience-help-trigger" type="button" onClick={()=>setHelpOpen(value=>!value)} aria-expanded={helpOpen}>{helpOpen ? "Ocultar ayuda" : "¿Cómo probar un código?"}</button>
            {helpOpen && <div className="el-experience-help"><button type="button" onClick={()=>setHelpOpen(false)} aria-label="Cerrar ayuda"><FiX/></button><h3>Cómo probar un código</h3><ol><li>Busca en los lentes VR el código de seis dígitos que se muestra para la experiencia.</li><li>Escribe esos dígitos en el campo; la verificación comienza automáticamente.</li><li>Si el servicio confirma el código, EmotionLab inicia la captura con la operación real del backend.</li><li>Si no puede validarse, revisa que el código siga vigente y vuelve a ingresarlo; ningún registro se inicia mientras no se confirme.</li></ol></div>}
          </> : <>
            <header className="el-experience-head">
              <span className="el-vr-mark" aria-hidden="true">◉</span>
              <div className="el-experience-head-text">
                <h2 id="el-experience-title">La experiencia está en curso</h2>
                <p>Cuando el alumno termine, finaliza la experiencia desde esta pantalla.</p>
              </div>
            </header>
            <ol className="el-experience-steps" aria-label="Progreso de la experiencia">
              <li className={`el-experience-step${pasoExperiencia >= 1 ? " is-active" : ""}`}><span>1</span>Captura en los lentes</li>
              <li className={`el-experience-step${pasoExperiencia >= 2 ? " is-active" : ""}`}><span>2</span>Recopilación de datos</li>
              <li className={`el-experience-step${pasoExperiencia >= 3 ? " is-active" : ""}`}><span>3</span>Análisis completado</li>
            </ol>
            <dl className="el-experience-meta">
              <div><dt>Sesión</dt><dd>{experience.session_id}</dd></div>
              <div><dt>Estado</dt><dd>{experience.status || captureState}</dd></div>
              {experience.record_count != null && <div><dt>Registros recibidos</dt><dd>{experience.record_count}</dd></div>}
              {experience.student_data?.edad != null && <div><dt>Edad</dt><dd>{experience.student_data.edad}</dd></div>}
              {experience.student_data?.genero && <div><dt>Género</dt><dd>{experience.student_data.genero}</dd></div>}
            </dl>
            {experience.model_processing && <V8CaptureSummary session={experience}/>}
            {captureState === "finalizing" || captureState === "importing" ? <div role="status" className="el-experience-progress"><span className="el-spinner"/>Estamos recopilando los datos de la experiencia</div> : null}
            {captureState === "captured" ? <p role="status" className="el-experience-success"><FiCheck/> Datos guardados correctamente.</p> : null}
            {captureState === "capture_import_error" && <p className="el-experience-alert" role="alert">La recopilación terminó con un error. Consulta el detalle de la sesión para revisar la causa.</p>}
            {captureError && <p className="el-experience-alert" role="alert">{captureError}</p>}
            <div className="el-experience-actions"><Button variant="primary" onClick={finishExperience} loading={requestBusy.current || ["finalizing", "importing"].includes(captureState)} disabled={!["capturing", "capture_import_error"].includes(captureState)}>Finalizar experiencia</Button><button type="button" className="el-experience-help-icon" title="Utiliza este botón cuando el alumno haya terminado su experiencia. Al finalizar, EmotionLab comenzará a recopilar y procesar los datos" aria-label="Ayuda sobre finalizar"><FiInfo/></button></div>
          </>}
        </section>
      </div>}
    </div>
  );
}
