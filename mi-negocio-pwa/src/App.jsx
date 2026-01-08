import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
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
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/registro" 
          element={!user ? <Registro /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={user ? (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">
                  ✅ ¡Dashboard Próximamente!
                </h1>
                <p className="text-gray-600 mb-6">
                  Usuario: {user.email}
                </p>
                <button
                  onClick={() => useAuthStore.getState().logout()}
                  className="bg-danger text-white px-6 py-3 rounded-lg hover:bg-red-600"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : <Navigate to="/login" />} 
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