// ============================================
// ¿QUÉ HACE ESTO?
// Maneja todas las operaciones de la caja registradora
//
// ANALOGÍA:
// Como tener un cajero que:
// - Abre la caja al iniciar el día (apertura)
// - Registra cada ingreso/gasto (movimientos)
// - Cierra y cuenta al final del día (cierre)
// - Te muestra el historial (obtenerHistorial)
//
// USO:
// await cajaService.abrirCaja(negocioId, usuarioId, 100)
// await cajaService.registrarMovimiento(cajaId, 'ingreso', 50, 'Venta')
// ============================================

import { supabase } from './supabase'

export const cajaService = {
 async cajaAbierta(negocioId) {
  const { data, error } = await supabase
    .from('cajas')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('estado', 'abierta')
    .maybeSingle()  // ← CAMBIO: Devuelve null si no hay resultados

  if (error) throw error
  return data  // null si no hay caja abierta, objeto si hay
},

  // Abrir nueva caja
  async abrirCaja(negocioId, usuarioId, montoInicial) {
    // Verificar que no haya caja abierta
    const cajaExistente = await this.cajaAbierta(negocioId)
    if (cajaExistente) {
      throw new Error('Ya hay una caja abierta. Ciérrala primero.')
    }

    const { data, error } = await supabase
      .from('cajas')
      .insert({
        negocio_id: negocioId,
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: 'abierta'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Registrar movimiento (ingreso, egreso, gasto)
  async registrarMovimiento(cajaId, tipo, monto, concepto, ventaId = null) {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .insert({
        caja_id: cajaId,
        tipo,
        monto,
        concepto,
        venta_id: ventaId
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Actualizar totales de la caja
    await this.actualizarTotalesCaja(cajaId)
    
    return data
  },

  // Actualizar totales de la caja
  async actualizarTotalesCaja(cajaId) {
    // Obtener todos los movimientos
    const { data: movimientos } = await supabase
      .from('movimientos_caja')
      .select('tipo, monto')
      .eq('caja_id', cajaId)
    
    const ingresos = movimientos
      ?.filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0) || 0
    
    const egresos = movimientos
      ?.filter(m => m.tipo === 'egreso' || m.tipo === 'gasto')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0) || 0
    
    // Obtener caja para sumar monto inicial
    const { data: caja } = await supabase
      .from('cajas')
      .select('monto_inicial')
      .eq('id', cajaId)
      .single()
    
    const montoEsperado = parseFloat(caja.monto_inicial) + ingresos - egresos
    
    await supabase
      .from('cajas')
      .update({ monto_esperado: montoEsperado })
      .eq('id', cajaId)
  },

  // Cerrar caja
  async cerrarCaja(cajaId, montoReal, observaciones = '') {
    // Obtener monto esperado
    const { data: caja } = await supabase
      .from('cajas')
      .select('monto_esperado')
      .eq('id', cajaId)
      .single()
    
    const diferencia = montoReal - parseFloat(caja.monto_esperado || 0)
    
    const { data, error } = await supabase
      .from('cajas')
      .update({
        fecha_cierre: new Date().toISOString(),
        monto_real: montoReal,
        diferencia,
        estado: 'cerrada',
        observaciones
      })
      .eq('id', cajaId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Obtener movimientos de una caja
  async obtenerMovimientos(cajaId) {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return data || []
  },
// Obtener historial de cajas
  async obtenerHistorial(negocioId, limite = 10) {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')  // ✅ SIN EMBED
      .eq('negocio_id', negocioId)
      .order('fecha_apertura', { ascending: false })
      .limit(limite)
    
    if (error) throw error
    return data || []
  },

  // Obtener ventas de una caja específica
 async obtenerVentasDeCaja(cajaId) {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')  // ✅ SIN EMBED
      .eq('caja_id', cajaId)
      .order('fecha', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}