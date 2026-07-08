import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MessageCircle, Plus, X, Settings2, Download, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

// ---------------------------------------------------------------
// As mensagens de WhatsApp em si moram no projeto rcsc-triagem
// (Supabase separado, conta diferente do painel-gestao-rcsc — isso
// não afeta a conexão, só a URL e a chave anon importam). Este
// módulo NÃO duplica esse banco — ele consulta ao vivo a tabela
// "demandas" (somente leitura) e permite "puxar" uma demanda
// específica para o registro de acompanhamento da Regina Celi
// (resposta + status), gravado aqui no painel-gestao-rcsc. Os
// nomes de coluna abaixo já vêm pré-preenchidos com a estrutura
// real da tabela demandas do rcsc-triagem, mapeada em 06/07.
// ---------------------------------------------------------------

const CHAVE_CONFIG_TRIAGEM = 'gestao-rcsc:mensagens-triagem-config'
const STATUS_LABELS = {
  pendente: { label: 'Pendente', color: 'bg-moon/20 text-moon-deep' },
  encaminhada: { label: 'Encaminhada', color: 'bg-signal/10 text-signal' },
  concluida: { label: 'Concluída', color: 'bg-sage/15 text-sage' }
}

const URGENCIA_COLOR = {
  baixa: 'bg-sage/15 text-sage',
  media: 'bg-moon/20 text-moon-deep',
  alta: 'bg-signal/15 text-signal'
}
const PRIORIDADE_URGENCIA = { alta: 0, media: 1, baixa: 2 }

