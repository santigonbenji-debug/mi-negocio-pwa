// src/hooks/useLicencia.js
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { licenciasUtils } from '../utils/licencias'
import toast from 'react-hot-toast'

/**
 * Hook para gestionar el estado de licencia del negocio actual
 * @returns {Object} { activa, diasRestantes, expirado, cargando, verificar }
 */
export const useLicencia = () => {
  const user = useAuthStore(state => state.user)
  
  const [licencia, setLicencia] = useState({
    activa: true,
    diasRestantes: 15,
    fechaExpiracion: null,
    expirado: false,
    cargando: true
  })
  
  const [avisoMostrado, setAvisoMostrado] = useState(false)

  // Función para verificar licencia
  const verificar = async () => {
    if (!user?.negocio_id) {
      setLicencia({
        activa: false,
        diasRestantes: 0,
        fechaExpiracion: null,
        expirado: true,
        cargando: false
      })
      return
    }

    try {
      const resultado = await licenciasUtils.verificarLicencia(user.negocio_id)
      
      setLicencia({
        ...resultado,
        cargando: false
      })
      
      // Mostrar aviso automático solo una vez
      if (!avisoMostrado && resultado.diasRestantes <= 7) {
        const mensaje = licenciasUtils.getMensajeAviso(resultado.diasRestantes)
        
        if (mensaje && mensaje.urgencia !== 'critica') {
          // No mostrar modal de expirado, solo toast de aviso
          toast(mensaje.mensaje, {
            icon: mensaje.urgencia === 'alta' ? '⚠️' : 
                  mensaje.urgencia === 'media' ? '⏰' : '🎉',
            duration: mensaje.urgencia === 'alta' ? 8000 : 
                     mensaje.urgencia === 'media' ? 6000 : 4000,
            position: 'top-center',
            style: {
              maxWidth: '500px'
            }
          })
          
          setAvisoMostrado(true)
        }
      }
      
      return resultado
    } catch (error) {
      console.error('Error verificando licencia:', error)
      setLicencia({
        activa: false,
        diasRestantes: 0,
        fechaExpiracion: null,
        expirado: true,
        cargando: false
      })
    }
  }

  // Verificar al montar y cuando cambia el usuario
  useEffect(() => {
    verificar()
    
    // Verificar cada hora
    const intervalo = setInterval(verificar, 60 * 60 * 1000)
    
    return () => clearInterval(intervalo)
  }, [user?.negocio_id])

  return {
    ...licencia,
    verificar, // Exponer función para forzar verificación manual
    mensaje: licenciasUtils.getMensajeAviso(licencia.diasRestantes)
  }
}