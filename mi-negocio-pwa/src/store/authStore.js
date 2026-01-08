import { create } from 'zustand'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  userData: null, // Datos completos del usuario (con negocio_id)
  loading: true,

  setUser: (user, userData) => set({ user, userData, loading: false }),

  inicializar: async () => {
    try {
      const user = await authService.usuarioActual()
      
      if (user) {
        // Obtener datos completos del usuario de la tabla usuarios
        const { data: userData } = await supabase
          .from('usuarios')
          .select('*, negocios(*)')
          .eq('id', user.id)
          .single()
        
        set({ user, userData, loading: false })
      } else {
        set({ user: null, userData: null, loading: false })
      }
    } catch (error) {
      set({ user: null, userData: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await authService.login(email, password)
    
    // Obtener datos completos
    const { data: userData } = await supabase
      .from('usuarios')
      .select('*, negocios(*)')
      .eq('id', data.user.id)
      .single()
    
    set({ user: data.user, userData })
    return data
  },

  registro: async (email, password, nombre) => {
    const data = await authService.registro(email, password, nombre)
    set({ user: data.user })
    return data
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, userData: null })
  }
}))