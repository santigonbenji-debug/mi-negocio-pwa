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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          focus:border-primary dark:focus:border-primary-light focus:ring-2 focus:ring-primary/20
          outline-none transition-all
          ${error ? 'border-danger dark:border-danger' : ''}
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