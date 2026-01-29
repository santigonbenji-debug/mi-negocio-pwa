// ============================================
// ¿QUÉ HACE ESTO?
// Maneja el carrito de compras y ventas
//
// ANALOGÍA:
// Como un carrito de supermercado digital:
// - Agregas productos (agregarAlCarrito)
// - Quitas productos (quitarDelCarrito)
// - Ves el total (calcular automáticamente)
// - Pagas y vacías el carrito (procesarVenta)
//
// USO:
// const { carrito, total, agregarAlCarrito, procesarVenta } = useVentasStore()
// ============================================

import { create } from 'zustand'
import { ventasService } from '../services/ventas'

export const useVentasStore = create((set, get) => ({
  carrito: [],
  ventas: [],
  totalesDelDia: null,
  cargando: false,

  // Calcular total del carrito
  calcularTotal: () => {
    const { carrito } = get()
    return carrito.reduce((sum, item) => {
      return sum + (item.precio_unitario * item.cantidad)
    }, 0)
  },

  // Agregar producto al carrito
  agregarAlCarrito: (producto, cantidad = 1) => {
    const { carrito } = get()

    // Verificar si ya está en el carrito
    const existente = carrito.find(item =>
      item.producto_id === producto.id
    )

    if (existente) {
      // Incrementar cantidad
      set({
        carrito: carrito.map(item =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      })
    } else {
      // Agregar nuevo
      set({
        carrito: [...carrito, {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio_unitario: producto.precio,
          precio_costo: producto.precio_costo || 0,
          cantidad,
          stock_disponible: producto.stock_actual,
          es_por_kg: producto.es_por_kg || false
        }]
      })
    }
  },

  // Agregar producto rápido (sin inventario)
  agregarProductoRapido: (nombre, precio, cantidad = 1) => {
    const { carrito } = get()

    set({
      carrito: [...carrito, {
        producto_id: null, // Sin ID = venta rápida
        nombre,
        precio_unitario: precio,
        cantidad,
        stock_disponible: null
      }]
    })
  },

  // Actualizar cantidad de un item
  actualizarCantidad: (index, nuevaCantidad) => {
    const { carrito } = get()

    if (nuevaCantidad <= 0) {
      // Eliminar si cantidad es 0
      set({
        carrito: carrito.filter((_, i) => i !== index)
      })
    } else {
      set({
        carrito: carrito.map((item, i) =>
          i === index ? { ...item, cantidad: nuevaCantidad } : item
        )
      })
    }
  },

  // Quitar del carrito
  quitarDelCarrito: (index) => {
    const { carrito } = get()
    set({
      carrito: carrito.filter((_, i) => i !== index)
    })
  },

  // Vaciar carrito
  vaciarCarrito: () => {
    set({ carrito: [] })
  },

  // Procesar venta
  procesarVenta: async (negocioId, usuarioId, cajaId, metodoPago, clienteNombre = null) => {
    const { carrito } = get()

    if (carrito.length === 0) {
      throw new Error('El carrito está vacío')
    }

    const total = get().calcularTotal()

    // Validar stock antes de procesar (excepto productos por KG)
    for (const item of carrito) {
      if (item.producto_id && item.stock_disponible !== null && !item.es_por_kg) {
        if (item.cantidad > item.stock_disponible) {
          throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${item.stock_disponible}`)
        }
      }
    }

    // Crear venta
    const venta = await ventasService.crear(
      negocioId,
      usuarioId,
      cajaId,
      carrito,
      total,
      metodoPago,
      clienteNombre
    )

    // Limpiar carrito
    set({ carrito: [] })

    // Recargar ventas del día
    await get().cargarVentasDelDia(negocioId)

    return venta
  },

  // Cargar ventas del día
  cargarVentasDelDia: async (negocioId) => {
    set({ cargando: true })
    try {
      const ventas = await ventasService.obtenerVentasDelDia(negocioId)
      set({ ventas, cargando: false })
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      set({ cargando: false })
    }
  },

  // Cargar totales del día
  cargarTotalesDelDia: async (negocioId) => {
    try {
      const totales = await ventasService.obtenerTotalesDelDia(negocioId)
      set({ totalesDelDia: totales })
    } catch (error) {
      console.error('Error al cargar totales:', error)
    }
  },

  // Limpiar store
  limpiar: () => {
    set({ carrito: [], ventas: [], totalesDelDia: null })
  }
}))