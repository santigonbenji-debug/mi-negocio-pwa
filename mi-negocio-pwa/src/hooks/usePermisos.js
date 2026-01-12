import { useAuthStore } from '../store/authStore'

export const usePermisos = () => {
  const user = useAuthStore(state => state.user)

  // Si no hay usuario, no tiene permisos
  if (!user) {
    return {
      esAdmin: false,
      esEmpleado: false,
      puedeVerInventario: false,
      puedeVerCaja: false,
      puedeVerReportes: false,
      puedeVerUsuarios: false,
      puedeHacerVentas: false,
      puedeVerFiados: false
    }
  }

  const esAdmin = user.rol === 'admin'
  const esEmpleado = user.rol === 'empleado'

  return {
    esAdmin,
    esEmpleado,
    
    // Inventario: Solo admin
    puedeVerInventario: esAdmin,
    puedeModificarInventario: esAdmin,
    puedeEliminarProductos: esAdmin,
    
    // Caja: Solo admin
    puedeVerCaja: esAdmin,
    puedeAbrirCaja: esAdmin,
    puedeCerrarCaja: esAdmin,
    
    // Reportes: Solo admin
    puedeVerReportes: esAdmin,
    
    // Usuarios: Solo admin
    puedeVerUsuarios: esAdmin,
    
    // Ventas: Todos
    puedeHacerVentas: true,
    
    // Fiados: Todos
    puedeVerFiados: true
  }
}

// USO:
// const { esAdmin, puedeVerInventario } = usePermisos()
// if (puedeVerInventario) { ... }