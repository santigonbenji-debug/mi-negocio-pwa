// ============================================
// ¿QUÉ HACE ESTO?
// Maneja todas las operaciones de ventas
//
// ANALOGÍA:
// Como el sistema de una caja registradora que:
// - Registra cada venta (crear)
// - Guarda qué productos se vendieron (items)
// - Descuenta stock automáticamente (trigger en BD)
// - Registra el movimiento en caja (automático)
//
// TIPOS DE VENTA:
// - 'stock': Productos del inventario (descuenta stock)
// - 'rapida': Productos sin registrar (no afecta inventario)
//
// USO:
// await ventasService.crear(negocioId, usuarioId, cajaId, items, total, 'efectivo')
// ============================================

import { supabase } from './supabase'
import { cajaService } from './caja'

export const ventasService = {
  // Crear venta completa
  async crear(negocioId, usuarioId, cajaId, items, total, metodoPago, clienteNombre = null) {
    // Validar que haya caja abierta
    if (!cajaId) {
      throw new Error('Debes abrir una caja para realizar ventas')
    }

    // Determinar tipo de venta
    const tieneProductosInventario = items.some(item => item.producto_id)
    const tipo = tieneProductosInventario ? 'stock' : 'rapida'

    // 1. Crear venta
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .insert({
        negocio_id: negocioId,
        usuario_id: usuarioId,
        caja_id: cajaId,
        tipo,
        total,
        metodo_pago: metodoPago,
        cliente_nombre: clienteNombre
      })
      .select()
      .single()

    if (errorVenta) throw errorVenta

    // 2. Crear items de la venta
    const itemsParaInsertar = items.map(item => ({
      venta_id: venta.id,
      producto_id: item.producto_id || null,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      descripcion_momento_venta: item.descripcion || item.nombre
    }))

    const { error: errorItems } = await supabase
      .from('ventas_items')
      .insert(itemsParaInsertar)

    if (errorItems) throw errorItems

    // 3. Registrar movimiento en caja (AUTOMÁTICO)
    await cajaService.registrarMovimiento(
      cajaId,
      'ingreso',
      total,
      `Venta #${venta.id.slice(0, 8)}`,
      venta.id
    )

    // 4. Si es fiado, crear/actualizar cliente
if (metodoPago === 'fiado' && clienteNombre) {
  await this.registrarFiado(negocioId, clienteNombre, total, venta.id)
}

    return venta
  },

  // Registrar fiado
async registrarFiado(negocioId, clienteNombre, monto, ventaId) {
  // Buscar cliente existente
  const { data: clienteExistente } = await supabase
    .from('fiados')
    .select('id')
    .eq('negocio_id', negocioId)
    .eq('cliente_nombre', clienteNombre)
    .single()

  let fiadoId

  if (clienteExistente) {
    fiadoId = clienteExistente.id
  } else {
    // Crear nuevo cliente
    const { data: nuevoCliente } = await supabase
      .from('fiados')
      .insert({
        negocio_id: negocioId,
        cliente_nombre: clienteNombre
      })
      .select()
      .single()
    
    fiadoId = nuevoCliente.id
  }

  // Registrar movimiento de compra CON REFERENCIA
  await supabase
    .from('fiados_movimientos')
    .insert({
      fiado_id: fiadoId,
      tipo: 'compra',
      monto,
      descripcion: `Venta #${ventaId.slice(0, 8)}`,
      venta_id: ventaId
    })
},

  // Obtener ventas del día
  async obtenerVentasDelDia(negocioId) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('ventas')
      .select('*, usuarios(nombre)')
      .eq('negocio_id', negocioId)
      .gte('fecha', hoy.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Obtener detalles de una venta
  async obtenerDetalles(ventaId) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        usuarios(nombre),
        ventas_items(*)
      `)
      .eq('id', ventaId)
      .single()

    if (error) throw error
    return data
  },

  // Obtener totales del día
  async obtenerTotalesDelDia(negocioId) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { data: ventas } = await supabase
      .from('ventas')
      .select('total, metodo_pago')
      .eq('negocio_id', negocioId)
      .gte('fecha', hoy.toISOString())

    const totales = {
      total: 0,
      efectivo: 0,
      tarjeta: 0,
      fiado: 0,
      cantidad: ventas?.length || 0
    }

    ventas?.forEach(venta => {
      const monto = parseFloat(venta.total)
      totales.total += monto
      
      if (venta.metodo_pago === 'efectivo') totales.efectivo += monto
      if (venta.metodo_pago === 'tarjeta') totales.tarjeta += monto
      if (venta.metodo_pago === 'fiado') totales.fiado += monto
    })

    return totales
  }
}