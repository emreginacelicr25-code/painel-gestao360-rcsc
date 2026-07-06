import React, { useEffect, useMemo, useState } from 'react'
import { UploadCloud, X, Camera, ExternalLink, Users, FileDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { FUNCIONARIOS_SEED, FUNCOES } from '../data/funcionariosSeed.js'
import { gerarAvaliacaoPssBlob, baixarBlob } from '../lib/gerarAvaliacaoPss.js'

const VINCULOS = [
  { valor: 'estatutario', rotulo: 'Estatutário', cor: '#2563eb' },
  { valor: 'pss', rotulo: 'PSS', cor: '#d97706' },
  { valor: 'terceirizado', rotulo: 'Terceirizado', cor: '#7c3aed' },
  { valor: 'estagiario', rotulo: 'Estagiário', cor: '#059669' }
]

function rotuloVinculo(valor) {
  return VINCULOS.find((v) => v.valor === valor)?.rotulo || 'Sem vínculo definido'
}
function corVinculo(valor) {
  return VINCULOS.find((v) => v.valor === valor)?.cor || '#94a3b8'
}

function iniciais(nome) {
  const palavras = nome.split(' ')
  const primeira = palavras[0][0]
  const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

function Avatar({ funcionario, size = 48 }) {
  if (funcionario.foto_url) {
    return (
      <img
        src={funcionario.foto_url}
        alt={funcionario.nome_completo}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-paper-line"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-night/10 flex items-center justify-center font-display text-night shrink-0"
    >
      {iniciais(funcionario.nome_completo)}
    </div>
  )
}

function SeloVinculo({ vinculo }) {
  if (!vinculo) return null
  return (
    <span
      style={{ backgroundColor: corVinculo(vinculo) + '1a', color: corVinculo(vinculo) }}
      className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide"
    >
      {rotuloVinculo(vinculo)}
    </span>
  )
}

// ---------------------------------------------------------------------
// Campos específicos por tipo de vínculo — cada um só aparece quando o
// vínculo correspondente está selecionado no formulário/perfil.
// ---------------------------------------------------------------------
function CamposPorVinculo({ dados, onChange }) {
  const set = (campo) => (e) => onChange({ ...dados, [campo]: e.target.value })

  if (dados.vinculo === 'estatutario') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Matrícula" value={dados.matricula} onChange={set('matricula')} />
        <Campo label="Data de admissão" type="date" value={dados.data_admissao} onChange={set('data_admissao')} />
      </div>
    )
  }
  if (dados.vinculo === 'pss') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Matrícula" value={dados.matricula} onChange={set('matricula')} />
        <Campo label="Cargo" value={dados.cargo} onChange={set('cargo')} />
        <Campo label="Data do contrato" type="date" value={dados.data_contrato} onChange={set('data_contrato')} />
        <Campo label="Data de rescisão" type="date" value={dados.data_rescisao} onChange={set('data_rescisao')} />
        <Campo label="Turmas atendidas" value={dados.turmas_atendidas} onChange={set('turmas_atendidas')} className="col-span-2" />
        <Campo label="Tempo / carga" value={dados.tempo_carga} onChange={set('tempo_carga')} />
      </div>
    )
  }
  if (dados.vinculo === 'terceirizado') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Empresa" value={dados.empresa_terceirizada} onChange={set('empresa_terceirizada')} />
        <Campo label="Função" value={dados.funcao_terceirizado} onChange={set('funcao_terceirizado')} />
      </div>
    )
  }
  if (dados.vinculo === 'estagiario') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Instituição de ensino" value={dados.instituicao_ensino} onChange={set('instituicao_ensino')} className="col-span-2" />
        <Campo label="Supervisor(a)" value={dados.supervisor_estagio} onChange={set('supervisor_estagio')} className="col-span-2" />
        <Campo label="Início do estágio" type="date" value={dados.periodo_estagio_inicio} onChange={set('periodo_estagio_inicio')} />
        <Campo label="Fim do estágio" type="date" value={dados.periodo_estagio_fim} onChange={set('periodo_estagio_fim')} />
      </div>
    )
  }
  return null
}

function Campo({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <label className={`text-xs text-night/60 ${className}`}>
      {label}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        className="mt-1 w-full border border-paper-line rounded-lg px-2 py-1.5 text-sm text-night"
      />
    </label>
  )
}

// ---------------------------------------------------------------------
// Modal de geração da Avaliação de Desempenho PSS
// ---------------------------------------------------------------------
const CRITERIOS_LABELS = [
  'Frequência', 'Pontualidade', 'Cumprimento (normas)', 'Atendimento',
  'Iniciativa / Cooperação', 'Presteza', 'Interesse', 'Cooperação',
  'Compromisso', 'Zelo'
]
const OPCOES_NOTA = ['Não atendeu', 'Atendeu parcialmente', 'Atendeu', 'Superou']

