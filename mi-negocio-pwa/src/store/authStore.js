import { create } from 'zustand'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  inicializar: async () => {
    try {
      const authUser = await authService.usuarioActual()

      if (authUser) {
        const { data: userData, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error al obtener datos de usuario:', error)
          set({ user: authUser, loading: false })
          return
        }

        if (!userData.activo) {
          await authService.logout()
          set({ user: null, loading: false })
          return
        }

        const userCompleto = {
          ...authUser,
          rol: userData?.rol || 'empleado',
          negocio_id: userData?.negocio_id,
          nombre: userData?.nombre,
          activo: userData?.activo
        }

        console.log('Usuario cargado:', userCompleto)
        set({ user: userCompleto, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error) {
      console.error('Error al inicializar:', error)
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await authService.login(email, password)

    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (error) {
      console.error('Error al obtener datos de usuario:', error)
      set({ user: data.user })
      return data
    }

    if (!userData.activo) {
      await authService.logout()
      throw new Error('Usuario desactivado. Contacta al administrador.')
    }

    const userCompleto = {
      ...data.user,
      rol: userData?.rol || 'empleado',
      negocio_id: userData?.negocio_id,
      nombre: userData?.nombre,
      activo: userData?.activo
    }

    console.log('Login exitoso:', userCompleto)
    set({ user: userCompleto })
    return data
  },

  registro: async (email, password, nombre, nombreNegocio) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
          emailRedirectTo: window.location.origin
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      console.log('✅ Usuario creado en Auth:', authData.user.id)

      const { data, error } = await supabase.rpc('registrar_usuario_completo', {
        p_user_id: authData.user.id,
        p_email: email,
        p_nombre: nombre,
        p_nombre_negocio: nombreNegocio
      })

      if (error) {
        console.error('❌ Error en función de registro:', error)
        throw new Error('Error al completar el registro')
      }

      console.log('✅ Registro completado:', data)

      set({ user: authData.user })
      return authData
    } catch (error) {
      console.error('❌ Error en registro:', error)
      throw error
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null })
  }
}))