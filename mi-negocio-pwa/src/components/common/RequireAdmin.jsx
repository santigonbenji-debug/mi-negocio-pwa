import { Navigate } from 'react-router-dom'
import { usePermisos } from '../../hooks/usePermisos'

export const RequireAdmin = ({ children }) => {
  const { esAdmin } = usePermisos()

  if (!esAdmin) {
    // Si no es admin, redirigir a ventas
    return <Navigate to="/ventas" replace />
  }

  return children
}

// USO en rutas:
// <Route path="/inventario" element={<RequireAdmin><Inventario /></RequireAdmin>} />