import React, { useEffect, useMemo, useState } from 'react'
import { Plus, X, Filter } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import MoonStatus, { STATUS_OPTIONS } from '../components/MoonStatus.jsx'

const CATEGORIAS = ['Pedagógica', 'Educacional', 'Administrativa', 'Inclusão / AEE', 'Evento']
const ENCAMINHAMENTOS = ['—', 'CT', 'DAIE', 'CRAS', 'SME', 'COTRAN', 'DAISE']

const STATUS_CYCLE = ['aberta', 'em_andamento', 'concluida', 'escalada']

const CATEGORIA_COLOR = {
  Pedagógica: 'bg-night/5 text-night',
  Educacional: 'bg-sage/10 text-sage',
  Administrativa: 'bg-moon/15 text-moon-deep',
  'Inclusão / AEE': 'bg-signal/10 text-signal',
  Evento: 'bg-night/10 text-night'
}

const CAMPOS_VAZIOS = {
  categoria: 'Pedagógica',
  descricao: '',
  aluno_turma: '',
  responsavel: '',
  prazo: '',
  status: 'aberta',
  encaminhamento_externo: '—',
  observacoes: ''
}

export default function Crescente() {
  const [tarefas, setTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [modalAberto, setModalAberto] = useState(false)
  const [novaTarefa, setNovaTarefa] = useState(CAMPOS_VAZIOS)

  useEffect(() => {
    carregarTarefas()
  }, [])

  async function carregarTarefas() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('crescente_tarefas')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.warn('[Crescente] Supabase indisponível, usando dados de exemplo:', error.message)
      setErroConexao(true)
      setTarefas(TAREFAS_EXEMPLO)
    } else {
      setErroConexao(false)
      setTarefas(data)
    }
    setCarregando(false)
  }

  async function salvarNovaTarefa(e) {
    e.preventDefault()
    const payload = { ...novaTarefa, criado_em: new Date().toISOString() }

    const { data, error } = await supabase.from('crescente_tarefas').insert(payload).select()

    if (error) {
      // fallback local para não travar o uso enquanto o Supabase não está configurado
      setTarefas((prev) => [{ ...payload, id: `local-${Date.now()}` }, ...prev])
    } else {
      setTarefas((prev) => [data[0], ...prev])
    }
    setNovaTarefa(CAMPOS_VAZIOS)
    setModalAberto(false)
  }

  async function avancarStatus(tarefa) {
    const idx = STATUS_CYCLE.indexOf(tarefa.status)
    const proximo = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: proximo } : t)))

    if (!String(tarefa.id).startsWith('local-')) {
      await supabase.from('crescente_tarefas').update({ status: proximo }).eq('id', tarefa.id)
    }
  }

  const tarefasFiltradas = useMemo(() => {
    if (filtroCategoria === 'Todas') return tarefas
    return tarefas.filter((t) => t.categoria === filtroCategoria)
  }, [tarefas, filtroCategoria])

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">
            Instrumento de acompanhamento
          </p>
          <h1 className="font-display text-3xl text-night">Crescente</h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Agenda de gestão compartilhada — pedagógica, educacional, administrativa, inclusão/AEE
            e eventos. Atualização diária, revisão coletiva toda segunda-feira.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors shrink-0"
        >
          <Plus size={16} /> Nova tarefa
        </button>
      </header>

      {erroConexao && (
        <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg">
          Exibindo dados de exemplo — conecte o Supabase (arquivo <code>.env</code>) para persistir os
          registros reais.
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter size={14} className="text-night/40 shrink-0" />
        {['Todas', ...CATEGORIAS].map((c) => (
          <button
            key={c}
            onClick={() => setFiltroCategoria(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filtroCategoria === c
                ? 'bg-night text-white'
                : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-paper-raised border border-paper-line rounded-card overflow-hidden">
        {carregando ? (
          <p className="p-6 text-sm text-night/50">Carregando tarefas…</p>
        ) : tarefasFiltradas.length === 0 ? (
          <p className="p-6 text-sm text-night/50">Nenhuma tarefa nesta categoria ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-night/40 uppercase tracking-wide border-b border-paper-line">
                <th className="py-3 px-5 font-medium">Descrição</th>
                <th className="py-3 px-4 font-medium">Categoria</th>
                <th className="py-3 px-4 font-medium">Aluno/Turma</th>
                <th className="py-3 px-4 font-medium">Responsável</th>
                <th className="py-3 px-4 font-medium">Prazo</th>
                <th className="py-3 px-4 font-medium">Encaminhamento</th>
                <th className="py-3 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tarefasFiltradas.map((t) => (
                <tr key={t.id} className="border-b border-paper-line last:border-0 hover:bg-paper/60">
                  <td className="py-3.5 px-5 text-night max-w-xs">{t.descricao}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${CATEGORIA_COLOR[t.categoria] || ''}`}>
                      {t.categoria}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-night/70">{t.aluno_turma || '—'}</td>
                  <td className="py-3.5 px-4 text-night/70">{t.responsavel || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-night/50">{t.prazo || 'Contínuo'}</td>
                  <td className="py-3.5 px-4 text-night/70">{t.encaminhamento_externo || '—'}</td>
                  <td className="py-3.5 px-5">
                    <button onClick={() => avancarStatus(t)} title="Clique para avançar o status">
                      <MoonStatus status={t.status} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-raised rounded-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-night">Nova tarefa no Crescente</h2>
              <button onClick={() => setModalAberto(false)} className="text-night/40 hover:text-night">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarNovaTarefa} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-night/60">Descrição da tarefa</label>
                <textarea
                  required
                  rows={2}
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-night/60">Categoria</label>
                  <select
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novaTarefa.categoria}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Responsável</label>
                  <input
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novaTarefa.responsavel}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-night/60">Aluno / Turma (opcional)</label>
                  <input
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novaTarefa.aluno_turma}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, aluno_turma: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Prazo</label>
                  <input
                    type="date"
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novaTarefa.prazo}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Encaminhamento externo</label>
                <select
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novaTarefa.encaminhamento_externo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, encaminhamento_externo: e.target.value })}
                >
                  {ENCAMINHAMENTOS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Observações</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novaTarefa.observacoes}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, observacoes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
              >
                Salvar tarefa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const TAREFAS_EXEMPLO = [
  {
    id: 'ex-1',
    categoria: 'Inclusão / AEE',
    descricao: 'Solicitar AAI para aluno novo da Turma 201 junto ao DAIE',
    aluno_turma: 'Turma 201',
    responsavel: 'Liliam (OP)',
    prazo: '2026-07-10',
    status: 'em_andamento',
    encaminhamento_externo: 'DAIE'
  },
  {
    id: 'ex-2',
    categoria: 'Administrativa',
    descricao: 'Atualizar ponto funcional do mês',
    aluno_turma: '',
    responsavel: 'Maria Lúcia',
    prazo: '2026-07-08',
    status: 'aberta',
    encaminhamento_externo: '—'
  },
  {
    id: 'ex-3',
    categoria: 'Evento',
    descricao: 'Confirmar logística do Arraiá do Regina (18/07)',
    aluno_turma: '',
    responsavel: 'Direção + OP',
    prazo: '2026-07-15',
    status: 'em_andamento',
    encaminhamento_externo: '—'
  },
  {
    id: 'ex-4',
    categoria: 'Educacional',
    descricao: 'Encaminhar caso de infrequência grave ao Conselho Tutelar',
    aluno_turma: 'Turma 1005',
    responsavel: 'Elaine (OE)',
    prazo: '2026-07-05',
    status: 'escalada',
    encaminhamento_externo: 'CT'
  }
]
