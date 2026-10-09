import { useState } from 'react'
import { entrarAdmin, verificarAdmin, sairAdmin } from './adminAuth'

export default function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function fazerLogin(evento) {
    evento.preventDefault()
    if (carregando) return

    setCarregando(true)
    setErro('')

    try {
      await entrarAdmin(email.trim(), senha)

      const autorizado = await verificarAdmin()

      if (!autorizado) {
        await sairAdmin()
        setErro('Esta conta não tem acesso administrativo.')
        return
      }

      onAuthenticated()
    } catch (error) {
      setErro('Não foi possível entrar. Confira seus dados.')
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="card main-card">
      <div className="section-title">
        <span>ACESSO RESTRITO</span>
        <h2>Painel administrativo</h2>
        <p>Entre com sua conta autorizada.</p>
      </div>

      <form onSubmit={fazerLogin} className="form">
        <label>
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu e-mail"
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />
        </label>

        {erro && <p role="alert">{erro}</p>}

        <button className="primary" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar no painel'}
        </button>
      </form>
    </section>
  )
}
