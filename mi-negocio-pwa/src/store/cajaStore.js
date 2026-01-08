// ============================================
// ¿QUÉ HACE ESTO?
// Guarda el estado actual de la caja
//
// ANALOGÍA:
// Como tener un cartel visible que dice:
// - ¿Hay caja abierta? Sí/No
// - Monto inicial: $100
// - Monto esperado: $350
// - Movimientos del día
//
// USO:
// const { cajaActual, abrirCaja, registrarMovimiento } = useCajaStore()
// ============================================

import { create } from 'zustand'
import { cajaService } from '../services/caja'

export const useCajaStore = create((set, get) => ({
  cajaActual: null,
  movimientos: [],
  historial: [],
  cargando: false,

  // Verificar si hay caja abierta
  verificarCajaAbierta: async (negocioId) => {
    set({ cargando: true })
    try {
      const caja = await cajaService.cajaAbierta(negocioId)
      set({ cajaActual: caja, cargando: false })
      
      if (caja) {
        // Cargar movimientos
        const movimientos = await cajaService.obtenerMovimientos(caja.id)
        set({ movimientos })
      }
      
      return caja
    } catch (error) {
      console.error('Error al verificar caja:', error)
      set({ cargando: false })
      return null
    }
  },

  // Abrir nueva caja
  abrirCaja: async (negocioId, usuarioId, montoInicial) => {
    const caja = await cajaService.abrirCaja(negocioId, usuarioId, montoInicial)
    set({ cajaActual: caja, movimientos: [] })
    return caja
  },

  // Registrar movimiento
  registrarMovimiento: async (tipo, monto, concepto, ventaId = null) => {
    const { cajaActual } = get()
    if (!cajaActual) throw new Error('No hay caja abierta')
    
    const movimiento = await cajaService.registrarMovimiento(
      cajaActual.id,
      tipo,
      monto,
      concepto,
      ventaId
    )
    
    // Actualizar movimientos y caja
    set({ movimientos: [movimiento, ...get().movimientos] })
    await get().verificarCajaAbierta(cajaActual.negocio_id)
    
    return movimiento
  },

  // Cerrar caja
  cerrarCaja: async (montoReal, observaciones) => {
    const { cajaActual } = get()
    if (!cajaActual) throw new Error('No hay caja abierta')
    
    const cajaFinal = await cajaService.cerrarCaja(
      cajaActual.id,
      montoReal,
      observaciones
    )
    
    set({ cajaActual: null, movimientos: [] })
    return cajaFinal
  },

  // Cargar historial
  cargarHistorial: async (negocioId, limite = 10) => {
    const historial = await cajaService.obtenerHistorial(negocioId, limite)
    set({ historial })
  },

  // Limpiar store
  limpiar: () => {
    set({ cajaActual: null, movimientos: [], historial: [] })
  }
}))