import { create } from 'zustand'
import { categoriasService } from '../services/categorias'

export const useCategoriasStore = create((set, get) => ({
  categorias: [],
  cargando: false,

  cargarCategorias: async (negocioId) => {
    set({ cargando: true })
    try {
      const data = await categoriasService.obtenerTodas(negocioId)
      set({ categorias: data, cargando: false })
    } catch (error) {
      console.error(error)
      set({ cargando: false })
    }
  },

  agregarCategoria: async (negocioId, datos) => {
    const nueva = await categoriasService.crear(negocioId, datos)
    set({ categorias: [...get().categorias, nueva] })
    return nueva
  },

  actualizarCategoria: async (id, datos) => {
    const actualizada = await categoriasService.actualizar(id, datos)
    set({
      categorias: get().categorias.map(c => c.id === id ? actualizada : c)
    })
  },

  eliminarCategoria: async (id) => {
    await categoriasService.eliminar(id)
    set({ categorias: get().categorias.filter(c => c.id !== id) })
  }
}))
