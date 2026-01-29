import React, { useState, useEffect } from 'react'
import { Button } from './Button'

const WELCOME_VERSION = 'v2.0-enero-2026'

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const visto = localStorage.getItem('welcome_seen')
    if (visto !== WELCOME_VERSION) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('welcome_seen', WELCOME_VERSION)
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-primary to-purple-600 p-8 text-center text-white">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-black">¡Subimos de nivel!</h2>
          <p className="text-white/80 text-sm mt-2">Tu app tiene novedades</p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-center">
            Hicimos muchas mejoras para que tu experiencia sea más fácil y rápida.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-2xl">🌙</span>
              <div>
                <p className="font-bold text-sm dark:text-white">Modo Oscuro Mejorado</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Todo se ve mejor de noche</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-bold text-sm dark:text-white">Diseño Mobile Renovado</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Botones más accesibles</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-2xl">❓</span>
              <div>
                <p className="font-bold text-sm dark:text-white">Guías en cada sección</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toca el botón "?" para ayuda rápida</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            No te preocupes, todo funciona igual que antes, ¡solo mejor!
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button onClick={handleClose} className="w-full py-4 text-lg font-black">
            ¡Entendido! 👍
          </Button>
        </div>
      </div>
    </div>
  )
}
