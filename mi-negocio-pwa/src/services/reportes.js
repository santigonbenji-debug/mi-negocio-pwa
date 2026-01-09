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
  // Hacer join con ventas para filtrar por negocio_id
  const { data } = await supabase
    .from('ventas_items')
    .select(`
      cantidad,
      producto_id,
      productos (nombre),
      ventas!inner (negocio_id)
    `)
    .eq('ventas.negocio_id', negocioId)
    .not('producto_id', 'is', null)

  if (!data || data.length === 0) return []

  // Agrupar por producto
  const ventasPorProducto = {}
  
  for (const item of data) {
    if (item.productos && item.productos.nombre) {
      const nombre = item.productos.nombre
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
      { metodo: 'Tarjeta', total: totales.tarjeta },
      { metodo: 'Fiado', total: totales.fiado }
    ]

    
  },


// ============================================
// REPORTES CON FILTROS POR FECHA
// ============================================

// Obtener cajas en un rango de fechas
async cajasEnPeriodo(negocioId, fechaInicio, fechaFin) {
  const { data, error } = await supabase
    .from('cajas')
    .select('*, usuarios(nombre)')
    .eq('negocio_id', negocioId)
    .gte('fecha_apertura', fechaInicio)
    .lte('fecha_apertura', fechaFin)
    .order('fecha_apertura', { ascending: false })

  if (error) throw error
  return data || []
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
    .select('*, usuarios(nombre)')
    .eq('negocio_id', negocioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })

  if (metodoPago) {
    query = query.eq('metodo_pago', metodoPago)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
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
  const { data } = await supabase
    .from('ventas_items')
    .select(`
      cantidad,
      producto_id,
      productos (nombre),
      ventas!inner (negocio_id, fecha)
    `)
    .eq('ventas.negocio_id', negocioId)
    .gte('ventas.fecha', fechaInicio)
    .lte('ventas.fecha', fechaFin)
    .not('producto_id', 'is', null)

  if (!data || data.length === 0) return []

  const ventasPorProducto = {}
  
  for (const item of data) {
    if (item.productos && item.productos.nombre) {
      const nombre = item.productos.nombre
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