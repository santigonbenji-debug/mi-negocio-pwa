// ============================================
// ¿QUÉ HACE ESTO?
// Genera reportes y estadísticas del negocio
//
// ANALOGÍA:
// Como tener un contador que analiza todos tus
// registros y te dice: "Vendiste X, ganaste Y,
// estos son tus mejores productos"
//
// USO:
// await reportesService.resumenGeneral(negocioId)
// await reportesService.ventasPorDia(negocioId, dias)
// ============================================

import { supabase } from './supabase'

export const reportesService = {
  // Resumen general del negocio
  async resumenGeneral(negocioId) {
    // Total productos
    const { data: productos } = await supabase
      .from('productos')
      .select('id, stock_actual, stock_minimo')
      .eq('negocio_id', negocioId)
      .eq('activo', true)

    const totalProductos = productos?.length || 0
    const productosStockBajo = productos?.filter(p => p.stock_actual <= p.stock_minimo).length || 0

    // Ventas del día
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { data: ventasHoy } = await supabase
      .from('ventas')
      .select('total, metodo_pago')
      .eq('negocio_id', negocioId)
      .gte('fecha', hoy.toISOString())

    const ventasDelDia = ventasHoy?.length || 0
    const ingresos = ventasHoy?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0

    // Caja abierta
    const { data: cajaActual } = await supabase
  .from('cajas')
  .select('monto_esperado')
  .eq('negocio_id', negocioId)
  .eq('estado', 'abierta')
  .maybeSingle()

    const enCaja = cajaActual?.monto_esperado || 0

    // Deudas totales
    const { data: fiados } = await supabase
      .from('fiados_con_deuda')
      .select('deuda_total')
      .eq('negocio_id', negocioId)

    const deudaTotal = fiados?.reduce((sum, f) => sum + parseFloat(f.deuda_total), 0) || 0
    const clientesConDeuda = fiados?.filter(f => parseFloat(f.deuda_total) > 0).length || 0

    return {
      totalProductos,
      productosStockBajo,
      ventasDelDia,
      ingresosDelDia: ingresos,
      enCaja,
      deudaTotal,
      clientesConDeuda
    }
  },

  // Ventas por día (últimos N días)
  async ventasPorDia(negocioId, dias = 7) {
  // Calcular fecha de inicio (hace N días a las 00:00)
  const fechaInicio = new Date()
  fechaInicio.setDate(fechaInicio.getDate() - (dias - 1)) // -6 para incluir hoy
  fechaInicio.setHours(0, 0, 0, 0)

  // Obtener ventas desde la fecha de inicio
  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('total, fecha')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio.toISOString())
    .order('fecha', { ascending: true })

  if (error) {
    console.error('Error al cargar ventas por día:', error)
    return []
  }

  // Inicializar todos los días con 0
  const ventasPorDia = {}
  for (let i = 0; i < dias; i++) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)
    fecha.setHours(0, 0, 0, 0)
    const key = fecha.toISOString().split('T')[0]
    ventasPorDia[key] = 0
  }

  // Agrupar ventas por día
  ventas?.forEach(venta => {
    // Extraer solo la fecha (sin hora)
    const fechaVenta = venta.fecha.split('T')[0]
    
    if (ventasPorDia.hasOwnProperty(fechaVenta)) {
      ventasPorDia[fechaVenta] += parseFloat(venta.total)
    }
  })

  // Convertir a array y ordenar cronológicamente
  return Object.entries(ventasPorDia)
    .map(([fecha, total]) => ({
      fecha,
      total: Math.round(total * 100) / 100 // Redondear a 2 decimales
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
},

  // Productos más vendidos
async productosMasVendidos(negocioId, limite = 5) {
  // PASO 1: Obtener IDs de ventas del negocio
  const { data: ventas } = await supabase
    .from('ventas')
    .select('id')
    .eq('negocio_id', negocioId)

  if (!ventas || ventas.length === 0) return []

  const ventasIds = ventas.map(v => v.id)

  // PASO 2: Obtener items de esas ventas
  const { data: items } = await supabase
    .from('ventas_items')
    .select('cantidad, producto_id')
    .in('venta_id', ventasIds)
    .not('producto_id', 'is', null)

  if (!items || items.length === 0) return []

  // PASO 3: Obtener nombres de productos
  const productosIds = [...new Set(items.map(i => i.producto_id))]
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', productosIds)

  // Crear mapa de productos
  const productosMap = {}
  productos?.forEach(p => {
    productosMap[p.id] = p.nombre
  })

  // Agrupar por producto
  const ventasPorProducto = {}
  
  for (const item of items) {
    const nombre = productosMap[item.producto_id]
    if (nombre) {
      if (!ventasPorProducto[nombre]) {
        ventasPorProducto[nombre] = 0
      }
      ventasPorProducto[nombre] += item.cantidad
    }
  }

  // Convertir a array y ordenar
  return Object.entries(ventasPorProducto)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limite)
},

  // Ventas por método de pago (del día)
  async ventasPorMetodoPago(negocioId) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { data: ventas } = await supabase
      .from('ventas')
      .select('total, metodo_pago')
      .eq('negocio_id', negocioId)
      .gte('fecha', hoy.toISOString())

    const totales = {
      efectivo: 0,
      tarjeta: 0,
      fiado: 0
    }

    ventas?.forEach(venta => {
      totales[venta.metodo_pago] += parseFloat(venta.total)
    })

    return [
      { metodo: 'Efectivo', total: totales.efectivo },
      { metodo: 'Transferencia', total: totales.tarjeta },
      { metodo: 'Fiado', total: totales.fiado }
    ]

    
  },


