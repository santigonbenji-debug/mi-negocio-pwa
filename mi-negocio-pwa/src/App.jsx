import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
import { Inventario } from './pages/Inventario'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

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
          element={!user ? <Login /> : <Navigate to="/inventario" />} 
        />
        <Route 
          path="/registro" 
          element={!user ? <Registro /> : <Navigate to="/inventario" />} 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/inventario" 
          element={user ? <Inventario /> : <Navigate to="/login" />} 
        />
        
        {/* Ruta por defecto */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/inventario" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App