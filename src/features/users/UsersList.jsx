import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiUsers } from "react-icons/fi";
import PageHeader from "../../ui/PageHeader.jsx";
import Button from "../../ui/Button.jsx";
import Badge from "../../ui/Badge.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import { SkeletonRows } from "../../ui/LoadingState.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import UserStatusBadge from "./UserStatusBadge.jsx";
import UserForm from "./UserForm.jsx";
import { getRoleLabel } from "../../lib/roles.js";
import {
  useChangeUserRole,
  useDeleteUser,
  useDisableUser,
  useEnableUser,
  useUpdateUserProfile,
  useUsers,
} from "./useUsers.js";
import "./UsersList.css";

// El otro rol válido del sistema (solo existen "admin" y "teacher" —
// ver core/roles.py del backend). "Cambiar rol" es, en la práctica, un
// toggle entre estos dos, así que no hace falta un <select> aparte:
// el propio botón de acción ya deja claro a qué rol se cambiará antes
// de confirmar.
function otroRol(rol) {
  return String(rol || "").toLowerCase() === "admin" ? "teacher" : "admin";
}

// Se preserva tal cual la lectura manual del JWT que ya usaba
// visualizadores_admin.jsx para los candados de autoprotección (no
// desactivarse/eliminarse/cambiarse el rol a sí mismo). No se
// reemplaza por useAuth().user?.uid: aunque todo indica que ambos
// valores coinciden, no se confirmó con certeza total contra el
// backend, y estos candados son demasiado sensibles para arriesgarlos
// en un cambio que no pidió el usuario.
function obtenerMiUid() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.identity || payload.uid || null;
  } catch {
    return null;
  }
}

