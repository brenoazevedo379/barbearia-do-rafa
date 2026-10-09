import { supabase } from './supabase'

// A tabela só pode ser lida/cancelada por usuários que passam pelas políticas RLS.
export async function buscarAgendaAdmin(dia) {
  const inicio = new Date(`${dia}T00:00:00-03:00`)
  if (Number.isNaN(inicio.getTime())) throw new Error('Data inválida')
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, barbeiro_id, servico_id, cliente_nome, cliente_whatsapp, inicio, fim, status, barbeiros(nome), servicos(nome, preco, duracao_minutos)')
    .gte('inicio', inicio.toISOString())
    .lt('inicio', fim.toISOString())
    .eq('status', 'confirmado')
    .order('inicio', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function cancelarAgendamentoAdmin(id) {
  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .eq('status', 'confirmado')
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível cancelar. Confira sua permissão e atualize a agenda.')
}
