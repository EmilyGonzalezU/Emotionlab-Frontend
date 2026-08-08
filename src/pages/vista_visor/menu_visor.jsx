import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './menu_visor.css';

export default function MenuVisor() {
  return (
    <div className="visor-layout">
      <Sidebar />
      <main className="visor-main-content">
        <Outlet />
      </main>
    </div>
  );
}
