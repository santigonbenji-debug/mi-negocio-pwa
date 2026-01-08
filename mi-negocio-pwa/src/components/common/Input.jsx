// ============================================
// ¿QUÉ HACE ESTO?
// Campo de texto con etiqueta y mensajes de error
//
// ANALOGÍA:
// Como una ficha de cliente donde escribes datos:
// tiene título (nombre, teléfono) y te avisa si falta algo
//
// USO:
// <Input 
//   label="Nombre del producto" 
//   value={nombre} 
//   onChange={e => setNombre(e.target.value)}
//   error="Este campo es obligatorio"
// />
// ============================================

import React from 'react'

export const Input = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 border-2 border-gray-200 rounded-lg
          focus:border-primary focus:ring-2 focus:ring-primary/20
          outline-none transition-all
          ${error ? 'border-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-danger text-sm mt-1">{error}</p>
      )}
    </div>
  )
}