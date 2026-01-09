// ============================================
// ¿QUÉ HACE ESTO?
// Guarda los clientes fiados en memoria
//
// ANALOGÍA:
// Como tener el cuaderno de fiados siempre visible:
// - Lista de todos los clientes
// - Sus deudas actualizadas
// - Historial de movimientos
//
// USO:
// const { clientes, cargarClientes, registrarPago } = useFiadosStore()
// ============================================

import { create } from 'zustand'
import { fiadosService } from '../services/fiados'

export const useFiadosStore = create((set, get) => ({
  clientes: [],
  clienteActual: null,
  movimientos: [],
  estadisticas: null,
  cargando: false,

  // Cargar todos los clientes
  cargarClientes: async (negocioId) => {
    set({ cargando: true })
    try {
      const clientes = await fiadosService.obtenerTodos(negocioId)
      set({ clientes, cargando: false })
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      set({ cargando: false })
    }
  },

  // Seleccionar cliente para ver detalle
  seleccionarCliente: async (fiadoId) => {
    set({ cargando: true })
    try {
      const cliente = await fiadosService.obtenerPorId(fiadoId)
      const movimientos = await fiadosService.obtenerMovimientos(fiadoId)
      set({ clienteActual: cliente, movimientos, cargando: false })
    } catch (error) {
      console.error('Error al cargar cliente:', error)
      set({ cargando: false })
    }
  },

  // Registrar pago
  registrarPago: async (fiadoId, monto, descripcion) => {
    await fiadosService.registrarPago(fiadoId, monto, descripcion)
    
    // Recargar datos
    await get().seleccionarCliente(fiadoId)
    
    // Actualizar lista de clientes
    const clienteActualizado = await fiadosService.obtenerPorId(fiadoId)
    set({
      clientes: get().clientes.map(c => 
        c.id === fiadoId ? clienteActualizado : c
      )
    })
  },

  // Crear nuevo cliente
  crearCliente: async (negocioId, nombre, telefono) => {
    const nuevo = await fiadosService.crear(negocioId, nombre, telefono)
    set({ clientes: [nuevo, ...get().clientes] })
    return nuevo
  },

  // Actualizar cliente
  actualizarCliente: async (fiadoId, datos) => {
    const actualizado = await fiadosService.actualizar(fiadoId, datos)
    set({
      clientes: get().clientes.map(c => c.id === fiadoId ? actualizado : c),
      clienteActual: get().clienteActual?.id === fiadoId ? actualizado : get().clienteActual
    })
    return actualizado
  },

  // Eliminar cliente
  eliminarCliente: async (fiadoId) => {
    await fiadosService.eliminar(fiadoId)
    set({
      clientes: get().clientes.filter(c => c.id !== fiadoId),
      clienteActual: null
    })
  },

  // Cargar estadísticas
  cargarEstadisticas: async (negocioId) => {
    try {
      const estadisticas = await fiadosService.obtenerEstadisticas(negocioId)
      set({ estadisticas })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  },

  // Limpiar selección
  limpiarSeleccion: () => {
    set({ clienteActual: null, movimientos: [] })
  },

  // Limpiar store
  limpiar: () => {
    set({ 
      clientes: [], 
      clienteActual: null, 
      movimientos: [], 
      estadisticas: null 
    })
  }
}))