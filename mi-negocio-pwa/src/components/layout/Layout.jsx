import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePermisos } from '../../hooks/usePermisos'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../common/Button'
import { WelcomeModal } from '../common/WelcomeModal'
import { supabase } from '../../services/supabase'

export const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { esAdmin } = usePermisos()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const [userData, setUserData] = useState(null)
  const activeMenuRef = useRef(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (user?.id) {
      cargarDatosUsuario()
    }
  }, [user])

  // Scroll automático al elemento activo del menú móvil
  useEffect(() => {
    if (activeMenuRef.current) {
      activeMenuRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [location.pathname])

  const cargarDatosUsuario = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Obtener nombre del negocio por separado
      const { data: negocioData } = await supabase
        .from('negocios')
        .select('nombre')
        .eq('id', userData.negocio_id)
        .single()

      const data = {
        ...userData,
        negocios: negocioData
      }


      setUserData(data)
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/dashboard', label: 'Mi Negocio', icon: '📊', adminOnly: true },
    { path: '/ventas', label: 'Vender', icon: '🛒' },
    { path: '/caja', label: 'Caja', icon: '💰', adminOnly: true },
    { path: '/inventario', label: 'Productos', icon: '📦', adminOnly: true },
    { path: '/fiados', label: 'Clientes', icon: '📒' },
    { path: '/reportes', label: 'Balance', icon: '📈', adminOnly: true },
    { path: '/usuarios', label: 'Personal', icon: '👥', adminOnly: true },
    { path: '/configuracion', label: 'Config', icon: '⚙️', adminOnly: true },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1
                className="text-xl sm:text-2xl font-black text-primary cursor-pointer max-w-none"
                onClick={() => navigate('/dashboard')}
              >
                🏪 Mi Negocio
              </h1>

              <div className="hidden md:flex space-x-1">
                {menuItems
                  .filter(item => !item.adminOnly || esAdmin)
                  .map(item => {
                    const isActive = location.pathname === item.path
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
                          ${isActive
                            ? 'bg-primary text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Toggle Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:ring-2 hover:ring-primary transition-all"
                title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {userData?.nombre || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userData?.negocios?.nombre || 'Mi Negocio'}
                </p>
              </div>
              <Button variant="danger" onClick={handleLogout} className="text-sm py-2">
                Salir
              </Button>
            </div>
          </div>

          <div className="md:hidden pb-3 flex space-x-3 overflow-x-auto scrollbar-hide -mx-2 px-4 shadow-inner dark:shadow-none bg-gray-50 dark:bg-gray-800/50 py-2">
            {menuItems
              .filter(item => !item.adminOnly || esAdmin)
              .map(item => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    ref={isActive ? activeMenuRef : null}
                    onClick={() => navigate(item.path)}
                    className={`
                      px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-sm flex items-center gap-2 border flex-shrink-0
                      ${isActive
                        ? 'bg-primary text-white shadow-md border-primary scale-105 transform'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <WelcomeModal />
    </div>
  )
}
