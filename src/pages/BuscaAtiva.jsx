import React, { useEffect, useMemo, useState } from 'react'
import { Plus, X, Copy, Check, AlertTriangle, Home, MessageCircle, FileWarning, Users, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

// ---------------------------------------------------------------
// As 5 etapas do fluxo, conforme o Plano de Ação Anual 2026
// (seção 3.3) — cada uma com o prazo de referência em dias desde
// a 1ª falta, usado só como orientação visual, não como bloqueio.
// ---------------------------------------------------------------
const ETAPAS = [
  { n: 1, titulo: 'Identificação', prazo: 'até o 3º dia', icon: FileWarning },
  { n: 2, titulo: 'Contato via WhatsApp', prazo: '3º ao 5º dia', icon: MessageCircle },
  { n: 3, titulo: 'Convocatória formal', prazo: '5º ao 7º dia', icon: AlertTriangle },
  { n: 4, titulo: 'Mobilização comunitária', prazo: '8º ao 10º dia', icon: Home },
  { n: 5, titulo: 'Conselho Tutelar', prazo: 'a partir do 10º dia', icon: ShieldAlert }
]

const STATUS_LABELS = {
  ativo: { label: 'Ativo', color: 'bg-night/10 text-night' },
  em_busca: { label: 'Em busca', color: 'bg-moon/20 text-moon-deep' },
  transferido: { label: 'Transferido', color: 'bg-sage/15 text-sage' },
  evadido: { label: 'Evadido', color: 'bg-signal/15 text-signal' },
  aguardando_ct: { label: 'Aguardando CT', color: 'bg-signal/15 text-signal' },
  retornou: { label: 'Retornou', color: 'bg-sage/15 text-sage' }
}

const CASO_VAZIO = {
  nome_aluno: '',
  turma: '',
  data_primeira_falta: '',
  faltas_acumuladas: 3,
  status: 'ativo',
  etapa_atual: 1
}

function diasDesde(dataStr) {
  if (!dataStr) return null
  const diff = Date.now() - new Date(dataStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function mensagemPadrao(nomeAluno, dataFalta) {
  const dataFormatada = dataFalta
    ? new Date(dataFalta).toLocaleDateString('pt-BR')
    : '[data]'
  return `Olá, [Nome do responsável]! Sou a Orientadora Educacional da E.M. Regina Celi. Percebemos que ${nomeAluno} está ausente desde ${dataFormatada} e queremos saber se está tudo bem. Por favor, entre em contato conosco. Estamos aqui para ajudar!`
}

function CasoCard({ caso, onAvancar, onVoltar, onCopiarMensagem, copiado }) {
  const dias = diasDesde(caso.data_primeira_falta)
  const urgente = dias !== null && dias >= 10 && caso.etapa_atual < 5
  const critico = dias !== null && dias >= 30

  return (
    <div
      className={`bg-paper-raised border rounded-lg p-4 space-y-2.5 ${
        critico ? 'border-signal' : urgente ? 'border-moon-deep' : 'border-paper-line'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-night leading-tight">{caso.nome_aluno}</p>
          <p className="text-xs text-night/50">{caso.turma}</p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_LABELS[caso.status]?.color}`}>
          {STATUS_LABELS[caso.status]?.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-night/60">
        <span className="font-mono">{caso.faltas_acumuladas || 0} faltas</span>
        {dias !== null && (
          <span className={`font-mono ${critico ? 'text-signal font-semibold' : urgente ? 'text-moon-deep font-semibold' : ''}`}>
            · {dias} dias sem retorno
          </span>
        )}
      </div>

      {critico && (
        <p className="text-[11px] text-signal flex items-center gap-1">
          <AlertTriangle size={12} /> 30+ dias — caracteriza abandono (Art. 48, Res. 003/2025)
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {caso.etapa_atual === 2 && (
          <button
            onClick={() => onCopiarMensagem(caso)}
            className="text-xs flex items-center gap-1 text-night/60 hover:text-night border border-paper-line rounded-md px-2 py-1"
          >
            {copiado ? <Check size={12} /> : <Copy size={12} />}
            {copiado ? 'Copiado' : 'Copiar mensagem'}
          </button>
        )}
        <div className="flex-1" />
        {caso.etapa_atual > 1 && (
          <button onClick={() => onVoltar(caso)} className="text-xs text-night/40 hover:text-night px-2 py-1">
            ← voltar
          </button>
        )}
        {caso.etapa_atual < 5 && (
          <button
            onClick={() => onAvancar(caso)}
            className="text-xs bg-night text-white px-2.5 py-1 rounded-md hover:bg-night-soft"
          >
            avançar →
          </button>
        )}
      </div>
    </div>
  )
}

export default function BuscaAtiva() {
  const [casos, setCasos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoCaso, setNovoCaso] = useState(CASO_VAZIO)
  const [idCopiado, setIdCopiado] = useState(null)

  useEffect(() => {
    carregarCasos()
  }, [])

  async function carregarCasos() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('busca_ativa_casos')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.warn('[BuscaAtiva] Supabase indisponível, usando dados de exemplo:', error.message)
      setErroConexao(true)
      setCasos(CASOS_EXEMPLO)
    } else {
      setErroConexao(false)
      setCasos(data)
    }
    setCarregando(false)
  }

  async function salvarNovoCaso(e) {
    e.preventDefault()
    const payload = { ...novoCaso, criado_em: new Date().toISOString() }
    const { data, error } = await supabase.from('busca_ativa_casos').insert(payload).select()

    if (error) {
      setCasos((prev) => [{ ...payload, id: `local-${Date.now()}` }, ...prev])
    } else {
      setCasos((prev) => [data[0], ...prev])
    }
    setNovoCaso(CASO_VAZIO)
    setModalAberto(false)
  }

  async function mudarEtapa(caso, delta) {
    const novaEtapa = Math.min(5, Math.max(1, caso.etapa_atual + delta))
    let novoStatus = caso.status
    if (novaEtapa === 5) novoStatus = 'aguardando_ct'
    else if (novaEtapa > 1 && caso.status === 'ativo') novoStatus = 'em_busca'

    setCasos((prev) =>
      prev.map((c) => (c.id === caso.id ? { ...c, etapa_atual: novaEtapa, status: novoStatus } : c))
    )

    if (!String(caso.id).startsWith('local-')) {
      await supabase.from('busca_ativa_casos').update({ etapa_atual: novaEtapa, status: novoStatus }).eq('id', caso.id)
    }
  }

  function copiarMensagem(caso) {
    const texto = mensagemPadrao(caso.nome_aluno, caso.data_primeira_falta)
    navigator.clipboard?.writeText(texto)
    setIdCopiado(caso.id)
    setTimeout(() => setIdCopiado(null), 2000)
  }

  const porEtapa = useMemo(() => {
    const grupos = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    casos.forEach((c) => {
      if (grupos[c.etapa_atual]) grupos[c.etapa_atual].push(c)
    })
    return grupos
  }, [casos])

  const stats = useMemo(() => {
    const ativos = casos.filter((c) => !['transferido', 'evadido', 'retornou'].includes(c.status))
    const criticos = ativos.filter((c) => {
      const d = diasDesde(c.data_primeira_falta)
      return d !== null && d >= 30
    })
    return { ativos: ativos.length, criticos: criticos.length, total: casos.length }
  }, [casos])

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">
            Combate à evasão escolar
          </p>
          <h1 className="font-display text-3xl text-night">Busca Ativa</h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Fluxo de 5 etapas conforme a Lei Estadual nº 7.614/2017 e o ECA (Art. 56) — da
            identificação da falta até o acionamento do Conselho Tutelar.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors shrink-0"
        >
          <Plus size={16} /> Novo caso
        </button>
      </header>

      {erroConexao && (
        <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg">
          Exibindo dados de exemplo — conecte o Supabase para persistir os registros reais.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-paper-raised border border-paper-line rounded-card p-4">
          <p className="text-2xl font-display text-night">{stats.ativos}</p>
          <p className="text-sm text-night/60">Casos ativos em acompanhamento</p>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-card p-4">
          <p className={`text-2xl font-display ${stats.criticos > 0 ? 'text-signal' : 'text-sage'}`}>
            {stats.criticos}
          </p>
          <p className="text-sm text-night/60">Casos com 30+ dias (meta: zero)</p>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-card p-4">
          <p className="text-2xl font-display text-night">{stats.total}</p>
          <p className="text-sm text-night/60">Total de casos no ano</p>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-night/50">Carregando casos…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {ETAPAS.map((etapa) => (
            <div key={etapa.n} className="min-w-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <etapa.icon size={15} className="text-night/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-night truncate">{etapa.titulo}</p>
                  <p className="text-[10px] text-night/40 font-mono">{etapa.prazo}</p>
                </div>
              </div>
              <div className="space-y-3">
                {porEtapa[etapa.n].length === 0 ? (
                  <p className="text-xs text-night/30 italic px-1">Sem casos nesta etapa</p>
                ) : (
                  porEtapa[etapa.n].map((caso) => (
                    <CasoCard
                      key={caso.id}
                      caso={caso}
                      onAvancar={(c) => mudarEtapa(c, 1)}
                      onVoltar={(c) => mudarEtapa(c, -1)}
                      onCopiarMensagem={copiarMensagem}
                      copiado={idCopiado === caso.id}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-raised rounded-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-night">Novo caso de Busca Ativa</h2>
              <button onClick={() => setModalAberto(false)} className="text-night/40 hover:text-night">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarNovoCaso} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-night/60">Nome do aluno</label>
                <input
                  required
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoCaso.nome_aluno}
                  onChange={(e) => setNovoCaso({ ...novoCaso, nome_aluno: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-night/60">Turma</label>
                  <input
                    required
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoCaso.turma}
                    onChange={(e) => setNovoCaso({ ...novoCaso, turma: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60">Faltas acumuladas</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                    value={novoCaso.faltas_acumuladas}
                    onChange={(e) => setNovoCaso({ ...novoCaso, faltas_acumuladas: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-night/60">Data da 1ª falta</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                  value={novoCaso.data_primeira_falta}
                  onChange={(e) => setNovoCaso({ ...novoCaso, data_primeira_falta: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
              >
                Iniciar acompanhamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const CASOS_EXEMPLO = [
  {
    id: 'ex-1',
    nome_aluno: 'Diogo Moreno',
    turma: '203',
    data_primeira_falta: new Date(Date.now() - 4 * 86400000).toISOString(),
    faltas_acumuladas: 4,
    status: 'em_busca',
    etapa_atual: 2
  },
  {
    id: 'ex-2',
    nome_aluno: 'Mirella',
    turma: '502',
    data_primeira_falta: new Date(Date.now() - 9 * 86400000).toISOString(),
    faltas_acumuladas: 6,
    status: 'em_busca',
    etapa_atual: 3
  },
  {
    id: 'ex-3',
    nome_aluno: 'Aluno(a) — Turma 1005',
    turma: '1005',
    data_primeira_falta: new Date(Date.now() - 12 * 86400000).toISOString(),
    faltas_acumuladas: 8,
    status: 'aguardando_ct',
    etapa_atual: 5
  },
  {
    id: 'ex-4',
    nome_aluno: 'Kayllane',
    turma: '203',
    data_primeira_falta: new Date(Date.now() - 2 * 86400000).toISOString(),
    faltas_acumuladas: 3,
    status: 'ativo',
    etapa_atual: 1
  }
]
