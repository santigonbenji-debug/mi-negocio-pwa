// ============================================
// ¿QUÉ HACE ESTO?
// Funciones para registrar usuarios, hacer login y cerrar sesión
//
// ANALOGÍA:
// Como el sistema de llaves de tu negocio:
// - registro() = hacer copia de llave nueva
// - login() = abrir la puerta con tu llave
// - logout() = cerrar y dejar la llave
// - usuarioActual() = verificar quién está adentro
//
// USO:
// await authService.login(email, password)
// await authService.registro(email, password, nombre)
// ============================================

import { supabase } from './supabase'

export const authService = {
  // Registrar nuevo usuario
  async registro(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }
      }
    })
    if (error) throw error
    return data
  },

  // Iniciar sesión
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Usuario actual
  async usuarioActual() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}