// ============================================
// ¿QUÉ HACE ESTO?
// Etiqueta pequeña de colores para estados
//
// ANALOGÍA:
// Como las pegatinas que pones en productos:
// "NUEVO", "OFERTA", "STOCK BAJO", "VENDIDO"
//
// USO:
// <Badge variant="success">Activo</Badge>
// <Badge variant="danger">Stock bajo</Badge>
// <Badge variant="warning">Pendiente</Badge>
// ============================================

import React from 'react'

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    primary: 'bg-purple-100 text-primary dark:bg-purple-500/20 dark:text-purple-300'
  }

  return (
    <span className={`
      inline-flex items-center px-3 py-1 
      rounded-full text-xs font-semibold
      ${variants[variant]}
    `}>
      {children}
    </span>
  )
}