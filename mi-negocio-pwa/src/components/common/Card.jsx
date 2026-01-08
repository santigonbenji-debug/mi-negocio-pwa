// ============================================
// ¿QUÉ HACE ESTO?
// Tarjeta blanca con sombra para organizar contenido
//
// ANALOGÍA:
// Como las vitrinas de tu negocio - cada una muestra
// un producto de forma organizada y bonita
//
// USO:
// <Card>
//   <h2>Título</h2>
//   <p>Contenido</p>
// </Card>
// ============================================

import React from 'react'

export const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  ...props 
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-md hover:shadow-lg
        transition-shadow duration-200 
        ${padding} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}