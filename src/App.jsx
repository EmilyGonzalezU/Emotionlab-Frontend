import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// importamos las rutas de nuestro proyecto, en este caso las vistas
import Login from './pages/login.jsx'; 
import MenuAdmin from "./pages/vista_admin/menu_admin.jsx"; // la base del menu lateral
import HomeAdmin from './pages/vista_admin/home_admin.jsx';
import ListaVisualizadores from './pages/vista_admin/visualizadores_admin.jsx'; // La tabla
import CrearVisualizador from './pages/vista_admin/creacion_visor.jsx'; // El formulario
//import CuentaAdmin from './pages/vista_admin/CuentaAdmin.jsx'; // El perfil
import HomeTeacher from './pages/vista_visor/home_visor.jsx';

function App() {
  return (
    // con el browserrouter hacemos que las rutas funcionen en todo el docu
    <BrowserRouter>
      <Routes>
        {/* La ruta inicial es el Login, los q ejecuten el proyecto deberian ver esta pagina de inicio */}
        <Route path="/" element={<Login />} />
        
        {/* Cuando el rol sea admin, lo mandará acá al menu_admin */}
        <Route path="/admin" element={<MenuAdmin />}>
          
          {/* El index hace que esta sea la página predeterminada que se abre junto con el menú */}
          <Route index element={<HomeAdmin />} /> 
          
          {/* las otras opciones del menú del admin */}
          <Route path="visualizadores" element={<ListaVisualizadores />} />
          <Route path="crear-visualizador" element={<CrearVisualizador />} />
          {/*<Route path="cuenta" element={<CuentaAdmin />} />*/}
        </Route>

        {/* Cuando el rol sea visualizador, lo mandará acá */}
        <Route path="/teacher" element={<HomeTeacher />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;