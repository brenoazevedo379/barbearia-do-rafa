import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Download,
  Scissors,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
  MessageCircle,
} from 'lucide-react'

const BARBERS = [
  { id: 'rafael', name: 'Rafael', specialty: 'Cortes clássicos & degradê', initials: 'RF' },
  { id: 'diego', name: 'Diego', specialty: 'Fade, navalhado & freestyle', initials: 'DG' },
  { id: 'lucas', name: 'Lucas', specialty: 'Barba, acabamento & social', initials: 'LC' },
]

const SERVICES = [
  { id: 'corte', name: 'Corte simples', price: 40, duration: 30, description: 'Corte completo com acabamento.' },
  { id: 'corte-sobrancelha', name: 'Corte + sobrancelha', price: 50, duration: 45, description: 'Corte completo com acabamento de sobrancelha.' },
  { id: 'barba', name: 'Barba', price: 30, duration: 30, description: 'Modelagem, alinhamento e acabamento.' },
  { id: 'combo', name: 'Corte + barba', price: 65, duration: 60, description: 'Experiência completa de corte e barba.' },
]

const OPEN_MINUTES = 9 * 60
const CLOSE_MINUTES = 20 * 60
const SLOT_STEP = 15
const STORAGE_KEY = 'barbearia-do-rafa:appointments:v1'
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

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
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
  const [step, setStep] = useState(1)
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState(loadAppointments)
  const [lastBooking, setLastBooking] = useState(null)
  const [adminDate, setAdminDate] = useState(todayISO())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  }, [appointments])

  const selectedBarber = BARBERS.find((b) => b.id === barberId)
  const selectedService = SERVICES.find((s) => s.id === serviceId)

  const availableSlots = useMemo(() => {
    if (!barberId || !serviceId || !date) return []
    const duration = selectedService.duration
    const sameDay = appointments.filter((a) => a.barberId === barberId && a.date === date && a.status !== 'cancelled')
    const slots = []

    for (let start = OPEN_MINUTES; start + duration <= CLOSE_MINUTES; start += SLOT_STEP) {
      const hasConflict = sameDay.some((a) =>
        overlaps(start, duration, timeToMinutes(a.time), a.duration),
      )
      if (!hasConflict) slots.push(minutesToTime(start))
    }
    return slots
  }, [appointments, barberId, date, serviceId, selectedService])

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

  function confirmBooking(e) {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 10 || !selectedBarber || !selectedService || !time) return

    const freshConflict = appointments.some(
      (a) =>
        a.barberId === barberId &&
        a.date === date &&
        a.status !== 'cancelled' &&
        overlaps(timeToMinutes(time), selectedService.duration, timeToMinutes(a.time), a.duration),
    )

    if (freshConflict) {
      alert('Esse horário acabou de ser ocupado. Escolha outro horário.')
      setStep(3)
      setTime('')
      return
    }

    const booking = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      barberId,
      barberName: selectedBarber.name,
      serviceId,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      date,
      time,
      clientName: name.trim(),
      phone: phone.trim(),
      status: 'confirmed',
    }

    setAppointments((prev) => [...prev, booking])
    setLastBooking(booking)
    setView('success')
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

  function exportCSV() {
    const rows = [
      ['Data', 'Horário', 'Profissional', 'Cliente', 'WhatsApp', 'Serviço', 'Duração', 'Valor'],
      ...appointments
        .filter((a) => a.status !== 'cancelled')
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .map((a) => [a.date, a.time, a.barberName, a.clientName, a.phone, a.serviceName, `${a.duration} min`, money(a.price)]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agenda-barbearia-${adminDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const adminAppointments = appointments
    .filter((a) => a.date === adminDate && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))

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
                <div className="barber-grid">
                  {BARBERS.map((barber) => (
                    <button key={barber.id} className={`barber-card ${barberId === barber.id ? 'selected' : ''}`} onClick={() => { setBarberId(barber.id); setTime('') }}>
                      <div className="avatar">{barber.initials}</div>
                      <div><strong>{barber.name}</strong><span>{barber.specialty}</span></div>
                      <span className="check"><Check size={16}/></span>
                    </button>
                  ))}
                </div>
                <button className="primary" disabled={!barberId} onClick={() => setStep(2)}>Continuar</button>
              </>
            )}

            {step === 2 && (
              <>
                <button className="back" onClick={() => setStep(1)}><ChevronLeft size={18}/> Voltar</button>
                <SectionTitle eyebrow="02 / SERVIÇO" title="O que vamos fazer hoje?" subtitle={`Agenda de ${selectedBarber?.name}.`} />
                <div className="service-list">
                  {SERVICES.map((service) => (
                    <button key={service.id} className={`service-card ${serviceId === service.id ? 'selected' : ''}`} onClick={() => { setServiceId(service.id); setTime('') }}>
                      <div className="service-main"><strong>{service.name}</strong><span>{service.description}</span></div>
                      <div className="service-meta"><b>{money(service.price)}</b><small><Clock3 size={14}/>{service.duration} min</small></div>
                    </button>
                  ))}
                </div>
                <button className="primary" disabled={!serviceId} onClick={() => setStep(3)}>Escolher data e horário</button>
              </>
            )}

            {step === 3 && (
              <>
                <button className="back" onClick={() => setStep(2)}><ChevronLeft size={18}/> Voltar</button>
                <SectionTitle eyebrow="03 / AGENDA" title="Quando fica melhor para você?" subtitle={`${selectedService?.name} · ${selectedService?.duration} min com ${selectedBarber?.name}`} />
                <label className="date-field"><CalendarDays size={18}/><span>Data</span><input type="date" min={todayISO()} value={date} onChange={(e) => { setDate(e.target.value); setTime('') }}/></label>
                <div className="slot-sections">
                  {Object.entries(slotGroups).map(([label, slots]) => (
                    <div key={label} className="slot-group">
                      <h3>{label}</h3>
                      {slots.length ? <div className="slot-grid">{slots.map((slot) => <button key={slot} onClick={() => setTime(slot)} className={time === slot ? 'selected' : ''}>{slot}</button>)}</div> : <p className="empty">Sem horários livres.</p>}
                    </div>
                  ))}
                </div>
                <button className="primary" disabled={!time} onClick={() => setStep(4)}>Continuar com {time || 'horário'}</button>
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
                  <button className="primary" type="submit">Confirmar agendamento</button>
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
          <p>Seu horário foi salvo neste dispositivo.</p>
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
        <section className="admin-wrap">
          <SectionTitle eyebrow="PAINEL INTERNO" title="Agenda da barbearia" subtitle="Visão simples dos atendimentos salvos neste navegador." />
          <div className="admin-toolbar card">
            <label><CalendarDays size={17}/>Data<input type="date" value={adminDate} onChange={(e) => setAdminDate(e.target.value)}/></label>
            <button onClick={exportCSV}><Download size={17}/> Exportar CSV</button>
          </div>

          <div className="stats">
            <div className="stat card"><UsersRound/><span>{adminAppointments.length}</span><small>agendamentos</small></div>
            <div className="stat card"><WalletCards/><span>{money(adminAppointments.reduce((sum, a) => sum + a.price, 0))}</span><small>previsto</small></div>
          </div>

          {BARBERS.map((barber) => {
            const list = adminAppointments.filter((a) => a.barberId === barber.id)
            return (
              <div className="barber-agenda card" key={barber.id}>
                <div className="agenda-head"><div className="avatar small">{barber.initials}</div><div><strong>{barber.name}</strong><span>{list.length} atendimento(s)</span></div></div>
                {list.length === 0 ? <p className="empty admin-empty">Nenhum horário marcado.</p> : (
                  <div className="appointments">
                    {list.map((a) => (
                      <article key={a.id} className="appointment-row">
                        <time>{a.time}</time>
                        <div><strong>{a.clientName}</strong><span>{a.serviceName} · {a.duration} min</span><small>{a.phone}</small></div>
                        <button title="Cancelar" onClick={() => {
                          if (confirm(`Cancelar o horário de ${a.clientName} às ${a.time}?`)) {
                            setAppointments((prev) => prev.map((item) => item.id === a.id ? { ...item, status: 'cancelled' } : item))
                          }
                        }}><Trash2 size={17}/></button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      <footer>Barbearia do Rafa · atendimento com hora marcada</footer>
    </main>
  )
}

export default App
