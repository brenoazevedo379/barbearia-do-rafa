import { supabase } from './supabase'

export async function entrarAdmin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error) throw error
  return data
}

export async function verificarAdmin() {
  const { data: usuario, error: erroUsuario } =
    await supabase.auth.getUser()

  if (erroUsuario || !usuario.user) return false

  const { data, error } = await supabase
    .from('administradores')
    .select('usuario_id')
    .eq('usuario_id', usuario.user.id)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function sairAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
