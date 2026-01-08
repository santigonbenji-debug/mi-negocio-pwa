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
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-purple-100 text-primary'
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