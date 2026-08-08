import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './sesion_detalle.css';

// Importación corregida para jsPDF y autoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SesionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sesionData, setSesionData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerDetalleSesion = async () => {
      try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`http://localhost:5000/sessions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!respuesta.ok) {
          throw new Error('Error al obtener la información de la sesión');
        }

        const data = await respuesta.json();
        setSesionData(data);
      } catch (err) {
        console.error("Error al obtener detalle:", err);
        setError("No se pudo cargar la información de la sesión.");
      } finally {
        setCargando(false);
      }
    };

    obtenerDetalleSesion();
  }, [id]);

  // Lectura de los campos del JSON
  const rawData = sesionData?.raw_data || {};
  const sessionData = rawData?.session_data || {};
  const respuestas = sessionData?.respuestas || [];
  const eventos = sessionData?.eventos || [];

  // Datos del alumno y sesión con fallbacks
  const nombreAlumno = sesionData?.nombre || sessionData?.nombre || sessionData?.student_name || 'Sin especificar';
  const edadAlumno = (sesionData?.edad || sessionData?.edad || sessionData?.age) 
    ? `${sesionData?.edad || sessionData?.edad || sessionData?.age} años` 
    : 'Sin registrar';
  const cursoAlumno = sesionData?.curso || sessionData?.curso || sessionData?.course || sessionData?.grade || 'No asignado';
  const generoAlumno = sesionData?.genero || sessionData?.genero || sessionData?.gender || 'Sin registrar';
  const idSesion = sesionData?.session_id || id;
  const idParticipante = sessionData?.idParticipante || 'Sin ID';
  const dificultad = sesionData?.difficulty || sessionData?.difficulty_level || 'No registrado';
  const estadoPrediccion = sesionData?.estado || 'Desconocido';
  const inicioSesion = sessionData?.fechaInicio || `${sesionData?.fecha || ''} ${sesionData?.hora || ''}`.trim() || 'Sin registro';
  const finSesion = sessionData?.fechaFin || 'En curso / Sin registro';

  // --- FUNCIÓN EXPORTAR A PDF CORREGIDA ---
  const handleExportPDF = () => {
    try {
      if (!sesionData) return;

      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(18);
      doc.setTextColor(23, 49, 94);
      doc.text('Informe Detallado de Sesión', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`ID de Sesión: ${idSesion} | Fecha de Informe: ${new Date().toLocaleDateString('es-CL')}`, 14, 27);

      // Tabla 1: Datos Generales
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('1. Datos del Alumno y Sesión', 14, 36);

      autoTable(doc, {
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [23, 49, 94] },
        head: [['Campo', 'Valor']],
        body: [
          ['Nombre del Alumno', nombreAlumno],
          ['Curso', cursoAlumno],
          ['Edad', edadAlumno],
          ['Género', generoAlumno],
          ['ID Participante', idParticipante],
          ['Nivel de Dificultad', dificultad],
          ['Estado de Predicción', estadoPrediccion],
          ['Inicio de Sesión', inicioSesion],
          ['Fin de Sesión', finSesion]
        ]
      });

      // Tabla 2: Respuestas
      let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120;
      doc.setFontSize(12);
      doc.text('2. Respuestas del Alumno', 14, nextY);

      const filasRespuestas = respuestas.map((r, index) => [
        `#${index + 1}`,
        r.textoPregunta || '—',
        r.respuestaLabel || '—',
        r.escena || '—',
        r.timestamp?.split(' ')[1] || '—'
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        theme: 'striped',
        headStyles: { fillColor: [23, 49, 94] },
        head: [['#', 'Pregunta', 'Respuesta', 'Escena', 'Hora']],
        body: filasRespuestas.length > 0 ? filasRespuestas : [['—', 'Sin respuestas registradas', '—', '—', '—']]
      });

      // Tabla 3: Eventos
      nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : nextY + 40;
      doc.setFontSize(12);
      doc.text('3. Eventos de la Sesión', 14, nextY);

      const filasEventos = eventos.map((e) => [
        e.fase || '—',
        e.nombre || '—',
        e.timestamp || '—'
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        theme: 'striped',
        headStyles: { fillColor: [23, 49, 94] },
        head: [['Fase', 'Nombre del Evento', 'Timestamp']],
        body: filasEventos.length > 0 ? filasEventos : [['—', 'Sin eventos registrados', '—']]
      });

      // Descargar PDF
      doc.save(`Sesion_${idSesion}.pdf`);
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      alert("Ocurrió un error al generar el archivo PDF. Revisa la consola.");
    }
  };

  // --- FUNCIÓN EXPORTAR A EXCEL ---
  const handleExportExcel = () => {
    try {
      if (!sesionData) return;

      const resumenData = [
        { Campo: 'ID Sesión', Valor: idSesion },
        { Campo: 'ID Participante', Valor: idParticipante },
        { Campo: 'Nombre Alumno', Valor: nombreAlumno },
        { Campo: 'Curso', Valor: cursoAlumno },
        { Campo: 'Edad', Valor: edadAlumno },
        { Campo: 'Género', Valor: generoAlumno },
        { Campo: 'Dificultad', Valor: dificultad },
        { Campo: 'Estado Predicción', Valor: estadoPrediccion },
        { Campo: 'Inicio Sesión', Valor: inicioSesion },
        { Campo: 'Fin Sesión', Valor: finSesion }
      ];

      const respuestasData = respuestas.map((r, index) => ({
        'N°': index + 1,
        'Pregunta': r.textoPregunta,
        'Respuesta': r.respuestaLabel,
        'Escena': r.escena,
        'Timestamp': r.timestamp
      }));

      const eventosData = eventos.map((e) => ({
        'Fase': e.fase,
        'Evento': e.nombre,
        'Timestamp': e.timestamp
      }));

      const wb = XLSX.utils.book_new();

      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      const wsRespuestas = XLSX.utils.json_to_sheet(respuestasData.length > 0 ? respuestasData : [{ Info: 'Sin respuestas' }]);
      const wsEventos = XLSX.utils.json_to_sheet(eventosData.length > 0 ? eventosData : [{ Info: 'Sin eventos' }]);

      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
      XLSX.utils.book_append_sheet(wb, wsRespuestas, 'Respuestas');
      XLSX.utils.book_append_sheet(wb, wsEventos, 'Eventos');

      XLSX.writeFile(wb, `Sesion_${idSesion}.xlsx`);
    } catch (err) {
      console.error("Error al generar el Excel:", err);
      alert("Ocurrió un error al generar el Excel.");
    }
  };

  return (
    <div className="layout-pagina-visor">
      <Sidebar />

      <div className="main-content">
        <div className="sesion-detalle-top">
          <button className="btn-volver" onClick={() => navigate('/teacher/sesiones')}>
            ← Volver a Sesiones
          </button>
          <div className="box-titulo">
            <h2>Detalle de la Sesión</h2>
          </div>
        </div>

        {cargando ? (
          <div className="cargando-container">Cargando datos de la sesión...</div>
        ) : error ? (
          <div className="error-container">{error}</div>
        ) : (
          <div className="detalle-grid-container">
            
            <div className="columna-informacion">
              
              {/* Resumen del Alumno */}
              <div className="card-seccion">
                <h3 className="card-titulo">Datos del Alumno y Sesión</h3>
                <div className="grid-datos-alumno">
                  <div className="dato-item">
                    <span className="dato-etiqueta">Nombre del Alumno:</span>
                    <span className="dato-valor">{nombreAlumno}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Curso:</span>
                    <span className="dato-valor">{cursoAlumno}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Edad:</span>
                    <span className="dato-valor">{edadAlumno}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Género:</span>
                    <span className="dato-valor">{generoAlumno}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">ID de Sesión:</span>
                    <span className="dato-valor">{idSesion}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">ID Participante:</span>
                    <span className="dato-valor">{idParticipante}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Nivel de Dificultad:</span>
                    <span className="dato-valor etiqueta-dificultad">{dificultad}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Estado de Predicción:</span>
                    <span className="dato-valor">{estadoPrediccion}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Inicio de Sesión:</span>
                    <span className="dato-valor">{inicioSesion}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-etiqueta">Fin de Sesión:</span>
                    <span className="dato-valor">{finSesion}</span>
                  </div>
                </div>
              </div>

              {/* Respuestas */}
              <div className="card-seccion">
                <h3 className="card-titulo">Respuestas del Alumno</h3>
                {respuestas.length > 0 ? (
                  <div className="respuestas-lista">
                    {respuestas.map((resp, index) => (
                      <div key={index} className="respuesta-item">
                        <span className="respuesta-numero">#{index + 1}</span>
                        <div className="respuesta-contenido">
                          <p className="respuesta-pregunta">{resp.textoPregunta}</p>
                          <div className="respuesta-detalles">
                            <span className="badge-respuesta">
                              Respuesta: <strong>{resp.respuestaLabel}</strong>
                            </span>
                            <span className="info-escena">Escena: {resp.escena}</span>
                            <span className="info-hora">{resp.timestamp?.split(' ')[1] || ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sin-datos">No hay respuestas registradas.</p>
                )}
              </div>

              {/* Eventos */}
              <div className="card-seccion">
                <h3 className="card-titulo">Eventos de la Sesión</h3>
                {eventos.length > 0 ? (
                  <div className="eventos-timeline">
                    {eventos.map((evt, index) => (
                      <div key={index} className="evento-item">
                        <span className={`fase-tag fase-${evt.fase}`}>{evt.fase}</span>
                        <span className="evento-nombre">{evt.nombre}</span>
                        <span className="evento-hora">{evt.timestamp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sin-datos">No hay eventos registrados.</p>
                )}
              </div>

            </div>

            {/* Botones de Exportar */}
            <div className="box-acciones-exportar">
              <button className="btn-exportar" onClick={handleExportPDF}>
                Exportar a PDF
              </button>
              <button className="btn-exportar" onClick={handleExportExcel}>
                Exportar en Excel
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SesionDetalle;