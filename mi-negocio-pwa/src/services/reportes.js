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
  async resumenGeneral(negocioId, mes = null, anio = null) {
    // Total productos
    const { data: productos } = await supabase
      .from('productos')
      .select('id, stock_actual, stock_minimo, es_por_kg')
      .eq('negocio_id', negocioId)
      .eq('activo', true)

    const totalProductos = productos?.length || 0
    const productosStockBajo = productos?.filter(p => !p.es_por_kg && p.stock_actual <= p.stock_minimo).length || 0

    // Fechas para cálculos
    const hoy = new Date()

    // Si no hay mes/anio especificado, usamos los actuales
    const mesFiltro = mes !== null ? mes : hoy.getMonth()
    const anioFiltro = anio !== null ? anio : hoy.getFullYear()

    // Inicio y fin del mes de interés
    const inicioMes = new Date(anioFiltro, mesFiltro, 1)
    inicioMes.setHours(0, 0, 0, 0)

    const finMes = new Date(anioFiltro, mesFiltro + 1, 0)
    finMes.setHours(23, 59, 59, 999)

    // Ventas del día (estrictamente hoy, no se ve afectado por el filtro de mes del dashboard por ahora)
    const inicioDia = new Date(hoy)
    inicioDia.setHours(0, 0, 0, 0)

    const { data: ventasHoy } = await supabase
      .from('ventas')
      .select('total')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicioDia.toISOString())

    const ventasDelDia = ventasHoy?.length || 0
    const ingresosDelDia = ventasHoy?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0

    // Ventas del período seleccionado (mes)
    const { data: ventasMes } = await supabase
      .from('ventas')
      .select('id, total')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicioMes.toISOString())
      .lte('fecha', finMes.toISOString())

    const ventasDelMes = ventasMes?.length || 0
    const ingresosDelMes = ventasMes?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0

    // Cálculo de ganancia del mes (usando ventas_items para mayor precisión)
    let gananciaMes = 0
    if (ventasMes && ventasMes.length > 0) {
      const { data: itemsMes } = await supabase
        .from('ventas_items')
        .select('cantidad, precio_unitario, precio_costo, producto_id')
        .in('venta_id', ventasMes.map(v => v.id))

      // Obtener costos actuales de productos para rellenar vacíos históricos
      const { data: productosCostos } = await supabase
        .from('productos')
        .select('id, precio_costo')
        .eq('negocio_id', negocioId)

      const costosMap = {}
      productosCostos?.forEach(p => { costosMap[p.id] = p.precio_costo })

      gananciaMes = itemsMes?.reduce((sum, item) => {
        const venta = item.cantidad * item.precio_unitario
        // Si el costo histórico es 0, intentar usar el costo actual del producto
        const costoUnitario = item.precio_costo || costosMap[item.producto_id] || 0
        const costo = item.cantidad * costoUnitario
        return sum + (venta - costo)
      }, 0) || 0
    }

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

    // Gastos del período (movimientos_caja tipo 'gasto')
    const { data: gastos } = await supabase
      .from('movimientos_caja')
      .select('monto')
      .eq('tipo', 'gasto')
      .gte('fecha', inicioMes.toISOString())
      .lte('fecha', finMes.toISOString())

    // Necesitamos filtrar por negocio_id. 
    // Los movimientos_caja están vinculados a cajas, y las cajas a negocios.
    // Una opción es obtener los IDs de las cajas del negocio en el periodo.
    const { data: cajasIds } = await supabase
      .from('cajas')
      .select('id')
      .eq('negocio_id', negocioId)

    const idsCajas = cajasIds?.map(c => c.id) || []

    let gastosTotalesMes = 0
    if (idsCajas.length > 0) {
      const { data: gastosFiltrados } = await supabase
        .from('movimientos_caja')
        .select('monto')
        .eq('tipo', 'gasto')
        .in('caja_id', idsCajas)
        .gte('fecha', inicioMes.toISOString())
        .lte('fecha', finMes.toISOString())

      gastosTotalesMes = gastosFiltrados?.reduce((sum, g) => sum + parseFloat(g.monto), 0) || 0
    }

    return {
      totalProductos,
      productosStockBajo,
      ventasDelDia,
      ingresosDelDia,
      ventasDelMes,
      enCaja,
      deudaTotal,
      clientesConDeuda,
      gananciaMes,
      gastosTotalesMes
    }
  },

  // Ventas por día (últimos N días)
  async ventasPorDia(negocioId, dias = 30, mes = null, anio = null) {
    const hoy = new Date()
    let fechaInicio, fechaFin
    let numDias

    if (mes !== null && anio !== null) {
      fechaInicio = new Date(anio, mes, 1)
      fechaFin = new Date(anio, mes + 1, 0)
      numDias = fechaFin.getDate()
    } else {
      fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - (dias - 1))
      fechaFin = new Date()
      numDias = dias
    }

    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin.setHours(23, 59, 59, 999)

    // Obtener ventas desde la fecha de inicio
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('total, fecha')
      .eq('negocio_id', negocioId)
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: true })

    if (error) {
      console.error('Error al cargar ventas por día:', error)
      return []
    }

    // Inicializar todos los días del período con 0
    const ventasPorDiaMap = {}
    for (let i = 0; i < numDias; i++) {
      const fecha = new Date(fechaInicio)
      fecha.setDate(fecha.getDate() + i)
      const key = fecha.toISOString().split('T')[0]
      ventasPorDiaMap[key] = 0
    }

    // Agrupar ventas por día
    ventas?.forEach(venta => {
      const fechaVenta = venta.fecha.split('T')[0]
      if (ventasPorDiaMap.hasOwnProperty(fechaVenta)) {
        ventasPorDiaMap[fechaVenta] += parseFloat(venta.total)
      }
    })

    // Convertir a array y asegurar orden cronológico
    return Object.entries(ventasPorDiaMap)
      .map(([fecha, total]) => ({
        fecha,
        total: Math.round(total * 100) / 100
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
      .select('cantidad, producto_id, precio_unitario')
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
          ventasPorProducto[nombre] = { cantidad: 0, monto: 0 }
        }
        ventasPorProducto[nombre].cantidad += item.cantidad
        ventasPorProducto[nombre].monto += (item.cantidad * item.precio_unitario)
      }
    }

    // Convertir a array y ordenar por cantidad (puedes cambiar a b.monto si prefieres ingresos)
    return Object.entries(ventasPorProducto)
      .map(([nombre, data]) => ({ nombre, cantidad: data.cantidad, monto: data.monto }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite)
  },

  // Ventas por método de pago (del período)
  async ventasPorMetodoPago(negocioId, mes = null, anio = null) {
    let inicio, fin
    const hoy = new Date()

    if (mes !== null && anio !== null) {
      inicio = new Date(anio, mes, 1)
      inicio.setHours(0, 0, 0, 0)
      fin = new Date(anio, mes + 1, 0)
      fin.setHours(23, 59, 59, 999)
    } else {
      inicio = new Date(hoy)
      inicio.setHours(0, 0, 0, 0)
      fin = new Date(hoy)
      fin.setHours(23, 59, 59, 999)
    }

    const { data: ventas } = await supabase
      .from('ventas')
      .select('total, metodo_pago')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicio.toISOString())
      .lte('fecha', fin.toISOString())

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
  },

  // Ventas de productos por KG del período
  async ventasKgHoy(negocioId, mes = null, anio = null) {
    let inicio, fin
    const hoy = new Date()

    if (mes !== null && anio !== null) {
      inicio = new Date(anio, mes, 1)
      inicio.setHours(0, 0, 0, 0)
      fin = new Date(anio, mes + 1, 0)
      fin.setHours(23, 59, 59, 999)
    } else {
      const hoyStr = hoy.toISOString().split('T')[0]
      inicio = new Date(hoyStr)
      inicio.setHours(0, 0, 0, 0)
      fin = new Date(hoyStr)
      fin.setHours(23, 59, 59, 999)
    }

    // Obtener ventas del periodo
    const { data: ventas } = await supabase
      .from('ventas')
      .select('id')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicio.toISOString())
      .lte('fecha', fin.toISOString())

    if (!ventas || ventas.length === 0) return []

    const ventasIds = ventas.map(v => v.id)

    // Obtener items de esas ventas
    const { data: items } = await supabase
      .from('ventas_items')
      .select('cantidad, producto_id')
      .in('venta_id', ventasIds)
      .not('producto_id', 'is', null)

    if (!items || items.length === 0) return []

    // Obtener productos que son por KG
    const productosIds = [...new Set(items.map(i => i.producto_id))]
    const { data: productos } = await supabase
      .from('productos')
      .select('id, nombre, es_por_kg')
      .in('id', productosIds)
      .eq('es_por_kg', true)

    if (!productos || productos.length === 0) return []

    // Crear mapa de productos por KG
    const productosMap = {}
    productos.forEach(p => {
      productosMap[p.id] = p.nombre
    })

    // Agrupar ventas por producto
    const agrupado = {}
    items.forEach(item => {
      const nombre = productosMap[item.producto_id]
      if (nombre) {
        agrupado[nombre] = (agrupado[nombre] || 0) + parseFloat(item.cantidad)
      }
    })

    return Object.entries(agrupado)
      .map(([nombre, kg]) => ({
        nombre,
        kg: parseFloat(kg.toFixed(2))
      }))
      .sort((a, b) => b.kg - a.kg)
  },

  // Obtener lista de meses/años que tienen o podrían tener datos (desde la primera venta hasta hoy)
  async obtenerPeriodosVentas(negocioId) {
    try {
      const { data: primeraVenta, error } = await supabase
        .from('ventas')
        .select('fecha')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error al obtener primera venta:', error)
        return []
      }

      const hoy = new Date()
      const inicio = primeraVenta ? new Date(primeraVenta.fecha) : new Date()

      const periodos = []
      let actual = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

      while (actual <= fin) {
        periodos.push({
          mes: actual.getMonth(),
          anio: actual.getFullYear()
        })
        actual.setMonth(actual.getMonth() + 1)
      }

      return periodos.reverse()
    } catch (e) {
      console.error('Error en obtenerPeriodosVentas:', e)
      return []
    }
  },

  // Ventas agrupadas por hora (para mapa de calor/flujo)
  async ventasPorHora(negocioId, fechaInicio, fechaFin) {
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('fecha, total')
      .eq('negocio_id', negocioId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)

    if (error) throw error

    // Inicializar las 24 horas
    const horasMap = {}
    for (let i = 0; i < 24; i++) {
      horasMap[i] = { hora: `${i}:00`, total: 0, cantidad: 0 }
    }

    ventas?.forEach(venta => {
      const hora = new Date(venta.fecha).getHours()
      horasMap[hora].total += parseFloat(venta.total)
      horasMap[hora].cantidad += 1
    })

    return Object.values(horasMap)
  },

  // Desglose de ganancia por producto (para el modal de Ganancia Estimada)
  async obtenerDetalleGanancia(negocioId, mes, anio) {
    const inicioMes = new Date(anio, mes, 1)
    inicioMes.setHours(0, 0, 0, 0)
    const finMes = new Date(anio, mes + 1, 0)
    finMes.setHours(23, 59, 59, 999)

    const { data: ventas } = await supabase
      .from('ventas')
      .select('id')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicioMes.toISOString())
      .lte('fecha', finMes.toISOString())

    if (!ventas || ventas.length === 0) return []

    const { data: items } = await supabase
      .from('ventas_items')
      .select('cantidad, precio_unitario, precio_costo, producto_id, descripcion_momento_venta')
      .in('venta_id', ventas.map(v => v.id))

    if (!items) return []

    // Obtener costos actuales de productos registrados
    const { data: productosCostos } = await supabase
      .from('productos')
      .select('id, precio_costo')
      .eq('negocio_id', negocioId)

    const costosMap = {}
    productosCostos?.forEach(p => { costosMap[p.id] = p.precio_costo })

    const agrupado = {}
    items.forEach(item => {
      const nombre = item.descripcion_momento_venta || 'Sin nombre'
      if (!agrupado[nombre]) {
        agrupado[nombre] = { nombre, ingresos: 0, costos: 0, cantidad: 0 }
      }
      agrupado[nombre].ingresos += item.cantidad * item.precio_unitario

      // FALLBACK: Si no hay costo guardado en la venta, usar el costo actual del producto
      const costoUnitario = item.precio_costo || (item.producto_id ? costosMap[item.producto_id] : 0) || 0
      agrupado[nombre].costos += item.cantidad * costoUnitario
      agrupado[nombre].cantidad += item.cantidad
    })

    return Object.values(agrupado)
      .map(d => ({
        ...d,
        ganancia: d.ingresos - d.costos,
        margen: d.ingresos > 0 ? ((d.ingresos - d.costos) / d.ingresos) * 100 : 0
      }))
      .sort((a, b) => b.ganancia - a.ganancia)
  },

  // Ranking de categorías rentables
  async obtenerGananciaPorCategoria(negocioId, mes, anio) {
    const inicioMes = new Date(anio, mes, 1)
    inicioMes.setHours(0, 0, 0, 0)
    const finMes = new Date(anio, mes + 1, 0)
    finMes.setHours(23, 59, 59, 999)

    const { data: ventas } = await supabase
      .from('ventas')
      .select('id')
      .eq('negocio_id', negocioId)
      .gte('fecha', inicioMes.toISOString())
      .lte('fecha', finMes.toISOString())

    if (!ventas || ventas.length === 0) return []

    const { data: items } = await supabase
      .from('ventas_items')
      .select('cantidad, precio_unitario, precio_costo, producto_id')
      .in('venta_id', ventas.map(v => v.id))

    if (!items) return []

    const productosIds = [...new Set(items.map(i => i.producto_id).filter(Boolean))]
    const { data: productos } = await supabase
      .from('productos')
      .select('id, precio_costo, categorias(nombre, color)')
      .in('id', productosIds)

    const prodInfoMap = {}
    productos?.forEach(p => {
      prodInfoMap[p.id] = {
        nombre: p.categorias?.nombre || 'Sin Categoría',
        color: p.categorias?.color || '#9ca3af',
        precio_costo: p.precio_costo || 0
      }
    })

    const agrupado = {}
    items.forEach(item => {
      const catInfo = item.producto_id ? prodInfoMap[item.producto_id] : { nombre: 'Venta Rápida', color: '#6b7280', precio_costo: 0 }
      const catName = catInfo?.nombre || 'Sin Categoría'

      if (!agrupado[catName]) {
        agrupado[catName] = {
          nombre: catName,
          color: catInfo?.color || '#9ca3af',
          ingresos: 0,
          costos: 0,
          ventas: 0
        }
      }
      agrupado[catName].ingresos += item.cantidad * item.precio_unitario

      // FALLBACK: Si no hay costo guardado en la venta, usar el costo actual del producto
      const costoUnitario = item.precio_costo || (item.producto_id ? prodInfoMap[item.producto_id]?.precio_costo : 0) || 0
      agrupado[catName].costos += item.cantidad * costoUnitario
      agrupado[catName].ventas += 1
    })

    return Object.values(agrupado)
      .map(d => ({
        ...d,
        ganancia: d.ingresos - d.costos,
        margen: d.ingresos > 0 ? ((d.ingresos - d.costos) / d.ingresos) * 100 : 0
      }))
      .sort((a, b) => b.ganancia - a.ganancia)
  }

}