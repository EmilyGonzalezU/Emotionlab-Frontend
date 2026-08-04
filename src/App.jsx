import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// importamos las rutas de nuestro proyecto, en este caso las vistas
import Login from './pages/login.jsx'; 
import HomeAdmin from './pages/vista_admin/home_admin.jsx';
import HomeTeacher from './pages/vista_visor/home_visor.jsx';

function App() {
  return (
    // con el browserrouter hacemos que las rutas funcionen en todo el docu
    <BrowserRouter>
      <Routes>
        {/* La ruta inicial es el Login, los q ejecuten el proyecto deberian ver esta pagina de inicio */}
        <Route path="/" element={<Login />} />
        
        {/* Cuando el rol sea admin, lo mandará acá */}
        <Route path="/admin" element={<HomeAdmin />} />

        {/* Cuando el rol sea visualizador, lo mandará acá */}
        <Route path="/teacher" element={<HomeAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;