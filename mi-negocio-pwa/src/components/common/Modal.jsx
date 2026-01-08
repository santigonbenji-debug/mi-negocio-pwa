// ============================================
// ¿QUÉ HACE ESTO?
// Ventana emergente sobre la pantalla
//
// ANALOGÍA:
// Como cuando llamas al cliente al mostrador - el resto
// del negocio se difumina y solo te enfocas en esa ventana
//
// USO:
// <Modal isOpen={abierto} onClose={() => setAbierto(false)} title="Título">
//   <p>Contenido del modal</p>
// </Modal>
// ============================================

import React from 'react'

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-lg' 
}) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro difuminado */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Ventana del modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl 
        ${maxWidth} w-full max-h-[90vh] overflow-y-auto
      `}>
        {/* Header con título y botón cerrar */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}