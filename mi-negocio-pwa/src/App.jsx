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
import { Usuarios } from './pages/Usuarios'
import { RequireAdmin } from './components/common/RequireAdmin'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { LicenciaProvider, useLicenciaContext } from './contexts/LicenciaContext'
import { ModalLicenciaExpirada } from './components/common/ModalLicenciaExpirada'
import { BadgeLicencia } from './components/common/BadgeLicencia'
import { Admin } from './pages/Admin'
import { useEmailVerification } from './hooks/useEmailVerification'
import { EmailVerificationPending } from './components/auth/EmailVerificationPending'
function App() {
  const { user, loading, inicializar, logout } = useAuthStore()
  const { emailVerified, checking } = useEmailVerification(user)

  useEffect(() => {
    inicializar()
  }, [])

  // Mostrar loading mientras se verifica auth o email
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si hay usuario pero email NO verificado -> mostrar pantalla de verificacion
  if (user && !emailVerified) {
    return (
      <>
        <Toaster position="top-right" />
        <EmailVerificationPending
          email={user.email}
          onLogout={logout}
        />
      </>
    )
  }

  return (
    <LicenciaProvider>
      <AppContent user={user} />
    </LicenciaProvider>
  )
}

// Componente separado que usa el context
function AppContent({ user }) {
  const { 
    expirado, 
    diasRestantes, 
    cargando: cargandoLicencia,
    modoSoloLectura,
    modalAbierto,
    activarModoSoloLectura
  } = useLicenciaContext()
  // Si la licencia expiró y no está en modo solo lectura, mostrar modal
  if (user && expirado && !modoSoloLectura && !cargandoLicencia) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Toaster position="top-right" />
        <ModalLicenciaExpirada
          isOpen={modalAbierto}
          diasRestantes={diasRestantes}
          onVerHistorial={activarModoSoloLectura}
          onCerrar={null}
        />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      
      {/* Badge de licencia en todas las páginas autenticadas */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <BadgeLicencia />
        </div>
      )}

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

        {/* Rutas protegidas - Todos los usuarios */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/configuracion" 
          element={user ? <Configuracion /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/ventas" 
          element={user ? <PuntoVenta /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/fiados" 
          element={user ? <Fiados /> : <Navigate to="/login" />} 
        />

        {/* Rutas protegidas - Solo Admin */}
        <Route 
          path="/caja" 
          element={user ? <RequireAdmin><Caja /></RequireAdmin> : <Navigate to="/login" />} 
        />
        <Route 
          path="/inventario" 
          element={user ? <RequireAdmin><Inventario /></RequireAdmin> : <Navigate to="/login" />} 
        />
        <Route 
          path="/reportes" 
          element={user ? <RequireAdmin><Reportes /></RequireAdmin> : <Navigate to="/login" />} 
        />
        <Route 
          path="/usuarios" 
          element={user ? <RequireAdmin><Usuarios /></RequireAdmin> : <Navigate to="/login" />} 
        />
{/* Ruta de administración del sistema */}
<Route 
  path="/admin" 
  element={user ? <Admin /> : <Navigate to="/login" />} 
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
