// src/utils/licencias.js
import { supabase } from '../services/supabase'

/**
 * Utilidades para gestión de licencias
 */
export const licenciasUtils = {
  /**
   * Verifica el estado de licencia de un negocio
   * @param {string} negocioId - UUID del negocio
   * @returns {Object} { activa, diasRestantes, fechaExpiracion, expirado }
   */
  async verificarLicencia(negocioId) {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('expira')
        .eq('id', negocioId)
        .single()
      
      if (error) {
        console.error('Error verificando licencia:', error)
        return { activa: false, diasRestantes: 0, expirado: true }
      }
      
      if (!data || !data.expira) {
        return { activa: false, diasRestantes: 0, expirado: true }
      }
      
      const ahora = new Date()
      const expiracion = new Date(data.expira)
      const diferenciaMilisegundos = expiracion - ahora
      const diasRestantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24))
      
      return {
        activa: diasRestantes > 0,
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        fechaExpiracion: expiracion,
        expirado: diasRestantes <= 0
      }
    } catch (err) {
      console.error('Error en verificarLicencia:', err)
      return { activa: false, diasRestantes: 0, expirado: true }
    }
  },

  /**
   * Obtiene mensaje de aviso según días restantes
   * @param {number} diasRestantes - Días que quedan de licencia
   * @returns {Object|null} { tipo, titulo, mensaje, urgencia } o null si no hay que mostrar aviso
   */
  getMensajeAviso(diasRestantes) {
    if (diasRestantes <= 0) {
      return {
        tipo: 'expirado',
        titulo: '😊 ¡Tu prueba ha finalizado!',
        mensaje: '¿Te gustó Mi Negocio? Contactanos para continuar usando todas las funcionalidades.',
        accion: 'Contactar',
        urgencia: 'critica'
      }
    } else if (diasRestantes === 1) {
      return {
        tipo: 'aviso',
        titulo: '⚠️ Último día de prueba',
        mensaje: 'Mañana expira tu período de prueba. ¡Contactanos hoy para no perder acceso!',
        accion: 'Renovar ahora',
        urgencia: 'alta'
      }
    } else if (diasRestantes <= 3) {
      return {
        tipo: 'aviso',
        titulo: `⏰ Quedan solo ${diasRestantes} días`,
        mensaje: `Tu prueba termina pronto. ¡Asegurá tu acceso contactándonos!`,
        accion: 'Renovar',
        urgencia: 'media'
      }
    } else if (diasRestantes <= 7) {
      return {
        tipo: 'info',
        titulo: '🎉 Aprovechá tu semana gratis',
        mensaje: `Te quedan ${diasRestantes} días de prueba. ¡Seguí explorando todas las funciones!`,
        accion: null,
        urgencia: 'baja'
      }
    }
    
    // Si tiene más de 7 días, no mostrar nada
    return null
  },

  /**
   * Formatea la fecha de expiración de forma amigable
   * @param {Date} fecha - Fecha de expiración
   * @returns {string} Texto formateado
   */
  formatearFechaExpiracion(fecha) {
    if (!fecha) return 'Sin fecha'
    
    const opciones = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    
    return new Intl.DateTimeFormat('es-AR', opciones).format(fecha)
  },

  /**
   * Obtiene configuración de contacto para renovación
   * @returns {Object} { whatsapp, email, mensaje }
   */
  getContactoRenovacion() {
    return {
      whatsapp: '5492657392998', // ⚠️ REEMPLAZAR CON TU NÚMERO
      email: 'santisbg9@gmail.com', // ⚠️ REEMPLAZAR CON TU EMAIL
      mensaje: '¡Hola! Me interesa renovar mi licencia de Mi Negocio. ¿Cuál es el costo?'
    }
  }
}