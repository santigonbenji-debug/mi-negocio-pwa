// ============================================
// ¿QUÉ HACE ESTO?
// Todas las operaciones con productos (CRUD)
//
// ANALOGÍA:
// Como tener un encargado de depósito que:
// - Te muestra todos los productos (obtenerTodos)
// - Busca productos por nombre (buscar)
// - Agrega nuevos productos (crear)
// - Actualiza información (actualizar)
// - Suma stock rápido (agregarStock)
// - Desactiva productos sin borrarlos (desactivar)
//
// USO:
// const productos = await productosService.obtenerTodos(negocioId)
// await productosService.crear(negocioId, { nombre, precio, stock })
// ============================================

import { supabase } from './supabase'
import { validar, schemas } from '../utils/validaciones'

export const productosService = {
  // Obtener todos los productos del negocio
  async obtenerTodos(negocioId) {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre, color)')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return data || []
  },

  // Buscar productos por nombre
  async buscar(negocioId, termino) {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre, color)')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .ilike('nombre', `%${termino}%`)
      .order('nombre')

    if (error) throw error
    return data || []
  },

  // Crear producto
  async crear(negocioId, datosProducto) {
    const datosValidados = validar(schemas.producto, datosProducto)

    const { data, error } = await supabase
      .from('productos')
      .insert({ ...datosValidados, negocio_id: negocioId })
      .select('*, categorias(nombre, color)')
      .single()

    if (error) throw error
    return data
  },

  // Actualizar producto
  async actualizar(id, datosProducto) {
    const datosValidados = validar(schemas.producto, datosProducto)

    const { data, error } = await supabase
      .from('productos')
      .update(datosValidados)
      .eq('id', id)
      .select('*, categorias(nombre, color)')
      .single()

    if (error) throw error
    return data
  },

  // Actualizar múltiples productos a la vez
  async actualizarMuchos(ids, datos) {
    const { data, error } = await supabase
      .from('productos')
      .update(datos)
      .in('id', ids)
      .select('*, categorias(nombre, color)')

    if (error) throw error
    return data
  },

  // Actualizar solo el stock (más rápido)
  async actualizarStock(id, nuevoStock) {
    const { data, error } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Agregar stock (botones +1, +5, +10)
  async agregarStock(id, cantidad) {
    const { data: producto } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', id)
      .single()

    return this.actualizarStock(id, producto.stock_actual + cantidad)
  },

  // Desactivar (no eliminar para mantener historial)
  async desactivar(id) {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Eliminar permanentemente de la BD
  async eliminar(id) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Productos con stock bajo
  async stockBajo(negocioId) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .filter('stock_actual', 'lte', supabase.raw('stock_minimo'))

    if (error) throw error
    return data || []
  }
}