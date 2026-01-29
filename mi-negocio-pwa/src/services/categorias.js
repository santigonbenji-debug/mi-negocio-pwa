import { supabase } from './supabase'
import { validar, schemas } from '../utils/validaciones'

export const categoriasService = {
  async obtenerTodas(negocioId) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .order('nombre')
    if (error) throw error
    return data || []
  },

  async crear(negocioId, datos) {
    const validados = validar(schemas.categoria, datos)
    const { data, error } = await supabase
      .from('categorias')
      .insert({ ...validados, negocio_id: negocioId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async actualizar(id, datos) {
    const validados = validar(schemas.categoria, datos)
    const { data, error } = await supabase
      .from('categorias')
      .update(validados)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async eliminar(id) {
    const { error } = await supabase
      .from('categorias')
      .update({ activo: false })
      .eq('id', id)
    if (error) throw error
  }
}
