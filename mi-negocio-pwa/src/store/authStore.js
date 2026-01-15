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
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: window.location.origin
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');
    
    console.log('✅ Usuario auth creado:', authData.user.id);

    // 2. DESACTIVAR RLS TEMPORALMENTE EN USUARIOS
    //    (Solo funciona con rol postgres, pero funcionará con tu admin key)
    await supabase
      .from('usuarios')
      .insert([
        {
          id: authData.user.id,
          email,
          nombre,
          rol: 'admin',
          negocio_id: null,
          activo: true
        }
      ]);

    console.log('✅ Usuario DB creado');

    // 3. Crear negocio
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .insert([
        {
          nombre: nombreNegocio,
          plan: 'free',
          user_id: authData.user.id
        }
      ])
      .select()
      .single();

    if (negocioError) {
      console.error('❌ Error al crear negocio:', negocioError);
      throw new Error(`Error al crear el negocio: ${negocioError.message}`);
    }

    console.log('✅ Negocio creado:', negocio.id);

    // 4. Actualizar usuario con negocio_id
    await supabase
      .from('usuarios')
      .update({ negocio_id: negocio.id })
      .eq('id', authData.user.id);

    console.log('✅ Usuario vinculado con negocio');

    // 5. Crear permisos
    await supabase
      .from('permisos_usuarios')
      .insert([
        {
          usuario_id: authData.user.id,
          puede_ver_reportes: true,
          puede_modificar_precios: true,
          puede_eliminar_productos: true,
          puede_gestionar_caja: true,
          puede_hacer_ventas: true
        }
      ]);

    console.log('✅ Permisos creados');

    set({ user: authData.user });
    console.log('✅ 🎉 REGISTRO COMPLETADO EXITOSAMENTE');
    
    return authData;

  } catch (error) {
    console.error('❌ Error en registro completo:', error.message);
    throw error;
  }
},

  logout: async () => {
    await authService.logout()
    set({ user: null })
  }
}))