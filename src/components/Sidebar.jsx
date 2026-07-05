import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, KeyRound, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { MODULOS } from '../data/modulos.js'

export default function Sidebar() {
  const { usuario, isDiretor, temAcesso, sair } = useAuth()

  return (
    <aside className="w-64 shrink-0 bg-night text-paper flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-moon uppercase">Gestão Escolar</p>
        <h1 className="font-display text-xl leading-snug mt-1">
          E.M. Regina Celi<br />da Silva Cerdeira
        </h1>
        <p className="text-xs text-paper/50 mt-2">Jardim Primavera · Duque de Caxias</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-white/10 text-white font-medium' : 'text-paper/70 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={17} strokeWidth={1.75} />
          Painel Geral
        </NavLink>

        {MODULOS.filter((m) => temAcesso(m.chave)).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-paper/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}

        {isDiretor && (
          <NavLink
            to="/acessos"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-paper/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <KeyRound size={17} strokeWidth={1.75} />
            Gerenciar Acessos
          </NavLink>
        )}
      </nav>

      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-sm text-white leading-tight">{usuario?.nome_exibicao}</p>
        <p className="text-xs text-paper/40 leading-relaxed mt-0.5 capitalize">{usuario?.papel} · Ano letivo 2026</p>
        <button
          onClick={sair}
          className="flex items-center gap-1.5 text-xs text-paper/50 hover:text-white mt-3"
        >
          <LogOut size={13} /> Sair
        </button>
      </div>
    </aside>
  )
}
