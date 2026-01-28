// ============================================
// ¿QUÉ HACE ESTO?
// Guarda las estadísticas y datos del dashboard
//
// ANALOGÍA:
// Como tener un informe ejecutivo que se actualiza
// automáticamente con los números del negocio
//
// USO:
// const { resumen, ventasPorDia, cargarDatos } = useDashboardStore()
// ============================================

import { create } from 'zustand'
import { reportesService } from '../services/reportes'

export const useDashboardStore = create((set, get) => ({
  resumen: null,
  ventasPorDia: [],
  productosMasVendidos: [],
  ventasPorMetodoPago: [],
  ventasKgHoy: [],
  cargando: false,

  // Cargar todos los datos del dashboard
  cargarDatos: async (negocioId) => {
    set({ cargando: true })
    try {
      const [resumen, ventasPorDia, productosMasVendidos, ventasPorMetodoPago, ventasKgHoy] = await Promise.all([
        reportesService.resumenGeneral(negocioId),
        reportesService.ventasPorDia(negocioId, 7),
        reportesService.productosMasVendidos(negocioId, 5),
        reportesService.ventasPorMetodoPago(negocioId),
        reportesService.ventasKgHoy(negocioId)
      ])

      set({
        resumen,
        ventasPorDia,
        productosMasVendidos,
        ventasPorMetodoPago,
        ventasKgHoy,
        cargando: false
      })
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
      set({ cargando: false })
    }
  },

  // Refrescar solo el resumen (más rápido)
  refrescarResumen: async (negocioId) => {
    try {
      const resumen = await reportesService.resumenGeneral(negocioId)
      set({ resumen })
    } catch (error) {
      console.error('Error al refrescar resumen:', error)
    }
  },

  // Limpiar store
  limpiar: () => {
    set({
      resumen: null,
      ventasPorDia: [],
      productosMasVendidos: [],
      ventasPorMetodoPago: [],
      ventasKgHoy: []
    })
  }
}))