function lerConfigTriagem() {
  try {
    const raw = window.localStorage.getItem(CHAVE_CONFIG_TRIAGEM)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function salvarConfigTriagem(cfg) {
  try {
    window.localStorage.setItem(CHAVE_CONFIG_TRIAGEM, JSON.stringify(cfg))
  } catch {
    /* sem localStorage disponível */
  }
}

function PainelConexaoTriagem({ config, onSalvar, onFechar }) {
  const [url, setUrl] = useState(config?.url || '')
  const [anonKey, setAnonKey] = useState(config?.anonKey || '')
  const [tabela, setTabela] = useState(config?.tabela || 'demandas')
  const [colMensagem, setColMensagem] = useState(config?.colMensagem || 'texto')
  const [colResposta, setColResposta] = useState(config?.colResposta || 'encaminhamentos')
  const [colStatus, setColStatus] = useState(config?.colStatus || 'status')
  const [colData, setColData] = useState(config?.colData || 'criado_em')
  const [colRemetente, setColRemetente] = useState(config?.colRemetente || 'autor')
  const [colCategoria, setColCategoria] = useState(config?.colCategoria || 'categoria')
  const [colUrgencia, setColUrgencia] = useState(config?.colUrgencia || 'urgencia')
  const [colAlunoNome, setColAlunoNome] = useState(config?.colAlunoNome || 'aluno_nome')
  const [colAlunoTurma, setColAlunoTurma] = useState(config?.colAlunoTurma || 'aluno_turma')

  function salvar() {
    onSalvar({
      url,
      anonKey,
      tabela,
      colMensagem,
      colResposta,
      colStatus,
      colData,
      colRemetente,
      colCategoria,
      colUrgencia,
      colAlunoNome,
      colAlunoTurma
    })
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-paper-raised rounded-card w-full max-w-lg p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">Conectar ao RCSC Triagem</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-night/60 mb-4">
          Os campos já vêm preenchidos com a estrutura real da tabela <code>demandas</code> do
          rcsc-triagem. Só falta colar a Project URL e a chave anon (Project Settings → API →
          Legacy anon, service_role API keys).
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-night/50">Supabase Project URL (rcsc-triagem)</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-night/50">Chave anon public</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
              placeholder="eyJhbGciOi…"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-night/50">Nome da tabela</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
              value={tabela}
              onChange={(e) => setTabela(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-paper-line">
            <div>
              <label className="text-[11px] text-night/50">Coluna: mensagem</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colMensagem}
                onChange={(e) => setColMensagem(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: resposta/encaminhamento</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colResposta}
                onChange={(e) => setColResposta(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: status</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colStatus}
                onChange={(e) => setColStatus(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: data</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colData}
                onChange={(e) => setColData(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: remetente</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colRemetente}
                onChange={(e) => setColRemetente(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: categoria</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colCategoria}
                onChange={(e) => setColCategoria(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: urgência</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colUrgencia}
                onChange={(e) => setColUrgencia(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-night/50">Coluna: aluno (nome)</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colAlunoNome}
                onChange={(e) => setColAlunoNome(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-night/50">Coluna: aluno (turma)</label>
              <input
                className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
                value={colAlunoTurma}
                onChange={(e) => setColAlunoTurma(e.target.value)}
              />
            </div>
          </div>
        </div>
        <button
          onClick={salvar}
          className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors mt-5"
        >
          Salvar conexão
        </button>
      </div>
    </div>
  )
}

function ModalNovaMensagem({ onFechar, onSalvar, base }) {
  const [form, setForm] = useState({
    remetente: base?.remetente || '',
    aluno_turma: base?.aluno_turma || '',
    mensagem: base?.mensagem || '',
    resposta: base?.resposta || '',
    status: 'pendente'
  })

  async function salvar(e) {
    e.preventDefault()
    await onSalvar({
      ...form,
      origem: base ? 'triagem' : 'manual',
      triagem_ref_id: base?.triagem_ref_id || null
    })
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
      <div className="bg-paper-raised rounded-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">
            {base ? 'Registrar mensagem do Triagem' : 'Nova mensagem'}
          </h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-night/60">Remetente</label>
            <input
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={form.remetente}
              onChange={(e) => setForm({ ...form, remetente: e.target.value })}
              placeholder="Ex.: Mãe do Thomas 401"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Aluno / Turma (opcional)</label>
            <input
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={form.aluno_turma}
              onChange={(e) => setForm({ ...form, aluno_turma: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Mensagem</label>
            <textarea
              required
              rows={3}
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Resposta / encaminhamento</label>
            <textarea
              rows={2}
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={form.resposta}
              onChange={(e) => setForm({ ...form, resposta: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Status</label>
            <select
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="pendente">Pendente</option>
              <option value="encaminhada">Encaminhada</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
          >
            Salvar registro
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Mensagens() {
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('Todas')
  const [modalAberto, setModalAberto] = useState(false)
  const [configPainelAberto, setConfigPainelAberto] = useState(false)
  const [baseTriagem, setBaseTriagem] = useState(null)

  const [configTriagem, setConfigTriagem] = useState(null)
  const [previaTriagem, setPreviaTriagem] = useState([])
  const [statusPrevia, setStatusPrevia] = useState('idle')

  useEffect(() => {
    carregarRegistros()
    const cfg = lerConfigTriagem()
    setConfigTriagem(cfg)
    if (cfg?.url && cfg?.anonKey && cfg?.tabela) buscarPreviaTriagem(cfg)
  }, [])

  async function carregarRegistros() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('mensagens_atendimento')
      .select('*')
      .order('criado_em', { ascending: false })
    if (!error && data) setRegistros(data)
    setCarregando(false)
  }

  async function buscarPreviaTriagem(cfg) {
    setStatusPrevia('carregando')
    try {
      const client = createClient(cfg.url, cfg.anonKey)
      const { data, error } = await client
        .from(cfg.tabela)
        .select('*')
        .order(cfg.colData, { ascending: false })
        .limit(500)
      if (error) throw error

      const semBaixas = (data || []).filter((item) => {
        if (!cfg.colUrgencia) return true
        const urgencia = String(item[cfg.colUrgencia] || '').toLowerCase()
        return urgencia !== 'baixa'
      })

      const ordenado = semBaixas.sort((a, b) => {
        const urgenciaA = cfg.colUrgencia ? String(a[cfg.colUrgencia] || '').toLowerCase() : ''
        const urgenciaB = cfg.colUrgencia ? String(b[cfg.colUrgencia] || '').toLowerCase() : ''
        const prioridadeA = PRIORIDADE_URGENCIA[urgenciaA] ?? 3
        const prioridadeB = PRIORIDADE_URGENCIA[urgenciaB] ?? 3
        if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB
        const dataA = cfg.colData ? a[cfg.colData] : null
        const dataB = cfg.colData ? b[cfg.colData] : null
        return new Date(dataB) - new Date(dataA)
      })

      setPreviaTriagem(ordenado)
      setStatusPrevia('ok')
    } catch (e) {
      console.warn('[Mensagens] Falha ao consultar rcsc-triagem:', e.message)
      setStatusPrevia('erro')
    }
  }

  async function salvarConfig(cfg) {
    salvarConfigTriagem(cfg)
    setConfigTriagem(cfg)
    setConfigPainelAberto(false)
    buscarPreviaTriagem(cfg)
  }

  async function salvarMensagem(dados) {
    const payload = { ...dados, criado_em: new Date().toISOString() }
    const { data, error } = await supabase.from('mensagens_atendimento').insert(payload).select()
    if (!error && data) setRegistros((prev) => [data[0], ...prev])
    setModalAberto(false)
    setBaseTriagem(null)
  }

  async function avancarStatus(registro) {
    const ciclo = ['pendente', 'encaminhada', 'concluida']
    const proximo = ciclo[(ciclo.indexOf(registro.status) + 1) % ciclo.length]
    setRegistros((prev) => prev.map((r) => (r.id === registro.id ? { ...r, status: proximo } : r)))
    await supabase.from('mensagens_atendimento').update({ status: proximo }).eq('id', registro.id)
  }

  function jaRegistrada(item) {
    const idExterno = item.id ?? item.uuid ?? JSON.stringify(item)
    return registros.some((r) => r.triagem_ref_id === String(idExterno))
  }

  function registrarDaTriagem(item) {
    const idExterno = item.id ?? item.uuid ?? JSON.stringify(item)
    const alunoNome = configTriagem.colAlunoNome ? item[configTriagem.colAlunoNome] : ''
    const alunoTurma = configTriagem.colAlunoTurma ? item[configTriagem.colAlunoTurma] : ''
    setBaseTriagem({
      remetente: configTriagem.colRemetente ? item[configTriagem.colRemetente] : '',
      aluno_turma: [alunoNome, alunoTurma].filter(Boolean).join(' — '),
      mensagem: item[configTriagem.colMensagem] || '',
      resposta: configTriagem.colResposta ? item[configTriagem.colResposta] || '' : '',
      triagem_ref_id: String(idExterno)
    })
    setModalAberto(true)
  }

  const registrosFiltrados = useMemo(() => {
    if (filtroStatus === 'Todas') return registros
    return registros.filter((r) => r.status === filtroStatus)
  }, [registros, filtroStatus])

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">
            Comunicação com famílias e equipe
          </p>
          <h1 className="font-display text-3xl text-night flex items-center gap-3">
            <MessageCircle size={26} className="text-moon-deep" /> Mensagens
          </h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Registro de mensagens recebidas, respostas enviadas e status de cada conversa —
            conectado ao RCSC Triagem para trazer as demandas reais do WhatsApp da escola.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setConfigPainelAberto(true)}
            className="flex items-center gap-2 bg-paper-raised border border-paper-line text-night text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-night/5 transition-colors"
          >
            <Settings2 size={16} /> Conectar Triagem
          </button>
          <button
            onClick={() => {
              setBaseTriagem(null)
              setModalAberto(true)
            }}
            className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors"
          >
            <Plus size={16} /> Nova mensagem
          </button>
        </div>
      </header>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-night/40 uppercase tracking-wide">
            Prévia ao vivo — RCSC Triagem (demandas)
          </h2>
          {configTriagem?.url && (
            <button
              onClick={() => buscarPreviaTriagem(configTriagem)}
              className="text-xs text-night/50 hover:text-night flex items-center gap-1"
            >
              <RefreshCw size={12} className={statusPrevia === 'carregando' ? 'animate-spin' : ''} /> atualizar
            </button>
          )}
        </div>

        {!configTriagem?.url ? (
          <div className="bg-moon/10 border border-moon/30 text-moon-deep text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            Ainda não conectado ao rcsc-triagem — clique em "Conectar Triagem" para trazer as
            demandas reais aqui.
          </div>
        ) : statusPrevia === 'erro' ? (
          <div className="bg-signal/10 border border-signal/30 text-signal text-sm px-4 py-3 rounded-lg">
            Não foi possível consultar o rcsc-triagem — confira a URL, a chave e o nome da
            tabela/colunas em "Conectar Triagem".
          </div>
        ) : previaTriagem.length === 0 ? (
          <p className="text-sm text-night/50">Nenhuma demanda encontrada na tabela configurada.</p>
        ) : (
          <div className="space-y-2">
            {previaTriagem.map((item, i) => {
              const idExterno = item.id ?? item.uuid ?? i
              const registrada = jaRegistrada(item)
              const alunoNome = configTriagem.colAlunoNome ? item[configTriagem.colAlunoNome] : null
              const alunoTurma = configTriagem.colAlunoTurma ? item[configTriagem.colAlunoTurma] : null
              const categoria = configTriagem.colCategoria ? item[configTriagem.colCategoria] : null
              const urgencia = configTriagem.colUrgencia ? item[configTriagem.colUrgencia] : null
              const urgenciaKey = urgencia ? String(urgencia).toLowerCase() : null

              return (
                <div key={idExterno} className="bg-paper-raised border border-paper-line rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {configTriagem.colRemetente && item[configTriagem.colRemetente] && (
                      <span className="text-[11px] text-night/50">{item[configTriagem.colRemetente]}</span>
                    )}
                    {categoria && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-night/5 text-night/60">{categoria}</span>
                    )}
                    {urgencia && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${URGENCIA_COLOR[urgenciaKey] || 'bg-night/5 text-night/60'}`}>
                        {urgencia}
                      </span>
                    )}
                  </div>

                  {(alunoNome || alunoTurma) && (
                    <p className="text-sm font-medium text-night mb-1">
                      {[alunoNome, alunoTurma].filter(Boolean).join(' — ')}
                    </p>
                  )}

                  <p className="text-sm text-night/80 mb-3">
                    {configTriagem.colMensagem ? item[configTriagem.colMensagem] : ''}
                  </p>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => registrarDaTriagem(item)}
                      disabled={registrada}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        registrada
                          ? 'bg-sage/15 text-sage cursor-default'
                          : 'bg-night text-white hover:bg-night-soft'
                      }`}
                    >
                      {registrada ? 'Já registrada' : 'Registrar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-night/40 uppercase tracking-wide">
            Registros salvos ({registrosFiltrados.length})
          </h2>
          <div className="flex gap-1.5">
            {['Todas', 'pendente', 'encaminhada', 'concluida'].map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  filtroStatus === status
                    ? 'bg-night text-white'
                    : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'
                }`}
              >
                {status === 'Todas' ? 'Todas' : STATUS_LABELS[status]?.label}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p className="text-sm text-night/50">Carregando registros…</p>
        ) : registrosFiltrados.length === 0 ? (
          <p className="text-sm text-night/50">Nenhum registro encontrado.</p>
        ) : (
          <div className="space-y-2">
            {registrosFiltrados.map((registro) => (
              <div key={registro.id} className="bg-paper-raised border border-paper-line rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {registro.remetente && (
                        <span className="text-[11px] text-night/50">{registro.remetente}</span>
                      )}
                      {registro.aluno_turma && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-night/5 text-night/60">
                          {registro.aluno_turma}
                        </span>
                      )}
                      <button
                        onClick={() => avancarStatus(registro)}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[registro.status]?.color}`}
                      >
                        {STATUS_LABELS[registro.status]?.label}
                      </button>
                    </div>
                    <p className="text-sm text-night/80">{registro.mensagem}</p>
                    {registro.resposta && (
                      <p className="text-sm text-night/50 mt-1.5 border-l-2 border-paper-line pl-2">
                        {registro.resposta}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-night/40 shrink-0">
                    {registro.criado_em ? new Date(registro.criado_em).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalAberto && (
        <ModalNovaMensagem
          base={baseTriagem}
          onFechar={() => {
            setModalAberto(false)
            setBaseTriagem(null)
          }}
          onSalvar={salvarMensagem}
        />
      )}

      {configPainelAberto && (
        <PainelConexaoTriagem
          config={configTriagem}
          onSalvar={salvarConfig}
          onFechar={() => setConfigPainelAberto(false)}
        />
      )}
    </div>
  )
}
