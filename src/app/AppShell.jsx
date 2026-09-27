import React, { useMemo } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import { NAV_BY_ROLE } from "./navigation.js";
import { usePendingReportRequests, useMyReportRequests } from "../features/reports/useReports.js";
import { useReadTracking } from "../features/reports/useReadTracking.js";
import "./AppShell.css";

/**
 * Estructura única de la aplicación: Sidebar + Header + área de
 * trabajo. Reemplaza MenuAdmin/MenuEspecialista, que repetían el
 * mismo layout con un sidebar propio cada uno. Las rutas hijas siguen
 * llegando por <Outlet/>, exactamente como antes — no cambia ninguna
 * ruta en App.jsx.
 *
 * En esta pasada se enriquecen los items del Sidebar con badgeCount:
 *   - Admin: cantidad de solicitudes PENDING que requieren acción.
 *   - Teacher/Especialista: cantidad de cambios no vistos
 *     (transiciones PENDING -> APPROVED / REJECTED / COMPLETED
 *      que el especialista todavía no revisó). Si el backend no
 *      tiene campo "leído", se resuelve localmente vía localStorage
 *      (useReadTracking).
 */
export default function AppShell({ role }) {
  const baseItems = NAV_BY_ROLE[role] || [];

  // ============================================================
  // BADGE: ADMIN = pendientes de acción
  // ============================================================
  const { data: pendingData } = usePendingReportRequests();
  const pendingCount = useMemo(() => {
    if (role !== "admin") return null;
    const items = Array.isArray(pendingData)
      ? pendingData
      : pendingData?.items || [];
    const count = items.filter((s) => {
      const st = String(s?.status || "").toUpperCase();
      return st === "PENDING";
    }).length;
    return count > 0 ? count : null;
  }, [pendingData, role]);

  // ============================================================
  // BADGE: ESPECIALISTA = cambios no vistos (local)
  // ============================================================
  const { data: myRequestsData } = useMyReportRequests();
  const myRequests = useMemo(() => {
    if (role !== "teacher") return [];
    return Array.isArray(myRequestsData)
      ? myRequestsData
      : myRequestsData?.items || [];
  }, [myRequestsData, role]);
  const { noVistos } = useReadTracking(myRequests);
  const teacherBadge = role === "teacher" && noVistos > 0 ? noVistos : null;

  // ============================================================
  // ARMAR ITEMS CON BADGE
  // ============================================================
  const items = useMemo(() => {
    return baseItems.map((item) => {
      if (item.to === "/admin/solicitudes" && pendingCount !== null) {
        return { ...item, badgeCount: pendingCount };
      }
      if (item.to === "/teacher/solicitudes" && teacherBadge !== null) {
        return { ...item, badgeCount: teacherBadge };
      }
      return item;
    });
  }, [baseItems, pendingCount, teacherBadge]);

  return (
    <div className="el-shell">
      <Sidebar items={items} />
      <div className="el-shell-body">
        <Header items={items} role={role} />
        <main className="el-shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
