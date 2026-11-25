import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleLabel } from "../../lib/roles.js";
import { validateNewPassword } from "../../lib/passwordPolicy.js";
import { api } from "../../lib/apiClient.js";
import PageHeader from "../../ui/PageHeader.jsx";
import Badge from "../../ui/Badge.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import PasswordField from "../../ui/PasswordField.jsx";
import PasswordChecklist from "../../ui/PasswordChecklist.jsx";
import { SkeletonLine } from "../../ui/LoadingState.jsx";
import "./Cuenta.css";

const CLAVES_INICIALES = { actual: "", nueva: "", confirmar: "" };

/**
 * Pantalla de cuenta, única para admin y especialista.
 *
 * Antes existían dos archivos casi idénticos —
 * pages/vista_admin/cuenta_admin.jsx y pages/vista_visor/cuenta_visor.jsx—
 * con exactamente la misma lógica de datos, la misma validación de
 * contraseña (con una diferencia real: a cuenta_admin/cuenta_visor les
 * faltaba exigir un número, ver lib/passwordPolicy.js) y la misma
 * confirmación por toast. La única diferencia funcional entre ambos
 * era la etiqueta de rol mostrada, que ya vive centralizada en
 * lib/roles.js. Ambos archivos ahora son wrappers de este componente
 * (mismo patrón que menu_admin.jsx / menu_visor.jsx con AppShell).
 *
 * Contratos sin cambios: GET /users/me y PATCH /users/me/password,
 * mismos payloads.
 */
export default function Cuenta() {
  const { rol } = useAuth();
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);

  const [datosUser, setDatosUser] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [claves, setClaves] = useState(CLAVES_INICIALES);
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmar, setErrorConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const obtenerMisDatos = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const datos = await api.get("/users/me");
      setDatosUser({
        nombre: datos?.nombre || "Sin nombre",
        email: datos?.email || "Sin correo",
      });
    } catch (error) {
      // Un error de red o de sesión ya es manejado por apiClient
      // (401 -> cierre de sesión). Cualquier otro caso: no inventamos
      // datos, mostramos que no se pudo cargar.
      console.error("Error al obtener los datos de la cuenta", error);
      setDatosUser({ nombre: "No disponible", email: "No disponible" });
    } finally {
      setCargandoDatos(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    obtenerMisDatos();
  }, [obtenerMisDatos]);

  const manejarCambio = (campo) => (e) => {
    const { value } = e.target;
    setClaves((prev) => ({ ...prev, [campo]: value }));

    if (campo === "nueva") {
      setErrorConfirmar(
        claves.confirmar && value !== claves.confirmar
          ? "Las contraseñas no coinciden."
          : "",
      );
    }

    if (campo === "confirmar") {
      setErrorConfirmar(
        value && value !== claves.nueva ? "Las contraseñas no coinciden." : "",
      );
    }
  };

  const validarFormulario = () => {
    if (!claves.actual || !claves.nueva || !claves.confirmar) {
      toast.error("Por favor, llena todos los campos.");
      return false;
    }

    const { valid, message } = validateNewPassword(claves.nueva);
    if (!valid) {
      setErrorNueva(message);
      toast.error(message);
      return false;
    }
    setErrorNueva("");

    if (claves.nueva !== claves.confirmar) {
      setErrorConfirmar("Las contraseñas no coinciden.");
      toast.error("Las contraseñas nuevas no coinciden.");
      return false;
    }

    if (claves.nueva === claves.actual) {
      toast.error("La nueva contraseña debe ser diferente a la actual.");
      return false;
    }

    return true;
  };

  const solicitarCambio = (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setConfirmando(true);
  };

  const confirmarCambio = async () => {
    setConfirmando(false);
    setEnviando(true);
    try {
      await api.patch("/users/me/password", {
          current_password: claves.actual,
          new_password: claves.nueva,
      });
      toast.success("Contraseña actualizada con éxito.");
      setClaves(CLAVES_INICIALES);
      setErrorNueva("");
      setErrorConfirmar("");
    } catch (error) {
      toast.error(error?.message || "No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="el-cuenta">
      <PageHeader title="Mi cuenta" description="Datos de tu cuenta y seguridad de acceso." />

      <div className="el-cuenta-grid">
        <section className="el-cuenta-panel">
          <h2 className="el-cuenta-panel-title">Información personal</h2>

          <dl className="el-cuenta-info">
            <div className="el-cuenta-info-row">
              <dt>Nombre completo</dt>
              <dd>
                {cargandoDatos ? <SkeletonLine width="60%" /> : datosUser.nombre}
              </dd>
            </div>
            <div className="el-cuenta-info-row">
              <dt>Correo electrónico</dt>
              <dd>
                {cargandoDatos ? <SkeletonLine width="70%" /> : datosUser.email}
              </dd>
            </div>
            <div className="el-cuenta-info-row">
              <dt>Rol en el sistema</dt>
              <dd>
                <Badge tone="brand">{getRoleLabel(rol)}</Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section className="el-cuenta-panel">
          <h2 className="el-cuenta-panel-title">Seguridad</h2>
          <p className="el-cuenta-panel-desc">
            Actualiza tu contraseña de acceso.
          </p>

          <form className="el-cuenta-form" onSubmit={solicitarCambio}>
            <PasswordField
              label="Contraseña actual"
              name="actual"
              value={claves.actual}
              onChange={manejarCambio("actual")}
              placeholder="Ingresa tu contraseña actual"
              autoComplete="current-password"
            />

            <PasswordField
              label="Nueva contraseña"
              name="nueva"
              value={claves.nueva}
              onChange={manejarCambio("nueva")}
              placeholder="Crea una contraseña segura"
              autoComplete="new-password"
              error={errorNueva}
            />

            <PasswordChecklist value={claves.nueva} />

            <PasswordField
              label="Confirmar nueva contraseña"
              name="confirmar"
              value={claves.confirmar}
              onChange={manejarCambio("confirmar")}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              error={errorConfirmar}
            />

            <Button type="submit" loading={enviando} disabled={enviando}>
              Cambiar contraseña
            </Button>
          </form>
        </section>
      </div>

      <ConfirmationDialog
        open={confirmando}
        title="Cambiar contraseña"
        message="¿Seguro que quieres cambiar tu contraseña?"
        confirmLabel="Cambiar"
        cancelLabel="Cancelar"
        onConfirm={confirmarCambio}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}
