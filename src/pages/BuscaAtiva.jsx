import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, X, Copy, Check, AlertTriangle, Home, MessageCircle, FileWarning,
  Users, ShieldAlert, Upload, Loader2, FileText
} from 'lucide-react'
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

// ---------------------------------------------------------------
// IMPORTAÇÃO DE PDF — Relatório de Faltas Não Justificadas (SME)
// ---------------------------------------------------------------
// Critério de sinalização (LDB art. 24 §6º — mínimo 75% de frequência;
// Lei 13.803/2019 — Busca Ativa Escolar; ECA art. 56):
//   - % FNJ >= 25%  -> crítico (frequência já abaixo do mínimo legal)
//   - % Freq < 90% (e FNJ < 25%) -> atenção preventiva
const LIMIAR_CRITICO_FNJ = 25
const LIMIAR_ATENCAO_FREQ = 90

const CURSO_KEYWORDS = ['EIPREESCOLA', 'AN.INI.', 'CICLO', 'CESP']

const CASO_VAZIO_KEYS = Object.keys(CASO_VAZIO)

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

// Extrai candidatos de Busca Ativa a partir do texto bruto do PDF de FNJ.
// Só as colunas %FNJ e %Freq têm casas decimais no relatório — isso é
// usado como âncora confiável mesmo em linhas onde os números vieram
// colados sem espaço (falha comum de extração de texto de PDF tabular).
function extrairCandidatosFNJ(textoCompleto) {
  const linhas = textoCompleto.split('\n').map((l) => l.trim()).filter(Boolean)
  const candidatos = []

  for (const linha of linhas) {
    // precisa ter pelo menos um dos códigos de curso conhecidos
    const idxCurso = CURSO_KEYWORDS
      .map((k) => ({ k, i: linha.indexOf(k) }))
      .filter((r) => r.i > -1)
      .sort((a, b) => a.i - b.i)[0]

    if (!idxCurso) continue

    // pega todos os números decimais (só existem em %FNJ e %Freq)
    const decimais = linha.match(/\d{1,3}\.\d{2}/g)
    if (!decimais || decimais.length < 2) continue

    const percentualFreq = parseFloat(decimais[decimais.length - 1])
    const percentualFNJ = parseFloat(decimais[decimais.length - 2])
    if (Number.isNaN(percentualFreq) || Number.isNaN(percentualFNJ)) continue
    if (percentualFreq > 100 || percentualFNJ > 100) continue

    // matrícula = dígitos no início da linha
    const matriculaMatch = linha.match(/^\d{4,7}/)
    const matricula = matriculaMatch ? matriculaMatch[0] : null

    // nome = trecho entre a matrícula e o código de curso
    let nomeBruto = linha.slice(matricula ? matricula.length : 0, idxCurso.i)
    nomeBruto = nomeBruto.replace(/[^A-Za-zÀ-ÿ' ]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!nomeBruto || nomeBruto.length < 3) continue

    // turma: melhor esforço — pega o trecho logo após o código de curso
    // até o primeiro número de 3+ dígitos ou palavra "AEE"
    const restante = linha.slice(idxCurso.i + idxCurso.k.length, linha.length)
    const turmaMatch = restante.match(/^[A-Za-zÀ-ÿ0-9]{1,10}/)
    const turmaBruta = turmaMatch ? turmaMatch[0] : ''

    let nivel = null
    if (percentualFNJ >= LIMIAR_CRITICO_FNJ) nivel = 'critico'
    else if (percentualFreq < LIMIAR_ATENCAO_FREQ) nivel = 'atencao'

    if (!nivel) continue

    candidatos.push({
      chave: `${matricula || 'sm'}-${nomeBruto}`,
      matricula,
      nome: nomeBruto,
      turma: turmaBruta,
      percentualFNJ,
      percentualFreq,
      nivel,
      selecionado: true
    })
  }

  // remove duplicados (mesma matrícula ou mesmo nome aparecendo 2x no PDF
  // por ter registro em mais de uma turma/AEE)
  const vistos = new Set()
  return candidatos.filter((c) => {
    const chaveDedup = c.matricula || c.nome
    if (vistos.has(chaveDedup)) return false
    vistos.add(chaveDedup)
    return true
  })
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

function ModalImportarPDF({ onFechar, casosExistentes, onConfirmar }) {
  const inputRef = useRef(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(null)
  const [candidatos, setCandidatos] = useState(null)

  const nomesExistentes = useMemo(
    () => new Set(casosExistentes.map((c) => (c.nome_aluno || '').toLowerCase().trim())),
    [casosExistentes]
  )

  async function lerPDF(file) {
    setProcessando(true)
    setErro(null)
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

      let textoCompleto = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const linhaPagina = content.items.map((item) => item.str).join(' ')
        textoCompleto += linhaPagina + '\n'
      }

      const extraidos = extrairCandidatosFNJ(textoCompleto)
      if (extraidos.length === 0) {
        setErro(
          'Nenhum aluno com FNJ ≥ 25% ou frequência abaixo de 90% foi encontrado neste PDF. Confira se o arquivo é o relatório de Faltas Não Justificadas correto.'
        )
      }
      setCandidatos(
        extraidos.map((c) => ({
          ...c,
          jaExiste: nomesExistentes.has(c.nome.toLowerCase().trim()),
          selecionado: !nomesExistentes.has(c.nome.toLowerCase().trim())
        }))
      )
    } catch (e) {
      console.error('[BuscaAtiva] Erro ao ler PDF:', e)
      setErro('Não foi possível ler este PDF. Confira se o arquivo não está corrompido ou protegido por senha.')
    } finally {
      setProcessando(false)
    }
  }

  function alternarSelecao(chave) {
    setCandidatos((prev) => prev.map((c) => (c.chave === chave ? { ...c, selecionado: !c.selecionado } : c)))
  }

  function editarTurma(chave, valor) {
    setCandidatos((prev) => prev.map((c) => (c.chave === chave ? { ...c, turma: valor } : c)))
  }

  const selecionados = candidatos ? candidatos.filter((c) => c.selecionado) : []

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-paper-raised rounded-card w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl text-night">Importar do relatório de FNJ (SME)</h2>
            <p className="text-xs text-night/50 mt-0.5">
              Critério: FNJ ≥ 25% (crítico, abaixo do mínimo legal de 75% — LDB art. 24 §6º) ou
              frequência abaixo de 90% (atenção preventiva). Base: Lei 13.803/2019 e ECA art. 56.
            </p>
          </div>
          <button onClick={onFechar} className="text-night/40 hover:text-night shrink-0">
            <X size={20} />
          </button>
        </div>

        {!candidatos && (
          <div className="border-2 border-dashed border-paper-line rounded-lg p-8 text-center">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && lerPDF(e.target.files[0])}
            />
            {processando ? (
              <div className="flex flex-col items-center gap-2 text-night/60">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Lendo e analisando o PDF…</p>
              </div>
            ) : (
              <>
                <FileText size={28} className="mx-auto text-night/30 mb-3" />
                <p className="text-sm text-night/60 mb-4">
                  Selecione o PDF de Faltas Não Justificadas exportado da SME
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors"
                >
                  <Upload size={16} /> Selecionar PDF
                </button>
              </>
            )}
            {erro && (
              <p className="text-xs text-signal mt-4 flex items-center justify-center gap-1">
                <AlertTriangle size={12} /> {erro}
              </p>
            )}
          </div>
        )}

        {candidatos && candidatos.length > 0 && (
          <>
            <p className="text-xs text-night/50 mb-3">
              {candidatos.length} aluno(s) sinalizado(s) — revise nomes e turmas antes de confirmar.
              {selecionados.length} selecionado(s) para importar.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {candidatos.map((c) => (
                <div
                  key={c.chave}
                  className={`border rounded-lg p-3 flex items-start gap-3 ${
                    c.nivel === 'critico' ? 'border-signal/40 bg-signal/5' : 'border-moon/40 bg-moon/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={c.selecionado}
                    onChange={() => alternarSelecao(c.chave)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-night">{c.nome}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          c.nivel === 'critico' ? 'bg-signal/15 text-signal' : 'bg-moon/20 text-moon-deep'
                        }`}
                      >
                        {c.nivel === 'critico' ? 'crítico' : 'atenção'}
                      </span>
                      {c.jaExiste && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-night/10 text-night/50">
                          já existe na plataforma
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-night/50 font-mono mt-0.5">
                      FNJ {c.percentualFNJ.toFixed(2)}% · Frequência {c.percentualFreq.toFixed(2)}%
                      {c.matricula ? ` · matrícula ${c.matricula}` : ''}
                    </p>
                    <input
                      className="mt-1.5 w-full max-w-[180px] border border-paper-line rounded-md px-2 py-1 text-xs font-mono"
                      value={c.turma}
                      onChange={(e) => editarTurma(c.chave, e.target.value)}
                      placeholder="turma"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-4 mt-2 border-t border-paper-line">
              <button
                onClick={() => setCandidatos(null)}
                className="text-xs text-night/50 hover:text-night px-2 py-1.5"
              >
                Trocar arquivo
              </button>
              <div className="flex-1" />
              <button
                onClick={onFechar}
                className="text-sm text-night/60 hover:text-night px-3 py-2"
              >
                Cancelar
              </button>
              <button
                disabled={selecionados.length === 0}
                onClick={() => onConfirmar(selecionados)}
                className="text-sm bg-night text-white font-medium px-4 py-2 rounded-lg hover:bg-night-soft disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Importar {selecionados.length || ''} caso(s)
              </button>
            </div>
          </>
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
  const [modalImportarAberto, setModalImportarAberto] = useState(false)
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

  async function importarCandidatosPDF(selecionados) {
    const hoje = new Date().toISOString().slice(0, 10)
    const novosPayloads = selecionados.map((c) => ({
      nome_aluno: c.nome,
      turma: c.turma ? `${c.turma} (FNJ ${c.percentualFNJ.toFixed(1)}%)` : `FNJ ${c.percentualFNJ.toFixed(1)}%`,
      data_primeira_falta: hoje,
      faltas_acumuladas: 0,
      status: 'ativo',
      etapa_atual: 1,
      criado_em: new Date().toISOString()
    }))

    const { data, error } = await supabase.from('busca_ativa_casos').insert(novosPayloads).select()

    if (error) {
      console.warn('[BuscaAtiva] Falha ao importar via Supabase, adicionando localmente:', error.message)
      setCasos((prev) => [
        ...novosPayloads.map((p) => ({ ...p, id: `local-${Date.now()}-${Math.random()}` })),
        ...prev
      ])
    } else {
      setCasos((prev) => [...data, ...prev])
    }
    setModalImportarAberto(false)
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
