import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useLicencia } from '../hooks/useLicencia'

const LicenciaContext = createContext()

export const LicenciaProvider = ({ children }) => {
  const { user } = useAuthStore()
  const licencia = useLicencia()
  const [modoSoloLectura, setModoSoloLectura] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Abrir modal automáticamente cuando expira
  useEffect(() => {
    if (user && licencia.expirado && !modoSoloLectura) {
      setModalAbierto(true)
    }
  }, [user, licencia.expirado, modoSoloLectura])

  const value = {
    // Estado de licencia
    ...licencia,
    
    // Modo solo lectura
    modoSoloLectura,
    activarModoSoloLectura: () => {
      setModoSoloLectura(true)
      setModalAbierto(false)
    },
    
    // Control del modal
    modalAbierto,
    abrirModal: () => setModalAbierto(true),
    cerrarModal: () => setModalAbierto(false),
    
    // Helpers
    puedeEditar: !modoSoloLectura && licencia.activa,
    puedeVender: !modoSoloLectura && licencia.activa,
    puedeEliminar: !modoSoloLectura && licencia.activa
  }

  return (
    <LicenciaContext.Provider value={value}>
      {children}
    </LicenciaContext.Provider>
  )
}

// Hook para usar el contexto
export const useLicenciaContext = () => {
  const context = useContext(LicenciaContext)
  
  if (!context) {
    throw new Error('useLicenciaContext debe usarse dentro de LicenciaProvider')
  }
  
  return context
}