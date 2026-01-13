import { supabase } from './supabase'

export const usuariosService = {
  async obtenerTodos(negocioId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('creado_en', { ascending: false })

    if (error) throw error
    return data || []
  },

  async crear(email, password, nombre, rol, negocioId) {
    try {
      // 1. Validar que exista el negocio
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('id')
        .eq('id', negocioId)
        .single()

      if (negocioError || !negocio) {
        throw new Error('El negocio no existe. Contacta soporte.')
      }

      // 2. Crear usuario usando registro estándar
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

      // 3. Crear entrada en tabla usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre,
          rol,
          negocio_id: negocioId,
          activo: true
        })
        .select()
        .single()

      if (userError) {
        console.error('Error al crear usuario en DB:', userError)
        throw userError
      }

      // 4. Crear permisos por defecto
      const permisosPorDefecto = rol === 'admin' ? {
        puede_ver_reportes: true,
        puede_modificar_precios: true,
        puede_eliminar_productos: true,
        puede_gestionar_caja: true,
        puede_hacer_ventas: true
      } : {
        puede_ver_reportes: false,
        puede_modificar_precios: false,
        puede_eliminar_productos: false,
        puede_gestionar_caja: true,
        puede_hacer_ventas: true
      }

      await supabase
        .from('permisos_usuarios')
        .insert({
          usuario_id: authData.user.id,
          ...permisosPorDefecto
        })

      return userData
    } catch (error) {
      console.error('Error al crear usuario:', error)
      throw error
    }
  },

  async toggleActivo(userId, activo) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ activo })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },
 

  async cambiarRol(userId, nuevoRol) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },
   async eliminar(userId) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId)

  if (error) throw error
},

  generarMensajeWhatsApp(nombre, email, password, urlApp = window.location.origin) {
    return `🏪 *Acceso al Sistema de Gestion*

Hola ${nombre},

Te han dado acceso al sistema. Aqui estan tus credenciales:

📧 *Email:* ${email}
🔑 *Contraseña:* ${password}
🔗 *Link:* ${urlApp}

_Por seguridad, cambia tu contraseña despues de iniciar sesion._`
  }
  
}
