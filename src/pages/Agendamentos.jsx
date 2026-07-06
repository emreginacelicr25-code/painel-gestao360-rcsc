import React, { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Plus, X, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

const TIPOS = ['1º Atendimento', '2º Atendimento', 'Atendimento Prioritário', 'Convocatória', 'Reunião de Equipe', 'Av. Inicial']

const STATUS_LABELS = {
  agendado: { label: 'Agendado', color: 'bg-night/10 text-night' },
  realizado: { label: 'Realizado', color: 'bg-sage/15 text-sage' },
  nao_compareceu: { label: 'Não compareceu', color: 'bg-signal/15 text-signal' },
  cancelado: { label: 'Cancelado', color: 'bg-night/5 text-night/40' },
  em_acompanhamento: { label: 'Em acompanhamento', color: 'bg-moon/20 text-moon-deep' }
}

const STATUS_CYCLE = ['agendado', 'realizado', 'em_acompanhamento', 'nao_compareceu', 'cancelado']

const GRADE_FIXA = [
  { funcao: 'Direção', quando: '2ª feiras — 7h às 10h / 13h às 15h' },
  { funcao: 'Reunião de Equipe', quando: '5ª feiras' },
  { funcao: 'ADM', quando: '6ª feira (última do mês)' },
  { funcao: 'ASG', quando: '6ª feira (penúltima do mês)' },
  { funcao: 'Apoio', quando: '6ª feira (primeira do mês)' },
  { funcao: 'Demais', quando: '6ª feira (segunda do mês)' },
  { funcao: 'ETP (geral)', quando: '4° e 6ª feira — 10h às 12h / 13h às 16h' },
  { funcao: 'ETP (geral)', quando: '3ª feira — 9h às 11h / 13h às 15h' }
]

const CAMPOS_VAZIOS = {
  tipo_atendimento: '1º Atendimento',
  aluno_turma: '',
  motivo: '',
  data: '',
  hora: '',
  responsavel: '',
  encaminhamentos: '',
  status: 'agendado',
  link_documento: ''
}

function CardAtendimento({ item, onAvancarStatus }) {
  const [expandido, setExpandido] = useState(false)
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-night/5 text-night/60">{item.tipo_atendimento}</span>
          <p className="text-sm font-medium text-night mt-1.5">{item.aluno_turma || 'Sem aluno vinculado'}</p>
          <p className="text-xs text-night/50 mt-0.5">{item.motivo}</p>
        </div>
        <button
          onClick={() => onAvancarStatus(item)}
          className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${STATUS_LABELS[item.status].color}`}
        >
          {STATUS_LABELS[item.status].label}
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-night/40 font-mono">
        {item.data && <span>{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
        {item.hora && <span>{item.hora}</span>}
        {item.responsavel && <span className="text-night/60 font-sans">{item.responsavel}</span>}
      </div>
      {item.encaminhamentos && (
        <button onClick={() => setExpandido((v) => !v)} className="text-xs text-moon-deep hover:underline">
          {expandido ? 'ocultar encaminhamentos' : 'ver encaminhamentos'}
        </button>
      )}
      {expandido && <p className="text-sm text-night/70 leading-relaxed border-t border-paper-line pt-2">{item.encaminhamentos}</p>}
      {item.link_documento && (
        <a
          href={item.link_documento}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-moon-deep flex items-center gap-1 hover:underline"
        >
          Abrir documento <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

export default function Agendamentos() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [novoItem, setNovoItem] = useState(CAMPOS_VAZIOS)

  useEffect(() => {
    carregarItens()
  }, [])

  async function carregarItens() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('agendamentos_atendimento')
      .select('*')
      .order('data', { ascending: false })
    if (!error && data) setItens(data)
    setCarregando(false)
  }

  async function salvarNovoItem(e) {
    e.preventDefault()
    const payload = { ...novoItem, criado_em: new Date().toISOString() }
    const { data, error } = await supabase.from('agendamentos_atendimento').insert(payload).select()
    if (!error && data) setItens((prev) => [data[0], ...prev])
    setNovoItem(CAMPOS_VAZIOS)
    setModalAberto(false)
  }

  async function avancarStatus(item) {
    const proximo = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length]
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: proximo } : i)))
    await supabase.from('agendamentos_atendimento').update({ status: proximo }).eq('id', item.id)
  }

  const itensFiltrados = useMemo(() => {
    if (filtroStatus === 'Todos') return itens
    return itens.filter((i) => i.status === filtroStatus)
  }, [itens, filtroStatus])

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">
            Equipe Técnica Pedagógica / Direção
          </p>
          <h1 className="font-display text-3xl text-night flex items-center gap-3">
            <CalendarClock size={26} className="text-moon-deep" /> Agendamentos
          </h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Registro de atendimentos, convocatórias e reuniões — preencha aqui e acompanhe o
            status de cada um.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors shrink-0"
        >
          <Plus size={16} /> Novo agendamento
        </button>
      </header>

      <section className="mb-8 bg-paper-raised border border-paper-line rounded-card p-5">
        <h2 className="text-xs font-semibold text-night/40 uppercase tracking-wide mb-3">
          Grade fixa de horários (referência)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GRADE_FIXA.map((g, i) => (
            <div key={i} className="text-xs">
              <p className="font-medium text-night">{g.funcao}</p>
              <p className="text-night/50">{g.quando}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['Todos', ...Object.keys(STATUS_LABELS)].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filtroStatus === s ? 'bg-night text-white' : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'
            }`}
          >
            {s === 'Todos' ? 'Todos' : STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-night/50">Carregando agendamentos…</p>
      ) : itensFiltrados.length === 0 ? (
        <p className="text-sm text-night/50">Nenhum agendamento nesse status ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itensFiltrados.map((item) => (
            <CardAtendimento key={item.id} item={item} onAvancarStatus={avancarStatus} />
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-paper-raised rounded-card w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-night">Novo agendamento</h2>
              <button onClick={() => setModalAberto(false)} className="text-night/40 hover:text-night">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarNovoItem} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-night/60">Tipo de atendimento</label>
                <select
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.tipo_atendimento}
                  onChange={(e) => setNovoItem({ ...novoItem, tipo_atendimento: e.target.value })}
                >
                  {TIPOS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Aluno / Turma</label>
                <input
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.aluno_turma}
                  onChange={(e) => setNovoItem({ ...novoItem, aluno_turma: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Motivo / Solicitante</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.motivo}
                  onChange={(e) => setNovoItem({ ...novoItem, motivo: e.target.value })}
                  placeholder="Ex.: Solicitação do Responsável — questões pedagógicas"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-night/60">Data</label>
                  <input
                    type="date"
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoItem.data}
                    onChange={(e) => setNovoItem({ ...novoItem, data: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Hora</label>
                  <input
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    placeholder="08h"
                    value={novoItem.hora}
                    onChange={(e) => setNovoItem({ ...novoItem, hora: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Responsável</label>
                  <input
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoItem.responsavel}
                    onChange={(e) => setNovoItem({ ...novoItem, responsavel: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Encaminhamentos</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.encaminhamentos}
                  onChange={(e) => setNovoItem({ ...novoItem, encaminhamentos: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Link do documento (opcional)</label>
                <input
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  placeholder="https://docs.google.com/…"
                  value={novoItem.link_documento}
                  onChange={(e) => setNovoItem({ ...novoItem, link_documento: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
              >
                Salvar agendamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
        }