// ============================================
// REPORTES CON FILTROS POR FECHA
// ============================================

// Obtener cajas en un rango de fechas
async cajasEnPeriodo(negocioId, fechaInicio, fechaFin) {
  const { data: cajas, error } = await supabase
    .from('cajas')
    .select('*')
    .eq('negocio_id', negocioId)
    .gte('fecha_apertura', fechaInicio)
    .lte('fecha_apertura', fechaFin)
    .order('fecha_apertura', { ascending: false })

  if (error) throw error

  // Obtener nombres de usuarios por separado
  if (cajas && cajas.length > 0) {
    const usuariosIds = [...new Set(cajas.map(c => c.usuario_id))]
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .in('id', usuariosIds)

    // Mapear nombres a las cajas
    const usuariosMap = {}
    usuarios?.forEach(u => {
      usuariosMap[u.id] = u
    })

    return cajas.map(caja => ({
      ...caja,
      usuarios: usuariosMap[caja.usuario_id]
    }))
  }

  return cajas || []
},

// Obtener movimientos de una caja específica
async movimientosDeCaja(cajaId) {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('caja_id', cajaId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data || []
},

// Obtener ventas en un rango de fechas
async ventasEnPeriodo(negocioId, fechaInicio, fechaFin, metodoPago = null) {
  let query = supabase
    .from('ventas')
    .select('*')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })

  if (metodoPago) {
    query = query.eq('metodo_pago', metodoPago)
  }

  const { data: ventas, error } = await query

  if (error) throw error

  // Obtener nombres de usuarios por separado
  if (ventas && ventas.length > 0) {
    const usuariosIds = [...new Set(ventas.map(v => v.usuario_id))]
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .in('id', usuariosIds)

    // Mapear nombres a las ventas
    const usuariosMap = {}
    usuarios?.forEach(u => {
      usuariosMap[u.id] = u
    })

    return ventas.map(venta => ({
      ...venta,
      usuarios: usuariosMap[venta.usuario_id]
    }))
  }

  return ventas || []
},

// Totales de ventas en período
async totalesEnPeriodo(negocioId, fechaInicio, fechaFin) {
  const { data: ventas } = await supabase
    .from('ventas')
    .select('total, metodo_pago')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

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
},

// Productos más vendidos en período
async productosMasVendidosPeriodo(negocioId, fechaInicio, fechaFin, limite = 10) {
  // PASO 1: Obtener IDs de ventas del negocio en el período
  const { data: ventas } = await supabase
    .from('ventas')
    .select('id')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

  if (!ventas || ventas.length === 0) return []

  const ventasIds = ventas.map(v => v.id)

  // PASO 2: Obtener items de esas ventas
  const { data: items } = await supabase
    .from('ventas_items')
    .select('cantidad, producto_id')
    .in('venta_id', ventasIds)
    .not('producto_id', 'is', null)

  if (!items || items.length === 0) return []

  // PASO 3: Obtener nombres de productos
  const productosIds = [...new Set(items.map(i => i.producto_id))]
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', productosIds)

  // Crear mapa de productos
  const productosMap = {}
  productos?.forEach(p => {
    productosMap[p.id] = p.nombre
  })

  const ventasPorProducto = {}
  
  for (const item of items) {
    const nombre = productosMap[item.producto_id]
    if (nombre) {
      if (!ventasPorProducto[nombre]) {
        ventasPorProducto[nombre] = 0
      }
      ventasPorProducto[nombre] += item.cantidad
    }
  }

  return Object.entries(ventasPorProducto)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limite)
},

// Ventas agrupadas por día en período
async ventasPorDiaPeriodo(negocioId, fechaInicio, fechaFin) {
  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('total, fecha')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: true })

  if (error) {
    console.error('Error al cargar ventas por día:', error)
    return []
  }

  // Agrupar por día
  const ventasPorDia = {}
  
  ventas?.forEach(venta => {
    const fechaVenta = venta.fecha.split('T')[0]
    
    if (!ventasPorDia[fechaVenta]) {
      ventasPorDia[fechaVenta] = 0
    }
    ventasPorDia[fechaVenta] += parseFloat(venta.total)
  })

  return Object.entries(ventasPorDia)
    .map(([fecha, total]) => ({
      fecha,
      total: Math.round(total * 100) / 100
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

  
}