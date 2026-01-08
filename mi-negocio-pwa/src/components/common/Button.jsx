// ============================================
// ¿QUÉ HACE ESTO?
// Botón reutilizable con diferentes estilos y animaciones
//
// ANALOGÍA:
// Como tener un botón de "Cobrar" que cambia de color
// según sea una venta normal (morado) o una devolución (rojo)
//
// USO:
// <Button variant="primary" onClick={guardar}>Guardar</Button>
// <Button variant="success">Confirmar</Button>
// <Button variant="danger">Eliminar</Button>
// ============================================

import React from 'react'

export const Button = ({ 
  children, 
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    success: 'bg-success hover:bg-green-600 text-white',
    danger: 'bg-danger hover:bg-red-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        px-6 py-3 rounded-button font-semibold
        transition-all duration-200
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}