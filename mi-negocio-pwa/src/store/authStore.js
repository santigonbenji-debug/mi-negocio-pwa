// ============================================
// ¿QUÉ HACE ESTO?
// Guarda el usuario actual en toda la aplicación
//
// ANALOGÍA:
// Como tener una pizarra en tu negocio que dice:
// "Hoy está trabajando: [nombre del empleado]"
// Cualquier parte de tu app puede mirar esta pizarra
//
// USO:
// const { user, login, logout } = useAuthStore()
// await login(email, password)
// ============================================

import { create } from 'zustand'
import { authService } from '../services/auth'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  inicializar: async () => {
    try {
      const user = await authService.usuarioActual()
      set({ user, loading: false })
    } catch (error) {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await authService.login(email, password)
    set({ user: data.user })
    return data
  },

  registro: async (email, password, nombre) => {
    const data = await authService.registro(email, password, nombre)
    set({ user: data.user })
    return data
  },

  logout: async () => {
    await authService.logout()
    set({ user: null })
  }
}))