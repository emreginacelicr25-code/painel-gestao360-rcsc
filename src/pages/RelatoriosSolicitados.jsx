import React, { useEffect, useMemo, useState } from 'react'
import { FileText, Plus, X, ExternalLink, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

const STATUS_LABELS = {
  pendente: { label: 'Pendente', color: 'bg-moon/20 text-moon-deep' },
  pronto: { label: 'Pronto', color: 'bg-sage/15 text-sage' },
  entregue: { label: 'Entregue', color: 'bg-night/10 text-night' }
}
const STATUS_CYCLE = ['pendente', 'pronto', 'entregue']

const CAMPOS_VAZIOS = {
  aluno_turma: '',
  data_solicitacao: new Date().toISOString().slice(0, 10),
  prazo: '',
  urgente: false,
  link_relatorio: '',
  status: 'pendente',
  observacoes: ''
}

export default function RelatoriosSolicitados() {
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
      .from('relatorios_solicitados')
      .select('*')
      .order('data_solicitacao', { ascending: false })
    if (!error && data) setItens(data)
    setCarregando(false)
  }

  async function salvarNovoItem(e) {
    e.preventDefault()
    const payload = { ...novoItem, criado_em: new Date().toISOString() }
    const { data, error } = await supabase.from('relatorios_solicitados').insert(payload).select()
    if (!error && data) setItens((prev) => [data[0], ...prev])
    setNovoItem(CAMPOS_VAZIOS)
    setModalAberto(false)
  }

  async function avancarStatus(item) {
    const proximo = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length]
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: proximo } : i)))
    await supabase.from('relatorios_solicitados').update({ status: proximo }).eq('id', item.id)
  }

  const itensFiltrados = useMemo(() => {
    if (filtroStatus === 'Todos') return itens
    return itens.filter((i) => i.status === filtroStatus)
  }, [itens, filtroStatus])

  function diasParaPrazo(prazo) {
    if (!prazo) return null
    return Math.ceil((new Date(prazo + 'T00:00:00').getTime() - Date.now()) / 86400000)
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">
            Controle de documentos pedagógicos
          </p>
          <h1 className="font-display text-3xl text-night flex items-center gap-3">
            <FileText size={26} className="text-moon-deep" /> Solicitação de Relatórios
          </h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Relatórios gerais sobre alunos solicitados à secretaria/direção — prazo, link do
            documento e status de entrega.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors shrink-0"
        >
          <Plus size={16} /> Nova solicitação
        </button>
      </header>

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
        <p className="text-sm text-night/50">Carregando solicitações…</p>
      ) : itensFiltrados.length === 0 ? (
        <p className="text-sm text-night/50">Nenhuma solicitação nesse status ainda.</p>
      ) : (
        <div className="bg-paper-raised border border-paper-line rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-night/40 uppercase tracking-wide border-b border-paper-line">
                <th className="py-3 px-5 font-medium">Aluno / Turma</th>
                <th className="py-3 px-4 font-medium">Solicitado em</th>
                <th className="py-3 px-4 font-medium">Prazo</th>
                <th className="py-3 px-4 font-medium">Documento</th>
                <th className="py-3 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => {
                const dias = diasParaPrazo(item.prazo)
                const atrasado = dias !== null && dias < 0 && item.status !== 'entregue'
                return (
                  <tr key={item.id} className="border-b border-paper-line last:border-0">
                    <td className="py-3.5 px-5 text-night">
                      <div className="flex items-center gap-1.5">
                        {item.urgente && <AlertTriangle size={13} className="text-signal shrink-0" />}
                        {item.aluno_turma}
                      </div>
                      {item.observacoes && <p className="text-xs text-night/40 mt-0.5">{item.observacoes}</p>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-night/50">
                      {item.data_solicitacao && new Date(item.data_solicitacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {item.prazo ? (
                        <span className={atrasado ? 'text-signal font-semibold' : 'text-night/60'}>
                          {new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {atrasado ? ' (atrasado)' : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.link_relatorio ? (
                        <a
                          href={item.link_relatorio}
                          target="_blank"
                          rel="noreferrer"
                          className="text-moon-deep flex items-center gap-1 hover:underline text-xs"
                        >
                          Abrir <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-night/30 text-xs">sem link</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => avancarStatus(item)}
                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_LABELS[item.status].color}`}
                      >
                        {STATUS_LABELS[item.status].label}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-raised rounded-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-night">Nova solicitação de relatório</h2>
              <button onClick={() => setModalAberto(false)} className="text-night/40 hover:text-night">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarNovoItem} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-night/60">Aluno / Turma</label>
                <input
                  required
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.aluno_turma}
                  onChange={(e) => setNovoItem({ ...novoItem, aluno_turma: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-night/60">Data da solicitação</label>
                  <input
                    type="date"
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoItem.data_solicitacao}
                    onChange={(e) => setNovoItem({ ...novoItem, data_solicitacao: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Prazo</label>
                  <input
                    type="date"
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoItem.prazo}
                    onChange={(e) => setNovoItem({ ...novoItem, prazo: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-night cursor-pointer">
                <input
                  type="checkbox"
                  checked={novoItem.urgente}
                  onChange={(e) => setNovoItem({ ...novoItem, urgente: e.target.checked })}
                  className="accent-signal"
                />
                Urgente
              </label>
              <div>
                <label className="text-xs font-medium text-night/60">Link do relatório (opcional)</label>
                <input
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  placeholder="https://docs.google.com/…"
                  value={novoItem.link_relatorio}
                  onChange={(e) => setNovoItem({ ...novoItem, link_relatorio: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Observações</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoItem.observacoes}
                  onChange={(e) => setNovoItem({ ...novoItem, observacoes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
              >
                Salvar solicitação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
                }
