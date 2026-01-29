// ============================================
// ¿QUÉ HACE ESTO?
// Guarda los productos en memoria (estado global)
//
// ANALOGÍA:
// Como tener una hoja de inventario actualizada:
// - Cualquier pantalla puede ver los productos
// - Cuando agregas uno, todos lo ven
// - Cuando cambias stock, se actualiza en todos lados
//
// USO:
// const { productos, cargarProductos, agregarProducto } = useProductosStore()
// await cargarProductos(negocioId)
// ============================================

import { create } from 'zustand'
import { productosService } from '../services/productos'

export const useProductosStore = create((set, get) => ({
  productos: [],
  cargando: false,
  busqueda: '',

  // Cargar todos los productos
  cargarProductos: async (negocioId) => {
    // Validar que existe negocio_id
    if (!negocioId) {
      console.warn('No hay negocio_id disponible')
      set({ productos: [], cargando: false })
      return
    }

    set({ cargando: true })
    try {
      const productos = await productosService.obtenerTodos(negocioId)
      set({ productos, cargando: false })
    } catch (error) {
      console.error('Error al cargar productos:', error)
      set({ cargando: false })
    }
  },
  // Buscar productos
  buscarProductos: async (negocioId, termino) => {
    set({ busqueda: termino, cargando: true })
    try {
      const productos = await productosService.buscar(negocioId, termino)
      set({ productos, cargando: false })
    } catch (error) {
      console.error('Error en búsqueda:', error)
      set({ cargando: false })
    }
  },

  // Agregar producto
  agregarProducto: async (negocioId, datos) => {
    const nuevo = await productosService.crear(negocioId, datos)
    set({ productos: [...get().productos, nuevo] })
    return nuevo
  },

  // Actualizar producto
  actualizarProducto: async (id, datos) => {
    const actualizado = await productosService.actualizar(id, datos)
    set({
      productos: get().productos.map(p => p.id === id ? actualizado : p)
    })
    return actualizado
  },

  // Actualizar múltiples productos
  actualizarProductosMasivo: async (ids, datos) => {
    const actualizados = await productosService.actualizarMuchos(ids, datos)
    set({
      productos: get().productos.map(p => {
        const actualizado = actualizados.find(a => a.id === p.id)
        return actualizado ? actualizado : p
      })
    })
    return actualizados
  },

  // Agregar stock rápido
  agregarStock: async (id, cantidad) => {
    const actualizado = await productosService.agregarStock(id, cantidad)
    set({
      productos: get().productos.map(p => p.id === id ? actualizado : p)
    })
  },

  // Desactivar producto (soft delete)
  desactivarProducto: async (id) => {
    await productosService.desactivar(id)
    set({
      productos: get().productos.filter(p => p.id !== id)
    })
  },

  // Eliminar producto permanentemente de la BD
  eliminarProducto: async (id) => {
    await productosService.eliminar(id)
    set({
      productos: get().productos.filter(p => p.id !== id)
    })
  }
}))