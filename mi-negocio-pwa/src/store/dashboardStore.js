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
  desgloseGanancia: [],
  gananciaCategorias: [],
  periodosDisponibles: [],
  cargando: false,
  mesFiltro: new Date().getMonth(),
  anioFiltro: new Date().getFullYear(),

  // Cargar periodos disponibles
  cargarPeriodos: async (negocioId) => {
    try {
      const periodos = await reportesService.obtenerPeriodosVentas(negocioId)
      set({ periodosDisponibles: periodos })

      // Si hay periodos y no se ha seleccionado uno manualmente,
      // o el seleccionado no existe, tomar el más reciente
      if (periodos.length > 0) {
        const masReciente = periodos[0]
        set({
          mesFiltro: masReciente.mes,
          anioFiltro: masReciente.anio
        })
        return masReciente
      }
      return null
    } catch (error) {
      console.error('Error al cargar periodos:', error)
      return null
    }
  },

  // Cargar todos los datos del dashboard
  cargarDatos: async (negocioId, mes = null, anio = null) => {
    set({ cargando: true })
    const mesActual = mes !== null ? mes : get().mesFiltro
    const anioActual = anio !== null ? anio : get().anioFiltro

    set({ mesFiltro: mesActual, anioFiltro: anioActual })

    try {
      const [resumen, ventasPorDia, productosMasVendidos, ventasPorMetodoPago, ventasKgHoy, desgloseGanancia, gananciaCategorias] = await Promise.all([
        reportesService.resumenGeneral(negocioId, mesActual, anioActual),
        reportesService.ventasPorDia(negocioId, 30, mesActual, anioActual),
        reportesService.productosMasVendidos(negocioId, 5),
        reportesService.ventasPorMetodoPago(negocioId, mesActual, anioActual),
        reportesService.ventasKgHoy(negocioId, mesActual, anioActual),
        reportesService.obtenerDetalleGanancia(negocioId, mesActual, anioActual),
        reportesService.obtenerGananciaPorCategoria(negocioId, mesActual, anioActual)
      ])

      set({
        resumen,
        ventasPorDia,
        productosMasVendidos,
        ventasPorMetodoPago,
        ventasKgHoy,
        desgloseGanancia,
        gananciaCategorias,
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