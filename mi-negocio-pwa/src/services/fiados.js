// ============================================
// ¿QUÉ HACE ESTO?
// Maneja clientes fiados y sus deudas
//
// ANALOGÍA:
// Como tener un cuaderno de fiados donde:
// - Anotas cada compra que hace el cliente
// - Anotas cada pago que realiza
// - Calculas automáticamente cuánto debe
//
// USO:
// await fiadosService.obtenerTodos(negocioId)
// await fiadosService.registrarPago(fiadoId, monto)
// ============================================

import { supabase } from './supabase'

export const fiadosService = {
  // Obtener todos los clientes con deuda
  async obtenerTodos(negocioId) {
    const { data, error } = await supabase
      .from('fiados_con_deuda')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('deuda_total', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Obtener cliente específico con deuda
  async obtenerPorId(fiadoId) {
    const { data, error } = await supabase
      .from('fiados_con_deuda')
      .select('*')
      .eq('id', fiadoId)
      .single()

    if (error) throw error
    return data
  },

  // Obtener movimientos de un cliente
  async obtenerMovimientos(fiadoId) {
    const { data, error } = await supabase
      .from('fiados_movimientos')
      .select('*')
      .eq('fiado_id', fiadoId)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Registrar pago
  async registrarPago(fiadoId, monto, descripcion = 'Pago') {
    const { data, error } = await supabase
      .from('fiados_movimientos')
      .insert({
        fiado_id: fiadoId,
        tipo: 'pago',
        monto,
        descripcion
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Crear nuevo cliente
  async crear(negocioId, clienteNombre, telefono = null) {
    const { data, error } = await supabase
      .from('fiados')
      .insert({
        negocio_id: negocioId,
        cliente_nombre: clienteNombre,
        telefono
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Actualizar datos del cliente
  async actualizar(fiadoId, datos) {
    const { data, error } = await supabase
      .from('fiados')
      .update(datos)
      .eq('id', fiadoId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Eliminar cliente (solo si no tiene deuda)
  async eliminar(fiadoId) {
    // Verificar que no tenga deuda
    const cliente = await this.obtenerPorId(fiadoId)
    if (cliente.deuda_total > 0) {
      throw new Error('No se puede eliminar un cliente con deuda pendiente')
    }

    const { error } = await supabase
      .from('fiados')
      .delete()
      .eq('id', fiadoId)

    if (error) throw error
  },
  // Obtener movimientos de un cliente CON DETALLES DE VENTA
  // Obtener movimientos de un cliente (SIN EMBEDS)
  async obtenerMovimientos(fiadoId) {
    const { data: movimientos, error } = await supabase
      .from('fiados_movimientos')
      .select('*')
      .eq('fiado_id', fiadoId)
      .order('fecha', { ascending: false })

    if (error) throw error
    return movimientos || []
  },

  // Obtener estadísticas
  async obtenerEstadisticas(negocioId) {
    const clientes = await this.obtenerTodos(negocioId)

    // Deuda es cuando deuda_total > 0
    // Saldo a favor es cuando deuda_total < 0
    let totalDeuda = 0
    let totalSaldoAFavor = 0
    let clientesConDeudaLabels = 0
    let clientesConSaldo = 0
    let deudaMasAlta = 0

    clientes.forEach(c => {
      const deuda = parseFloat(c.deuda_total)
      if (deuda > 0) {
        totalDeuda += deuda
        clientesConDeudaLabels++
        if (deuda > deudaMasAlta) deudaMasAlta = deuda
      } else if (deuda < 0) {
        totalSaldoAFavor += Math.abs(deuda)
        clientesConSaldo++
      }
    })

    return {
      totalDeuda,
      totalSaldoAFavor,
      clientesConDeuda: clientesConDeudaLabels,
      clientesConSaldo,
      totalClientes: clientes.length,
      deudaMasAlta
    }
  }


}