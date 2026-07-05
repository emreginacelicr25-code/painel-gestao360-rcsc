import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, Users2, GraduationCap, ShieldCheck } from 'lucide-react'
import MoonStatus from '../components/MoonStatus.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const INDICADORES = [
  { label: 'Frequência escolar (meta)', valor: '≥ 85%', fonte: 'Plano de Ação 2026 · Busca Ativa' },
  { label: 'PEIs elaborados/revisados', valor: '100%', fonte: 'alunos com laudo ou avaliação' },
  { label: 'Relatórios descritivos no prazo', valor: '100%', fonte: 'todos os bimestres' },
  { label: 'Solicitações de AAI protocoladas', valor: '100%', fonte: 'alunos com direito a AAI' }
]

const PROXIMOS_MARCOS = [
  { data: '19–22/05', evento: 'Reuniões de Responsáveis — todas as turmas', bimestre: '2º Bim.' },
  { data: '03/06', evento: 'Dia D do Projeto Pedagógico + Gincana Fase 3', bimestre: '2º Bim.' },
  { data: '18/07', evento: 'Arraiá do Regina — Festa Julina', bimestre: '2º Bim.' },
  { data: 'Agosto', evento: 'Semana da Ed. Infantil / Semana da Pessoa com Deficiência', bimestre: '3º Bim.' }
]

const RESUMO_EQUIPE = [
  { nome: 'Liliam Vila Rangel', funcao: 'Orientadora Pedagógica' },
  { nome: 'Elaine Gomes', funcao: 'Orientadora Educacional' },
  { nome: 'José Jorge Machado', funcao: 'Psicólogo Educacional' },
  { nome: 'Maria Lúcia Pinheiro', funcao: 'Secretária Escolar' }
]

function StatCard({ icon: Icon, label, value, accent = 'night' }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-${accent}/10`}>
          <Icon size={16} className={`text-${accent}`} />
        </div>
      </div>
      <p className="text-2xl font-display text-night">{value}</p>
      <p className="text-sm text-night/60 mt-1">{label}</p>
    </div>
  )
}

export default function PainelGeral() {
  const { usuario } = useAuth()
  const primeiroNome = usuario?.nome_exibicao?.split(' ')[0] || ''

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Ano letivo 2026</p>
        <h1 className="font-display text-3xl text-night">Bem-vindo, {primeiroNome}</h1>
        <p className="text-night/60 mt-1">
          Visão geral da gestão da E.M. Regina Celi da Silva Cerdeira — pedagógico, administrativo,
          inclusão e proteção estudantil em um só lugar.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Users2} label="Estudantes atendidos" value="~450" />
        <StatCard icon={GraduationCap} label="Turmas de Ed. Especial" value="7" />
        <StatCard icon={ShieldCheck} label="Salas AEE" value="5" />
        <StatCard icon={CalendarClock} label="Bimestre atual" value="2º" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-paper-raised border border-paper-line rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-night">Indicadores do Plano de Ação Anual</h2>
            <Link to="/indicadores" className="text-xs text-moon-deep flex items-center gap-1 hover:underline">
              Ver todos <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {INDICADORES.map((ind) => (
              <div key={ind.label} className="border border-paper-line rounded-lg p-4">
                <p className="text-xl font-display text-sage">{ind.valor}</p>
                <p className="text-sm text-night mt-1">{ind.label}</p>
                <p className="text-xs text-night/40 mt-1">{ind.fonte}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-paper-raised border border-paper-line rounded-card p-6">
          <h2 className="font-display text-lg text-night mb-4">Equipe gestora</h2>
          <ul className="space-y-3">
            {RESUMO_EQUIPE.map((p) => (
              <li key={p.nome} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-night/10 flex items-center justify-center font-display text-sm text-night">
                  {p.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-night leading-tight">{p.nome}</p>
                  <p className="text-xs text-night/50 leading-tight">{p.funcao}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/equipe" className="text-xs text-moon-deep flex items-center gap-1 hover:underline mt-4">
            Ver equipe completa <ArrowUpRight size={13} />
          </Link>
        </section>
      </div>

      <section className="mt-6 bg-paper-raised border border-paper-line rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-night">Próximos marcos do calendário</h2>
          <Link to="/projetos" className="text-xs text-moon-deep flex items-center gap-1 hover:underline">
            Ver todos os projetos <ArrowUpRight size={13} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {PROXIMOS_MARCOS.map((m) => (
              <tr key={m.evento} className="border-t border-paper-line first:border-t-0">
                <td className="py-3 pr-4 font-mono text-xs text-night/50 whitespace-nowrap">{m.data}</td>
                <td className="py-3 pr-4 text-night">{m.evento}</td>
                <td className="py-3">
                  <span className="text-xs bg-night/5 text-night/60 px-2 py-0.5 rounded-full">{m.bimestre}</span>
                </td>
                <td className="py-3">
                  <MoonStatus status="aberta" size={16} showLabel={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
