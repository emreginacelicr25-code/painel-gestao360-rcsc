import React, { useState } from 'react'
import { Moon, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { entrar, erro } = useAuth()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEntrando(true)
    await entrar(login.trim(), senha)
    setEntrando(false)
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-moon/20 flex items-center justify-center mb-4">
            <Moon size={22} className="text-moon" />
          </div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-moon uppercase mb-1">Gestão Escolar</p>
          <h1 className="font-display text-2xl text-white text-center leading-snug">
            E.M. Regina Celi<br />da Silva Cerdeira
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper-raised rounded-card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-night/60">Login</label>
            <input
              required
              autoFocus
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2.5 text-sm"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Senha</label>
            <input
              required
              type="password"
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2.5 text-sm"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="text-xs text-signal">{erro}</p>}

          <button
            type="submit"
            disabled={entrando}
            className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={15} /> {entrando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-paper/30 mt-6">
          Login individual — solicite acesso à direção da escola.
        </p>
      </div>
    </div>
  )
}
