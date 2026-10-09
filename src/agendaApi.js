import { supabase } from './supabase'

export async function buscarBarbeiros() {
  const { data, error } = await supabase.from('barbeiros')
    .select('id, nome, especialidade, foto_url').eq('ativo', true).order('nome')
  if (error) throw error
  return data
}
export async function buscarServicos() {
  const { data, error } = await supabase.from('servicos')
    .select('id, nome, preco, duracao_minutos').eq('ativo', true).order('nome')
  if (error) throw error
  return data
}
export async function buscarHorariosOcupados(barbeiroId, data) {
  const result = await supabase.rpc('horarios_ocupados', {
    p_barbeiro_id: barbeiroId, p_data: data,
  })
  if (result.error) throw result.error
  return result.data || []
}
export async function criarAgendamento({ barbeiroId, servicoId, clienteNome, clienteWhatsapp, inicio }) {
  const { data, error } = await supabase.rpc('criar_agendamento', {
    p_barbeiro_id: barbeiroId,
    p_servico_id: servicoId,
    p_cliente_nome: clienteNome,
    p_cliente_whatsapp: clienteWhatsapp,
    p_inicio: inicio,
  })
  if (error) throw error
  return data
}
