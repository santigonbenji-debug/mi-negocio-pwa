// ============================================
// ¿QUÉ HACE ESTO?
// Layout principal con navegación compartida
//
// ANALOGÍA:
// Como tener un letrero en tu negocio que siempre
// muestra las secciones: Ventas | Caja | Inventario
//
// USO:
// <Layout>
//   <ContenidoDeLaPagina />
// </Layout>
// ============================================

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../common/Button'

export const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userData, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

const menuItems = [
  { path: '/dashboard', label: '📊 Dashboard', icon: '📊' },
  { path: '/ventas', label: '🛒 Ventas', icon: '🛒' },
  { path: '/caja', label: '💰 Caja', icon: '💰' },
  { path: '/inventario', label: '📦 Inventario', icon: '📦' },
  { path: '/fiados', label: '📝 Fiados', icon: '📝' }
]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>
                🏪 Mi Negocio
              </h1>

              {/* Menu Items - Desktop */}
              <div className="hidden md:flex space-x-1">
                {menuItems.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`
                        px-4 py-2 rounded-lg font-semibold transition-all
                        ${isActive 
                          ? 'bg-primary text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {userData?.nombre || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {userData?.negocios?.nombre || 'Mi Negocio'}
                </p>
              </div>
              <Button variant="danger" onClick={handleLogout} className="text-sm py-2">
                Salir
              </Button>
            </div>
          </div>

          {/* Menu Items - Mobile */}
          <div className="md:hidden pb-3 flex space-x-1 overflow-x-auto">
            {menuItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}