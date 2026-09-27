import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiDownload, FiSearch, FiChevronLeft, FiChevronRight, FiInbox, FiRefreshCw } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import { useSessions, useImportSessions } from "./useSessions.js";
import { useMyReportRequests } from "../reports/useReports.js";
import { normalizarGenero, procesarSesionRaw } from "./sessionListHelpers.js";
import SessionsFilters from "./SessionsFilters.jsx";
import SessionSearchModal from "./SessionSearchModal.jsx";
import "./SessionsList.css";

const SESIONES_POR_PAGINA = 8;

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
  const importMutation = useImportSessions();

  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [busquedaId, setBusquedaId] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [refrescando, setRefrescando] = useState(false);

  const handleRefrescar = async () => {
    setRefrescando(true);
    try {
      await Promise.all([refetchSessions(), refetchMyRequests()]);
    } finally {
      setRefrescando(false);
    }
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

  const cursosDisponibles = useMemo(() => {
    const vistos = new Set();
    const cursos = [];
    sesionesProcesadas.forEach((s) => {
      if (!vistos.has(s.cursoNormalizado) && s.cursoNormalizado !== "curso no asignado") {
        vistos.add(s.cursoNormalizado);
        cursos.push(s.curso);
      }
    });
    return cursos;
  }, [sesionesProcesadas]);

  const sesionesFiltradas = useMemo(() => {
    let resultado = sesionesProcesadas;

    if (busquedaId.trim()) {
      const term = busquedaId.toLowerCase().trim();
      resultado = resultado.filter((s) => s.id.toLowerCase().includes(term));
    }

    if (filtroGenero) {
      const generoSeleccionado = normalizarGenero(filtroGenero);
      resultado = resultado.filter((s) => normalizarGenero(s.genero) === generoSeleccionado);
    }

    if (filtroCurso) {
      const curso = filtroCurso.toLowerCase().trim();
      resultado = resultado.filter((s) => s.cursoNormalizado === curso);
    }

    if (fechaDesde) {
      const desdeDate = new Date(`${fechaDesde}T00:00:00`);
      resultado = resultado.filter((s) => s.fechaRaw && s.fechaRaw >= desdeDate);
    }

    if (fechaHasta) {
      const hastaDate = new Date(`${fechaHasta}T23:59:59`);
      resultado = resultado.filter((s) => s.fechaRaw && s.fechaRaw <= hastaDate);
    }

    return resultado;
  }, [busquedaId, filtroGenero, filtroCurso, fechaDesde, fechaHasta, sesionesProcesadas]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaId, filtroGenero, filtroCurso, fechaDesde, fechaHasta]);

  const totalPaginas = Math.ceil(sesionesFiltradas.length / SESIONES_POR_PAGINA) || 1;
  const indiceUltima = paginaActual * SESIONES_POR_PAGINA;
  const sesionesPaginadas = sesionesFiltradas.slice(indiceUltima - SESIONES_POR_PAGINA, indiceUltima);

  const limpiarFiltros = () => {
    setFiltroGenero("");
    setFiltroCurso("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const handleImportar = () => {
    importMutation.mutate(undefined, {
      onSuccess: (data) => {
        const nuevas =
          data?.nuevas ??
          data?.imported ??
          data?.importadas ??
          data?.pending_identification?.length ??
          data?.created ??
          0;
        const omitidas = data?.omitidas_existentes ?? data?.skipped_existing?.length ?? data?.skipped ?? 0;

        if (nuevas > 0) {
          toast.success(`${nuevas} sesiones nuevas importadas.`);
        } else if (omitidas > 0) {
          toast(`No hay sesiones nuevas (${omitidas} ya existentes).`);
        } else {
          toast("No hay sesiones nuevas para importar.");
        }
      },
      onError: (error) => {
        toast.error(error?.message || "Error al importar las sesiones.");
      },
    });
  };

  return (
    <div className="el-sessions-list">
      <PageHeader
        title={
          fechaFiltroUrl
            ? `Sesiones del día ${fechaFiltroUrl.replaceAll("-", "/")}`
            : "Sesiones"
        }
        description="Historial de sesiones registradas en EmotionLab."
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
            <Button
              variant="secondary"
              size="sm"
              icon={FiDownload}
              onClick={handleImportar}
              loading={importMutation.isPending}
            >
              Importar sesiones
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FiSearch}
              onClick={() => setBusquedaAbierta(true)}
            >
              Buscar por ID
            </Button>
            <SessionsFilters
              filtroGenero={filtroGenero}
              setFiltroGenero={setFiltroGenero}
              filtroCurso={filtroCurso}
              setFiltroCurso={setFiltroCurso}
              fechaDesde={fechaDesde}
              setFechaDesde={setFechaDesde}
              fechaHasta={fechaHasta}
              setFechaHasta={setFechaHasta}
              cursosDisponibles={cursosDisponibles}
              normalizarGenero={normalizarGenero}
              onLimpiar={limpiarFiltros}
            />
          </div>
        }
      />

      <SessionSearchModal
        open={busquedaAbierta}
        onClose={() => setBusquedaAbierta(false)}
        value={busquedaId}
        onChange={setBusquedaId}
      />

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
            title="Sin sesiones"
            description="No hay sesiones registradas que coincidan con la búsqueda."
          />
        ) : (
          <div className="el-sessions-table-scroll">
            <table className="el-sessions-table">
              <thead>
                <tr>
                  <th>ID de sesión</th>
                  <th>Fecha</th>
                  <th>Curso</th>
                  <th>Género</th>
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
                    <td className="el-sessions-table-id">{sesion.id}</td>
                    <td>{sesion.fechaFormateada}</td>
                    <td>{sesion.curso}</td>
                    <td>{sesion.genero || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPaginas > 1 && (
          <div className="el-sessions-pagination">
            <Button
              variant="ghost"
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
              variant="ghost"
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
    </div>
  );
}
