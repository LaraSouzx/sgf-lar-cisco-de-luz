import { supabase } from '../lib/supabaseClient'

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error('E-mail ou senha inválidos')
  }
}
