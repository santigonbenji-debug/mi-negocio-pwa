import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
import { Configuracion } from './pages/Configuracion'
import { Inventario } from './pages/Inventario'
import { Caja } from './pages/Caja'
import { PuntoVenta } from './pages/PuntoVenta'
import { Fiados } from './pages/Fiados'
import { Reportes } from './pages/Reportes'
import { Dashboard } from './pages/Dashboard'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { Usuarios } from './pages/Usuarios'
import { RequireAdmin } from './components/common/RequireAdmin'
function App() {
  const { user, loading, inicializar } = useAuthStore()

  useEffect(() => {
    inicializar()
  }, [inicializar])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-xl text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Rutas públicas */}
        <Route 
  path="/login" 
  element={!user ? <Login /> : <Navigate to="/dashboard" />} 
/>
<Route 
  path="/registro" 
  element={!user ? <Registro /> : <Navigate to="/dashboard" />} 
/>
        
        {/* Rutas protegidas */}
        <Route 
  path="/dashboard" 
  element={user ? <Dashboard /> : <Navigate to="/login" />} 
/>
<Route path="/configuracion" element={user ? <Configuracion /> : <Navigate to="/login" />} />
        <Route 
          path="/ventas" 
          element={user ? <PuntoVenta /> : <Navigate to="/login" />} 
        />
        {/* CAJA - Solo Admin */}
<Route 
  path="/caja" 
  element={
    user ? (
      <RequireAdmin>
        <Caja />
      </RequireAdmin>
    ) : (
      <Navigate to="/login" />
    )
  } 
/>

{/* INVENTARIO - Solo Admin */}
<Route 
  path="/inventario" 
  element={
    user ? (
      <RequireAdmin>
        <Inventario />
      </RequireAdmin>
    ) : (
      <Navigate to="/login" />
    )
  } 
/>

{/* FIADOS - Todos */}
<Route 
  path="/fiados" 
  element={user ? <Fiados /> : <Navigate to="/login" />} 
/>

{/* REPORTES - Solo Admin */}
<Route 
  path="/reportes" 
  element={
    user ? (
      <RequireAdmin>
        <Reportes />
      </RequireAdmin>
    ) : (
      <Navigate to="/login" />
    )
  } 
/>

{/* USUARIOS - Solo Admin */}
<Route 
  path="/usuarios" 
  element={
    user ? (
      <RequireAdmin>
        <Usuarios />
      </RequireAdmin>
    ) : (
      <Navigate to="/login" />
    )
  } 
/>
        {/* Ruta por defecto */}
        <Route 
  path="/" 
  element={<Navigate to={user ? "/dashboard" : "/login"} />} 
/>
      </Routes>
    </BrowserRouter>
  )
}

export default App