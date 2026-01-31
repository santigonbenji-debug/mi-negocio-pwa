import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useEmailVerification = (user) => {
  const [emailVerified, setEmailVerified] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkEmailStatus = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      // Primero verificar si hay una sesion activa
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setEmailVerified(false)
        setChecking(false)
        return
      }

      // Solo si hay sesion, obtener el usuario
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      setEmailVerified(currentUser?.email_confirmed_at !== null)
      setChecking(false)
    }

    checkEmailStatus()

    // Suscribirse a cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setEmailVerified(session?.user?.email_confirmed_at !== null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [user])

  return { emailVerified, checking }
}
