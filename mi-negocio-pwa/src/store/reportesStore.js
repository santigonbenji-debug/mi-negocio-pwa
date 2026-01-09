// ============================================
// ¿QUÉ HACE ESTO?
// Maneja el estado de los reportes históricos
//
// FUNCIONALIDADES:
// - Filtros por fecha (inicio/fin)
// - Botones rápidos (Hoy/Semana/Mes)
// - Datos de cajas, ventas y análisis
// - Cambio entre pestañas
// ============================================

import { create } from 'zustand'
import { reportesService } from '../services/reportes'

// Función helper para calcular rangos de fecha
const calcularRango = (tipo) => {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999) // Fin del día
  
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0) // Inicio del día

  switch (tipo) {
    case 'hoy':
      return { inicio, fin: hoy }
    
    case 'semana':
      inicio.setDate(inicio.getDate() - 7)
      return { inicio, fin: hoy }
    
    case 'mes':
      inicio.setDate(inicio.getDate() - 30)
      return { inicio, fin: hoy }
    
    default:
      return { inicio, fin: hoy }
  }
}

export const useReportesStore = create((set, get) => ({
  // Filtros
  fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7)), // Última semana por defecto
  fechaFin: new Date(),
  rangoActivo: 'semana',
  
  // Pestaña activa
  pestanaActiva: 'cajas', // 'cajas' | 'ventas' | 'analisis'
  
  // Datos
  cajas: [],
  movimientosCajaSeleccionada: [],
  cajaSeleccionada: null,
  ventas: [],
  totales: null,
  productosMasVendidos: [],
  ventasPorDia: [],
  
  // Estados
  cargando: false,
  filtroMetodoPago: null, // Para filtrar ventas
  
  // Cambiar pestaña
  setPestana: (pestana) => {
    set({ pestanaActiva: pestana })
  },
  
  // Establecer rango rápido
  setRangoRapido: (tipo) => {
    const { inicio, fin } = calcularRango(tipo)
    set({ 
      fechaInicio: inicio, 
      fechaFin: fin,
      rangoActivo: tipo
    })
  },
  
  // Establecer fechas personalizadas
  setFechasPersonalizadas: (inicio, fin) => {
    set({ 
      fechaInicio: inicio, 
      fechaFin: fin,
      rangoActivo: 'personalizado'
    })
  },
  
  // Cargar datos de cajas
  cargarCajas: async (negocioId) => {
    set({ cargando: true })
    try {
      const { fechaInicio, fechaFin } = get()
      const cajas = await reportesService.cajasEnPeriodo(
        negocioId,
        fechaInicio.toISOString(),
        fechaFin.toISOString()
      )
      set({ cajas, cargando: false })
    } catch (error) {
      console.error('Error al cargar cajas:', error)
      set({ cargando: false })
    }
  },
  
  // Seleccionar caja y cargar movimientos
  seleccionarCaja: async (caja) => {
    set({ cargando: true, cajaSeleccionada: caja })
    try {
      const movimientos = await reportesService.movimientosDeCaja(caja.id)
      set({ movimientosCajaSeleccionada: movimientos, cargando: false })
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      set({ cargando: false })
    }
  },
  
  cerrarDetalleCaja: () => {
    set({ cajaSeleccionada: null, movimientosCajaSeleccionada: [] })
  },
  
  // Cargar datos de ventas
  cargarVentas: async (negocioId) => {
    set({ cargando: true })
    try {
      const { fechaInicio, fechaFin, filtroMetodoPago } = get()
      
      const [ventas, totales] = await Promise.all([
        reportesService.ventasEnPeriodo(
          negocioId,
          fechaInicio.toISOString(),
          fechaFin.toISOString(),
          filtroMetodoPago
        ),
        reportesService.totalesEnPeriodo(
          negocioId,
          fechaInicio.toISOString(),
          fechaFin.toISOString()
        )
      ])
      
      set({ ventas, totales, cargando: false })
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      set({ cargando: false })
    }
  },
  
  // Cambiar filtro de método de pago
  setFiltroMetodoPago: (metodo) => {
    set({ filtroMetodoPago: metodo })
  },
  
  // Cargar datos de análisis
  cargarAnalisis: async (negocioId) => {
    set({ cargando: true })
    try {
      const { fechaInicio, fechaFin } = get()
      
      const [productosMasVendidos, ventasPorDia, totales] = await Promise.all([
        reportesService.productosMasVendidosPeriodo(
          negocioId,
          fechaInicio.toISOString(),
          fechaFin.toISOString(),
          10
        ),
        reportesService.ventasPorDiaPeriodo(
          negocioId,
          fechaInicio.toISOString(),
          fechaFin.toISOString()
        ),
        reportesService.totalesEnPeriodo(
          negocioId,
          fechaInicio.toISOString(),
          fechaFin.toISOString()
        )
      ])
      
      set({ 
        productosMasVendidos, 
        ventasPorDia,
        totales,
        cargando: false 
      })
    } catch (error) {
      console.error('Error al cargar análisis:', error)
      set({ cargando: false })
    }
  },
  
  // Limpiar store
  limpiar: () => {
    set({
      cajas: [],
      movimientosCajaSeleccionada: [],
      cajaSeleccionada: null,
      ventas: [],
      totales: null,
      productosMasVendidos: [],
      ventasPorDia: [],
      filtroMetodoPago: null
    })
  }
}))