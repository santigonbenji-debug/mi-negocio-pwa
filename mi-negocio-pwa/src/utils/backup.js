// ============================================
// SISTEMA DE BACKUP COMPLETO
// Descarga TODOS los datos del negocio en JSON
// ============================================

import { supabase } from '../services/supabase'

export const generarBackup = async (negocioId) => {
  try {
    const backup = {
      fecha_backup: new Date().toISOString(),
      negocio_id: negocioId,
      version: '1.0'
    }

    // Obtener negocio
    const { data: negocio } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocioId)
      .single()
    backup.negocio = negocio

    // Obtener usuarios
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('*')
      .eq('negocio_id', negocioId)
    backup.usuarios = usuarios

    // Obtener productos
    const { data: productos } = await supabase
      .from('productos')
      .select('*')
      .eq('negocio_id', negocioId)
    backup.productos = productos

    // Obtener cajas
    const { data: cajas } = await supabase
      .from('cajas')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha_apertura', { ascending: false })
    backup.cajas = cajas

    // Obtener movimientos de caja
    const cajaIds = cajas?.map(c => c.id) || []
    const { data: movimientos_caja } = await supabase
      .from('movimientos_caja')
      .select('*')
      .in('caja_id', cajaIds)
    backup.movimientos_caja = movimientos_caja

    // Obtener ventas
    const { data: ventas } = await supabase
      .from('ventas')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false })
    backup.ventas = ventas

    // Obtener items de ventas
    const ventaIds = ventas?.map(v => v.id) || []
    const { data: ventas_items } = await supabase
      .from('ventas_items')
      .select('*')
      .in('venta_id', ventaIds)
    backup.ventas_items = ventas_items

    // Obtener fiados
    const { data: fiados } = await supabase
      .from('fiados')
      .select('*')
      .eq('negocio_id', negocioId)
    backup.fiados = fiados

    // Obtener movimientos de fiados
    const fiadoIds = fiados?.map(f => f.id) || []
    const { data: fiados_movimientos } = await supabase
      .from('fiados_movimientos')
      .select('*')
      .in('fiado_id', fiadoIds)
    backup.fiados_movimientos = fiados_movimientos

    // Obtener permisos
    const usuarioIds = usuarios?.map(u => u.id) || []
    const { data: permisos } = await supabase
      .from('permisos_usuarios')
      .select('*')
      .in('usuario_id', usuarioIds)
    backup.permisos_usuarios = permisos

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0]
    const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `backup_${fecha}_${hora}.json`

    // Descargar archivo
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    return {
      success: true,
      registros: {
        productos: productos?.length || 0,
        ventas: ventas?.length || 0,
        cajas: cajas?.length || 0,
        fiados: fiados?.length || 0
      }
    }
  } catch (error) {
    console.error('Error en backup:', error)
    throw error
  }
}