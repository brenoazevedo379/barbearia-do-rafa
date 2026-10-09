import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'
import { verificarAdmin, sairAdmin } from './adminAuth'
import { buscarBarbeiros, buscarServicos, buscarHorariosOcupados, criarAgendamento } from './agendaApi'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Scissors,
  ShieldCheck,
  UserRound,
  MessageCircle,
} from 'lucide-react'

const OPEN_MINUTES = 9 * 60
const CLOSE_MINUTES = 20 * 60
const SLOT_STEP = 15
const SHOP_WHATSAPP = '5571999999999' // troque pelo WhatsApp real da barbearia

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(
    new Date(`${dateString}T12:00:00`),
  )
}

function minutesToTime(total) {
  const h = Math.floor(total / 60).toString().padStart(2, '0')
  const m = (total % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + durationA
  const endB = startB + durationB
  return startA < endB && startB < endA
}

function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

function StepBar({ step }) {
  const steps = ['Barbeiro', 'Serviço', 'Data e horário', 'Contato']
  return (
    <div className="step-bar" aria-label={`Etapa ${step} de 4`}>
      {steps.map((label, index) => (
        <div key={label} className={`step-dot ${index + 1 <= step ? 'active' : ''}`}>
          <span>{index + 1}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [view, setView] = useState('booking')
  const [adminAutorizado, setAdminAutorizado] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [busy, setBusy] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastBooking, setLastBooking] = useState(null)

  useEffect(() => {
    let ativo = true
    verificarAdmin().then(ok => { if (ativo) setAdminAutorizado(ok) })
      .catch(error => { console.error(error); if (ativo) setAdminAutorizado(false) })
      .finally(() => { if (ativo) setAuthLoading(false) })
    return () => { ativo = false }
  }, [])

  async function fazerLogout() {
    try { await sairAdmin() }
    catch (error) { console.error(error); window.alert('Não foi possível encerrar a sessão. Tente novamente.'); return }
    setAdminAutorizado(false)
    setView('booking')
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([buscarBarbeiros(), buscarServicos()]).then(([bs, ss]) => {
      if (cancelled) return
      setBarbers(bs.map(b => ({ id: b.id, name: b.nome,
        specialty: b.especialidade || '', initials: b.nome.slice(0, 2).toUpperCase() })))
      setServices(ss.map(s => ({ id: s.id, name: s.nome,
        price: Number(s.preco), duration: s.duracao_minutos,
        description: `${s.duracao_minutos} minutos` })))
    }).catch(error => {
      console.error(error)
      if (!cancelled) setCatalogError('Não foi possível carregar os serviços. Atualize a página.')
    }).finally(() => { if (!cancelled) setCatalogLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!barberId || !date) return
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError('')
    setBusy([])
    setTime('')
    buscarHorariosOcupados(barberId, date).then(horarios => {
      if (!cancelled) setBusy(horarios)
    }).catch(error => {
      console.error(error)
      if (!cancelled) setSlotsError('Não foi possível consultar a agenda. Tente novamente.')
    }).finally(() => { if (!cancelled) setSlotsLoading(false) })
    return () => { cancelled = true }
  }, [barberId, date])

  const selectedBarber = barbers.find(b => b.id === barberId)
  const selectedService = services.find(s => s.id === serviceId)

  const availableSlots = useMemo(() => {
    if (!selectedBarber || !selectedService || slotsLoading || slotsError) return []
    const slots = []
    for (let start = OPEN_MINUTES; start + selectedService.duration <= CLOSE_MINUTES; start += SLOT_STEP) {
      const proposed = new Date(`${date}T${minutesToTime(start)}:00-03:00`)
      const end = new Date(proposed.getTime() + selectedService.duration * 60_000)
      if (proposed <= new Date()) continue
      if (!busy.some(a => proposed < new Date(a.fim) && end > new Date(a.inicio))) {
        slots.push(minutesToTime(start))
      }
    }
    return slots
  }, [selectedBarber, selectedService, busy, date, slotsLoading, slotsError])

  const slotGroups = useMemo(() => ({
    Manhã: availableSlots.filter((slot) => timeToMinutes(slot) < 12 * 60),
    Tarde: availableSlots.filter((slot) => {
      const m = timeToMinutes(slot)
      return m >= 12 * 60 && m < 18 * 60
    }),
    Noite: availableSlots.filter((slot) => timeToMinutes(slot) >= 18 * 60),
  }), [availableSlots])

  function resetFlow() {
    setStep(1)
    setBarberId('')
    setServiceId('')
    setDate(todayISO())
    setTime('')
    setName('')
    setPhone('')
    setLastBooking(null)
    setView('booking')
  }

  async function confirmBooking(e) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (submitting || !name.trim() || digits.length < 10 || digits.length > 13 ||
        !selectedBarber || !selectedService || !time || slotsLoading || slotsError) return
    setSubmitting(true)
    try {
      // O banco calcula a duração e rejeita conflitos concorrentes.
      const inicio = new Date(`${date}T${time}:00-03:00`).toISOString()
      const id = await criarAgendamento({
        barbeiroId: barberId, servicoId: serviceId, clienteNome: name.trim(),
        clienteWhatsapp: digits, inicio,
      })
      setLastBooking({
        id, barberId, barberName: selectedBarber.name,
        serviceId, serviceName: selectedService.name,
        price: selectedService.price, duration: selectedService.duration,
        date, time, clientName: name.trim(), phone: digits,
      })
      setView('success')
    } catch (error) {
      console.error(error)
      alert('Não foi possível confirmar a reserva. O horário pode ter sido ocupado ou a conexão falhou. Escolha novamente.')
      setTime('')
      setStep(3)
      setSlotsLoading(true)
      try {
        setBusy(await buscarHorariosOcupados(barberId, date))
        setSlotsError('')
      } catch {
        setSlotsError('Não foi possível atualizar a agenda. Recarregue o site.')
      } finally {
        setSlotsLoading(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function whatsappLink(booking) {
    const message = [
      'Olá! Acabei de fazer um agendamento pelo site da Barbearia do Rafa.',
      '',
      `Cliente: ${booking.clientName}`,
      `Barbeiro: ${booking.barberName}`,
      `Serviço: ${booking.serviceName}`,
      `Data: ${formatDate(booking.date)}`,
      `Horário: ${booking.time}`,
      `Valor: ${money(booking.price)}`,
    ].join('\n')
    return `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(message)}`
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetFlow} aria-label="Ir para início">
          <span className="brand-icon"><Scissors size={20} /></span>
          <span><strong>Barbearia do Rafa</strong><small>Agendamento online</small></span>
        </button>
        <button className="admin-link" onClick={() => setView(view === 'admin' ? 'booking' : 'admin')}>
          {view === 'admin' ? 'Agendar' : 'Painel'}
        </button>
      </header>

      {view === 'booking' && (
        <>
          <section className="hero">
            <div>
              <span className="pill"><ShieldCheck size={15} /> rápido, simples e sem ligação</span>
              <h1>Seu horário.<br/><em>Seu estilo.</em></h1>
              <p>Escolha o profissional, o serviço e o melhor horário em poucos toques.</p>
            </div>
            <div className="hero-mark">R</div>
          </section>

          <StepBar step={step} />

          <section className="card main-card">
            {step === 1 && (
              <>
                <SectionTitle eyebrow="01 / PROFISSIONAL" title="Com quem você quer cortar?" subtitle="Toque em um barbeiro para continuar." />
                {catalogLoading && <p className="empty">Carregando profissionais...</p>}
                {catalogError && <p role="alert" className="empty">{catalogError}</p>}
                <div className="barber-grid">
                  {barbers.map((barber) => (
                    <button key={barber.id} className={`barber-card ${barberId === barber.id ? 'selected' : ''}`} onClick={() => { setBarberId(barber.id); setTime('') }}>
                      <div className="avatar">{barber.initials}</div>
                      <div><strong>{barber.name}</strong><span>{barber.specialty}</span></div>
                      <span className="check"><Check size={16}/></span>
                    </button>
                  ))}
                </div>
                <button className="primary" disabled={!barberId || !!catalogError || catalogLoading} onClick={() => setStep(2)}>Continuar</button>
              </>
            )}

            {step === 2 && (
              <>
                <button className="back" onClick={() => setStep(1)}><ChevronLeft size={18}/> Voltar</button>
                <SectionTitle eyebrow="02 / SERVIÇO" title="O que vamos fazer hoje?" subtitle={`Agenda de ${selectedBarber?.name}.`} />
                {catalogLoading && <p className="empty">Carregando serviços...</p>}
                {catalogError && <p role="alert" className="empty">{catalogError}</p>}
                <div className="service-list">
                  {services.map((service) => (
                    <button key={service.id} className={`service-card ${serviceId === service.id ? 'selected' : ''}`} onClick={() => { setServiceId(service.id); setTime('') }}>
                      <div className="service-main"><strong>{service.name}</strong><span>{service.description}</span></div>
                      <div className="service-meta"><b>{money(service.price)}</b><small><Clock3 size={14}/>{service.duration} min</small></div>
                    </button>
                  ))}
                </div>
                <button className="primary" disabled={!serviceId || !!catalogError || catalogLoading} onClick={() => setStep(3)}>Escolher data e horário</button>
              </>
            )}

            {step === 3 && (
              <>
                <button className="back" onClick={() => setStep(2)}><ChevronLeft size={18}/> Voltar</button>
                <SectionTitle eyebrow="03 / AGENDA" title="Quando fica melhor para você?" subtitle={`${selectedService?.name} · ${selectedService?.duration} min com ${selectedBarber?.name}`} />
                <label className="date-field"><CalendarDays size={18}/><span>Data</span><input type="date" min={todayISO()} value={date} onChange={(e) => { setDate(e.target.value); setTime('') }}/></label>
                {slotsLoading && <p className="empty">Consultando horários...</p>}
                {slotsError && <p role="alert" className="empty">{slotsError}</p>}
                <div className="slot-sections">
                  {Object.entries(slotGroups).map(([label, slots]) => (
                    <div key={label} className="slot-group">
                      <h3>{label}</h3>
                      {slots.length ? <div className="slot-grid">{slots.map((slot) => <button key={slot} onClick={() => setTime(slot)} className={time === slot ? 'selected' : ''}>{slot}</button>)}</div> : <p className="empty">Sem horários livres.</p>}
                    </div>
                  ))}
                </div>
                <button className="primary" disabled={!time || slotsLoading || !!slotsError} onClick={() => setStep(4)}>Continuar com {time || 'horário'}</button>
              </>
            )}

            {step === 4 && (
              <>
                <button className="back" onClick={() => setStep(3)}><ChevronLeft size={18}/> Voltar</button>
                <SectionTitle eyebrow="04 / CONTATO" title="Só falta seus dados" subtitle="Usaremos seu WhatsApp apenas para identificar e confirmar o horário." />
                <div className="mini-summary">
                  <div><UserRound size={18}/><span>{selectedBarber?.name}</span></div>
                  <div><Scissors size={18}/><span>{selectedService?.name}</span></div>
                  <div><CalendarDays size={18}/><span>{formatDate(date)} · {time}</span></div>
                </div>
                <form onSubmit={confirmBooking} className="form">
                  <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required /></label>
                  <label>WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(71) 99999-9999" inputMode="tel" required /></label>
                  <button className="primary" type="submit" disabled={submitting || slotsLoading || !!slotsError}>{submitting ? "Confirmando..." : "Confirmar agendamento"}</button>
                </form>
              </>
            )}
          </section>
        </>
      )}

      {view === 'success' && lastBooking && (
        <section className="card success-card">
          <div className="success-icon"><Check size={34}/></div>
          <span className="success-label">AGENDAMENTO CONFIRMADO</span>
          <h2>Tá marcado, {lastBooking.clientName.split(' ')[0]}!</h2>
          <p>Seu horário foi salvo na agenda da barbearia.</p>
          <div className="receipt">
            <div><span>Profissional</span><strong>{lastBooking.barberName}</strong></div>
            <div><span>Serviço</span><strong>{lastBooking.serviceName}</strong></div>
            <div><span>Data</span><strong>{formatDate(lastBooking.date)}</strong></div>
            <div><span>Horário</span><strong>{lastBooking.time}</strong></div>
            <div><span>Duração</span><strong>{lastBooking.duration} min</strong></div>
            <div><span>Valor</span><strong>{money(lastBooking.price)}</strong></div>
          </div>
          <a className="whatsapp" href={whatsappLink(lastBooking)} target="_blank" rel="noreferrer"><MessageCircle size={19}/> Confirmar no WhatsApp</a>
          <button className="ghost" onClick={resetFlow}>Fazer outro agendamento</button>
        </section>
      )}

      {view === 'admin' && (
        authLoading ? <section className="card main-card"><p>Verificando acesso...</p></section> :
        adminAutorizado ? <AdminPanel barbers={barbers} onLogout={fazerLogout} /> :
        <AdminLogin onAuthenticated={() => setAdminAutorizado(true)} />
      )}
      <footer>Barbearia do Rafa · atendimento com hora marcada</footer>
    </main>
  )
}

export default App

