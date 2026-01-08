// ============================================
// ¿QUÉ HACE ESTO?
// Conecta tu aplicación con la base de datos Supabase
//
// ANALOGÍA:
// Como tener el teléfono de tu proveedor - cuando necesitas
// mercadería, lo llamas y te la envía. Acá "llamas" a Supabase
// cada vez que necesitas guardar o leer datos.
//
// USO:
// import { supabase } from './services/supabase'
// const { data } = await supabase.from('productos').select('*')
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Faltan las llaves de Supabase en el archivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)