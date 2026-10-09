import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Download, LogOut, RefreshCw, Trash2, UsersRound, WalletCards } from 'lucide-react'
import { buscarAgendaAdmin, cancelarAgendamentoAdmin } from './adminApi'

const TIMEZONE = 'America/Bahia'
function diaHoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function horario(instant) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(instant))
}
function dinheiro(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
function csvCampo(v) { return `"${String(v ?? '').replaceAll('"', '""')}"` }

export default function AdminPanel({ barbers, onLogout }) {
  const [dia, setDia] = useState(diaHoje)
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [cancelando, setCancelando] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try { setLista(await buscarAgendaAdmin(dia)) }
    catch (e) { console.error(e); setErro('Não foi possível carregar a agenda. Verifique se esta conta está autorizada no Supabase.') }
    finally { setCarregando(false) }
  }, [dia])

  useEffect(() => { carregar() }, [carregar])

  const grupos = useMemo(() => {
    const mapa = new Map(barbers.map(b => [b.id, { id: b.id, nome: b.name, registros: [] }]))
    for (const a of lista) {
      if (!mapa.has(a.barbeiro_id)) mapa.set(a.barbeiro_id, { id: a.barbeiro_id, nome: a.barbeiros?.nome || 'Profissional', registros: [] })
      mapa.get(a.barbeiro_id).registros.push(a)
    }
    return [...mapa.values()]
  }, [barbers, lista])
  const total = lista.reduce((v, a) => v + Number(a.servicos?.preco || 0), 0)

  async function cancelar(a) {
    if (cancelando || !window.confirm(`Cancelar ${a.servicos?.nome || 'atendimento'} de ${a.cliente_nome} às ${horario(a.inicio)}?`)) return
    setCancelando(a.id)
    try { await cancelarAgendamentoAdmin(a.id); await carregar() }
    catch (e) { console.error(e); window.alert(e.message || 'Erro ao cancelar o agendamento.') }
    finally { setCancelando('') }
  }

  function exportar() {
    const linhas = [
      ['Data', 'Horário', 'Barbeiro', 'Cliente', 'WhatsApp', 'Serviço', 'Duração (min)', 'Valor'],
      ...lista.map(a => [dia, horario(a.inicio), a.barbeiros?.nome, a.cliente_nome, a.cliente_whatsapp, a.servicos?.nome, a.servicos?.duracao_minutos, Number(a.servicos?.preco || 0).toFixed(2)])
    ]
    const conteudo = '\uFEFF' + linhas.map(l => l.map(csvCampo).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `agenda-${dia}.csv`; link.click()
    URL.revokeObjectURL(url)
  }

  return <section className="admin-wrap">
    <div className="admin-header">
      <div className="section-title"><span>PAINEL INTERNO</span><h2>Agenda da barbearia</h2><p>Reservas confirmadas, por profissional.</p></div>
      <button className="admin-exit" onClick={onLogout}><LogOut size={16}/> Sair</button>
    </div>
    <div className="admin-toolbar card">
      <label><CalendarDays size={17}/> Data <input aria-label="Data da agenda" type="date" value={dia} onChange={e => setDia(e.target.value)} /></label>
      <div className="admin-toolbar-actions">
        <button onClick={carregar} disabled={carregando}><RefreshCw size={16}/> Atualizar</button>
        <button onClick={exportar} disabled={!lista.length || carregando}><Download size={16}/> CSV</button>
      </div>
    </div>
    {erro && <p className="admin-error" role="alert">{erro}</p>}
    {carregando && <p className="empty" role="status">Consultando agenda...</p>}
    {!carregando && !erro && <>
      <div className="stats">
        <div className="stat card"><UsersRound/><span>{lista.length}</span><small>agendamentos</small></div>
        <div className="stat card"><WalletCards/><span>{dinheiro(total)}</span><small>valor previsto</small></div>
      </div>
      {grupos.length === 0 && <p className="empty">Nenhum profissional cadastrado.</p>}
      {grupos.map(g => <div className="barber-agenda card" key={g.id}>
        <div className="agenda-head"><div className="avatar small">{g.nome.slice(0,2).toUpperCase()}</div><div><strong>{g.nome}</strong><span>{g.registros.length} atendimento(s)</span></div></div>
        {!g.registros.length ? <p className="empty admin-empty">Nenhum horário marcado.</p> :
        <div className="appointments">{g.registros.map(a => <article className="appointment-row" key={a.id}>
          <time>{horario(a.inicio)}</time>
          <div className="appointment-details"><strong>{a.cliente_nome}</strong><span>{a.servicos?.nome || 'Serviço'} · {a.servicos?.duracao_minutos ?? '?'} min · {dinheiro(Number(a.servicos?.preco || 0))}</span><small>{a.cliente_whatsapp}</small></div>
          <button title="Cancelar agendamento" aria-label={`Cancelar reserva de ${a.cliente_nome}`} disabled={!!cancelando} onClick={() => cancelar(a)}><Trash2 size={17}/></button>
        </article>)}</div>}
      </div>)}
    </>}
  </section>
}