function textosConfirmacion(accion) {
  if (!accion) return null;
  const { tipo, usuario } = accion;

  if (tipo === "role") {
    const nuevoRol = otroRol(usuario.rol);
    return {
      title: "Cambiar rol",
      message: `¿Confirmas cambiar el rol de ${usuario.nombre} de ${getRoleLabel(usuario.rol)} a ${getRoleLabel(nuevoRol)}?`,
      confirmLabel: "Cambiar rol",
      tone: "danger",
    };
  }
  if (tipo === "disable") {
    return {
      title: "Desactivar usuario",
      message: `¿Confirmas desactivar la cuenta de ${usuario.nombre}? No podrá iniciar sesión hasta que la reactives.`,
      confirmLabel: "Desactivar",
      tone: "danger",
    };
  }
  if (tipo === "enable") {
    return {
      title: "Activar usuario",
      message: `¿Confirmas activar la cuenta de ${usuario.nombre}?`,
      confirmLabel: "Activar",
      tone: "primary",
    };
  }
  if (tipo === "delete") {
    return {
      title: "Eliminar usuario",
      message: `¿Confirmas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      tone: "danger",
    };
  }
  return null;
}

/**
 * Reemplaza pages/vista_admin/visualizadores_admin.jsx (Fase 5).
 *
 * Mismos endpoints exactos que ya usaba esa pantalla (GET /users, PUT
 * /users/:uid, PATCH /users/:uid/disable|enable, DELETE /users/:uid),
 * ahora vía apiClient + React Query en vez de fetch manual, y con dos
 * cambios de UX explícitamente pedidos y aprobados:
 *
 *   - "Editar datos" (nombre/correo) y "Cambiar rol" son dos acciones
 *     separadas, cada una con su propia llamada a PUT /users/:uid
 *     (nunca envían el campo de la otra — ver usersApi.js). El
 *     contrato del backend no cambia: rol sigue siendo opcional en
 *     ese endpoint (confirmado contra services/user_service.py), así
 *     que omitirlo al editar datos es válido tal como está hoy.
 *   - Todas las acciones sensibles (desactivar, activar, eliminar,
 *     cambiar rol) usan ConfirmationDialog en vez del patrón de
 *     "toast con botones" que se autodestruía a los 5 segundos.
 *
 * Los tres candados de autoprotección se mantienen exactamente
 * iguales: un usuario no puede desactivarse, eliminarse ni cambiarse
 * el rol a sí mismo. Esto sigue siendo una restricción solo del
 * frontend — el backend (services/user_service.py) no la valida — así
 * que no reemplaza ninguna autorización real del servidor.
 */
export default function UsersList() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useUsers();
  const [busqueda, setBusqueda] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [errorForm, setErrorForm] = useState("");
  const [confirmAccion, setConfirmAccion] = useState(null); // { tipo, usuario } | null
  const [errorConfirm, setErrorConfirm] = useState("");

  const actualizarPerfil = useUpdateUserProfile();
  const cambiarRol = useChangeUserRole();
  const activar = useEnableUser();
  const desactivar = useDisableUser();
  const eliminar = useDeleteUser();

  const miUid = useMemo(obtenerMiUid, []);
  const usuarios = data || [];

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(termino) ||
        (u.email || "").toLowerCase().includes(termino),
    );
  }, [busqueda, usuarios]);

  const handleGuardarPerfil = (datos) => {
    setErrorForm("");
    actualizarPerfil.mutate(
      { uid: usuarioEditando.uid, ...datos },
      {
        onSuccess: () => setUsuarioEditando(null),
        onError: (error) => setErrorForm(error?.message || "No se pudo actualizar el usuario."),
      },
    );
  };

  const mutacionDeAccion = (tipo) =>
    ({ role: cambiarRol, disable: desactivar, enable: activar, delete: eliminar })[tipo];

  const abrirConfirmacion = (tipo, usuario) => {
    setErrorConfirm("");
    setConfirmAccion({ tipo, usuario });
  };

  const handleConfirmarAccion = () => {
    if (!confirmAccion) return;
    const { tipo, usuario } = confirmAccion;
    setErrorConfirm("");

    const onSuccess = () => setConfirmAccion(null);
    const onError = (error) =>
      setErrorConfirm(error?.message || "No se pudo completar la acción.");

    if (tipo === "role") {
      cambiarRol.mutate({ uid: usuario.uid, rol: otroRol(usuario.rol) }, { onSuccess, onError });
    } else if (tipo === "disable") {
      desactivar.mutate(usuario.uid, { onSuccess, onError });
    } else if (tipo === "enable") {
      activar.mutate(usuario.uid, { onSuccess, onError });
    } else if (tipo === "delete") {
      eliminar.mutate(usuario.uid, { onSuccess, onError });
    }
  };

  const textos = textosConfirmacion(confirmAccion);
  const loadingConfirm = confirmAccion ? mutacionDeAccion(confirmAccion.tipo).isPending : false;

  return (
    <div className="el-users-list">
      <PageHeader
        title="Especialistas"
        description="Gestiona las cuentas de especialistas y administradores del sistema."
        actions={
          <Button onClick={() => navigate("/admin/crear-visualizador")}>Crear especialista</Button>
        }
      />

      <div className="el-users-search">
        <FiSearch aria-hidden="true" />
        <input
          type="text"
          className="el-users-search-input"
          placeholder="Buscar por nombre o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar usuarios"
        />
      </div>

      <section className="el-users-table-card">
        {isLoading ? (
          <SkeletonRows rows={5} columns={5} />
        ) : isError ? (
          <EmptyState
            title="No se pudo obtener la lista de usuarios"
            description="Ocurrió un problema al conectar con el servidor. Intenta nuevamente."
          />
        ) : usuariosFiltrados.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="Sin resultados"
            description={
              busqueda
                ? "No se encontraron usuarios con esos criterios."
                : "No hay especialistas registrados aún."
            }
          />
        ) : (
          <div className="el-users-table-scroll">
            <table className="el-users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="el-users-table-col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario, index) => {
                  const esUnoMismo = Boolean(miUid) && usuario.uid === miUid;
                  return (
                    <tr key={usuario.uid || index}>
                      <td className="el-users-table-name">{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <Badge tone="neutral">{getRoleLabel(usuario.rol)}</Badge>
                      </td>
                      <td>
                        <UserStatusBadge activo={usuario.activo} />
                      </td>
                      <td className="el-users-table-col-actions">
                        <div className="el-users-table-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setErrorForm("");
                              setUsuarioEditando(usuario);
                            }}
                          >
                            Editar datos
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={esUnoMismo}
                            title={esUnoMismo ? "No puedes cambiar tu propio rol" : undefined}
                            onClick={() => abrirConfirmacion("role", usuario)}
                          >
                            Cambiar rol
                          </Button>
                          {usuario.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={esUnoMismo}
                              title={esUnoMismo ? "No puedes desactivar tu propia cuenta" : undefined}
                              onClick={() => abrirConfirmacion("disable", usuario)}
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={esUnoMismo}
                              title={esUnoMismo ? "No puedes activar tu propia cuenta" : undefined}
                              onClick={() => abrirConfirmacion("enable", usuario)}
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={esUnoMismo}
                            title={esUnoMismo ? "No puedes eliminar tu propia cuenta" : undefined}
                            onClick={() => abrirConfirmacion("delete", usuario)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UserForm
        usuario={usuarioEditando}
        onSave={handleGuardarPerfil}
        onClose={() => setUsuarioEditando(null)}
        loading={actualizarPerfil.isPending}
        error={errorForm}
      />

      <ConfirmationDialog
        open={Boolean(confirmAccion)}
        title={textos?.title}
        message={textos?.message}
        confirmLabel={textos?.confirmLabel}
        tone={textos?.tone}
        loading={loadingConfirm}
        onConfirm={handleConfirmarAccion}
        onCancel={() => setConfirmAccion(null)}
      >
        {errorConfirm && <p className="el-users-confirm-error">{errorConfirm}</p>}
      </ConfirmationDialog>
    </div>
  );
}