function ModalAvaliacaoPss({ funcionario, onFechar }) {
  const hoje = new Date()
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [notas, setNotas] = useState({})
  const [consideracoes, setConsideracoes] = useState('')
  const [indicacao, setIndicacao] = useState('permanecer')
  const [gerando, setGerando] = useState(false)

  async function gerar() {
    setGerando(true)
    try {
      const blob = await gerarAvaliacaoPssBlob({
        funcionario_nome: funcionario.nome_completo,
        cargo: funcionario.cargo || funcionario.funcao,
        data_lotacao: funcionario.data_contrato || funcionario.data_admissao || '',
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        notas,
        consideracoes,
        indicacao,
        dia: String(hoje.getDate()).padStart(2, '0'),
        mes: String(hoje.getMonth() + 1).padStart(2, '0'),
        ano: String(hoje.getFullYear())
      })
      const nomeArq = `Avaliacao_PSS_${funcionario.nome_completo.replace(/\s+/g, '_')}_${periodoInicio}-${periodoFim}.docx`
      baixarBlob(blob, nomeArq)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
      <div className="bg-paper-raised rounded-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-night">Avaliação PSS — {funcionario.nome_completo}</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Campo label="Período início (ex: ABR/2026)" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
          <Campo label="Período fim (ex: JUN/2026)" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
        </div>

        <div className="space-y-2 mb-4">
          {CRITERIOS_LABELS.map((label, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-night/70 w-32 shrink-0">{label}</span>
              <select
                value={notas[idx] ?? ''}
                onChange={(e) => setNotas({ ...notas, [idx]: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="flex-1 border border-paper-line rounded-md px-2 py-1 text-xs"
              >
                <option value="">—</option>
                {OPCOES_NOTA.map((o, i) => <option key={i} value={i}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <label className="text-xs text-night/60 block mb-4">
          Considerações
          <textarea
            value={consideracoes}
            onChange={(e) => setConsideracoes(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-paper-line rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        <div className="flex items-center gap-3 text-xs text-night/70 mb-5">
          {[['permanecer', 'Permanecer no setor'], ['transferencia', 'Transferência'], ['desligamento', 'Desligamento']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-1">
              <input type="radio" name="indicacao" checked={indicacao === v} onChange={() => setIndicacao(v)} /> {l}
            </label>
          ))}
        </div>

        <button
          onClick={gerar}
          disabled={gerando || !periodoInicio || !periodoFim}
          className="w-full flex items-center justify-center gap-2 bg-night text-white text-sm py-2.5 rounded-lg hover:bg-night-soft disabled:opacity-50"
        >
          <FileDown size={15} /> {gerando ? 'Gerando…' : 'Gerar e baixar .docx'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Modal de perfil (existente + vínculo)
// ---------------------------------------------------------------------
function ModalPerfil({ funcionario, onFechar, onSalvar, onAbrirAvaliacao }) {
  const [dados, setDados] = useState(funcionario)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await onSalvar(funcionario, dados)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
      <div className="bg-paper-raised rounded-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">Perfil</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <Avatar funcionario={dados} size={64} />
          <div>
            <p className="font-display text-lg text-night leading-tight">{dados.nome_completo}</p>
            <p className="text-sm text-night/50">{dados.funcao}</p>
            <div className="mt-1"><SeloVinculo vinculo={dados.vinculo} /></div>
          </div>
        </div>

        <label className="text-xs text-night/60 block mb-3">
          Vínculo funcional
          <select
            value={dados.vinculo || ''}
            onChange={(e) => setDados({ ...dados, vinculo: e.target.value || null })}
            className="mt-1 w-full border border-paper-line rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="">Selecione…</option>
            {VINCULOS.map((v) => <option key={v.valor} value={v.valor}>{v.rotulo}</option>)}
          </select>
        </label>

        <div className="mb-4">
          <CamposPorVinculo dados={dados} onChange={setDados} />
        </div>

        <dl className="space-y-3 text-sm mb-5">
          <div>
            <dt className="text-xs text-night/40 uppercase tracking-wide">Regime / dias</dt>
            <dd className="text-night">{dados.regime_dias}</dd>
          </div>
          <div>
            <dt className="text-xs text-night/40 uppercase tracking-wide">Atribuição central</dt>
            <dd className="text-night leading-relaxed">{dados.atribuicao_central}</dd>
          </div>
          {dados.documentos_url && (
            <div>
              <dt className="text-xs text-night/40 uppercase tracking-wide">Documentos</dt>
              <dd>
                <a href={dados.documentos_url} target="_blank" rel="noreferrer" className="text-moon-deep flex items-center gap-1 hover:underline">
                  Abrir pasta <ExternalLink size={12} />
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div className="border-t border-paper-line pt-4 mb-4">
          <label className="text-xs font-medium text-night/60 flex items-center gap-1.5 mb-1.5">
            <Camera size={13} /> Link da foto (Supabase Storage ou externo)
          </label>
          <input
            className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
            placeholder="https://…"
            value={dados.foto_url || ''}
            onChange={(e) => setDados({ ...dados, foto_url: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={salvar} disabled={salvando} className="flex-1 bg-night text-white text-sm py-2.5 rounded-lg hover:bg-night-soft">
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
          {dados.vinculo === 'pss' && (
            <button
              onClick={() => onAbrirAvaliacao(dados)}
              className="flex items-center gap-1.5 text-sm px-3 rounded-lg border border-paper-line text-night hover:bg-night/5"
            >
              <FileDown size={14} /> Avaliação
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Equipe() {
  const [funcionarios, setFuncionarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [filtroFuncao, setFiltroFuncao] = useState('Todas')
  const [filtroVinculo, setFiltroVinculo] = useState('Todos')
  const [selecionado, setSelecionado] = useState(null)
  const [avaliandoPss, setAvaliandoPss] = useState(null)
  const [carregandoBase, setCarregandoBase] = useState(false)

  useEffect(() => { carregarFuncionarios() }, [])

  async function carregarFuncionarios() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('ativo', true)
      .order('funcao', { ascending: true })

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[Equipe] Supabase indisponível, usando base semente local:', error.message)
        setErroConexao(true)
      }
      setFuncionarios(FUNCIONARIOS_SEED.map((f, i) => ({ ...f, id: `seed-${i}` })))
    } else {
      setErroConexao(false)
      setFuncionarios(data)
    }
    setCarregando(false)
  }

  async function carregarBaseInicialNoSupabase() {
    setCarregandoBase(true)
    const { error } = await supabase.from('funcionarios').insert(FUNCIONARIOS_SEED)
    if (!error) await carregarFuncionarios()
    setCarregandoBase(false)
  }

  async function salvarPerfil(original, dadosNovos) {
    setFuncionarios((prev) => prev.map((f) => (f.id === original.id ? { ...f, ...dadosNovos } : f)))
    if (!String(original.id).startsWith('seed-')) {
      const { id, ...resto } = dadosNovos
      await supabase.from('funcionarios').update(resto).eq('id', original.id)
    }
    setSelecionado(null)
  }

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      const okFuncao = filtroFuncao === 'Todas' || f.funcao === filtroFuncao
      const okVinculo = filtroVinculo === 'Todos' || f.vinculo === filtroVinculo
      return okFuncao && okVinculo
    })
  }, [funcionarios, filtroFuncao, filtroVinculo])

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Equipe gestora e escolar</p>
        <h1 className="font-display text-3xl text-night flex items-center gap-3">
          <Users size={26} className="text-moon-deep" /> Equipe
        </h1>
        <p className="text-night/60 mt-1 max-w-xl">
          Todos os profissionais da E.M. Regina Celi, com função, vínculo funcional, regime de
          trabalho e atribuição central. Clique em um card para ver o perfil completo.
        </p>
      </header>

      {erroConexao && funcionarios[0]?.id?.startsWith('seed') && (
        <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span>Exibindo a base local (ainda não carregada no Supabase).</span>
          <button onClick={carregarBaseInicialNoSupabase} disabled={carregandoBase} className="flex items-center gap-1.5 text-xs bg-night text-white px-3 py-1.5 rounded-md hover:bg-night-soft whitespace-nowrap">
            <UploadCloud size={13} /> {carregandoBase ? 'Carregando…' : 'Carregar base inicial'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {['Todas', ...FUNCOES].map((f) => (
          <button key={f} onClick={() => setFiltroFuncao(f)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filtroFuncao === f ? 'bg-night text-white' : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['Todos', ...VINCULOS.map((v) => v.valor)].map((v) => (
          <button
            key={v}
            onClick={() => setFiltroVinculo(v)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${filtroVinculo === v ? 'bg-moon-deep text-white border-moon-deep' : 'bg-paper-raised border-paper-line text-night/60 hover:bg-night/5'}`}
          >
            {v === 'Todos' ? 'Todos os vínculos' : rotuloVinculo(v)}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-night/50">Carregando equipe…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {funcionariosFiltrados.map((f) => (
            <button key={f.id} onClick={() => setSelecionado(f)} className="bg-paper-raised border border-paper-line rounded-card p-4 text-left hover:border-moon transition-colors">
              <Avatar funcionario={f} />
              <p className="text-sm font-medium text-night mt-3 leading-tight">{f.nome_completo}</p>
              <p className="text-xs text-night/50 mt-0.5">{f.funcao}</p>
              <p className="text-[11px] text-night/35 mt-1 mb-2">{f.regime_dias}</p>
              <SeloVinculo vinculo={f.vinculo} />
            </button>
          ))}
        </div>
      )}

      {selecionado && (
        <ModalPerfil
          funcionario={selecionado}
          onFechar={() => setSelecionado(null)}
          onSalvar={salvarPerfil}
          onAbrirAvaliacao={(dados) => { setSelecionado(null); setAvaliandoPss(dados) }}
        />
      )}
      {avaliandoPss && (
        <ModalAvaliacaoPss funcionario={avaliandoPss} onFechar={() => setAvaliandoPss(null)} />
      )}
    </div>
  )
    }
