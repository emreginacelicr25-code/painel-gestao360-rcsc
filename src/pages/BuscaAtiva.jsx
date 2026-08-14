import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, X, Copy, Check, AlertTriangle, Home, MessageCircle, FileWarning,
  Users, ShieldAlert, Upload, Loader2, FileText
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import FichaFicai from '../components/FichaFicai.jsx'

// ---------------------------------------------------------------
// As 5 etapas do fluxo operacional interno — da identificação ao
// acionamento do Conselho Tutelar. Os prazos abaixo são orientação
// visual, não bloqueio: o critério legal de notificação obrigatória
// (ver ETAPAS_ENSINO mais abaixo) é sinalizado à parte, independente
// da etapa em que o caso estiver.
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
// Critérios oficiais (Documento Orientador — Busca Ativa Escolar,
// SME Duque de Caxias — e Lei Federal nº 13.803/2019, que altera a
// LDB para exigir notificação ao Conselho Tutelar quando as faltas
// ultrapassam 30% do percentual de faltas permitido em lei):
//
//   - "atenção"  -> % de frequência abaixo do mínimo exigido na
//                   etapa de ensino do aluno (60% na Educação
//                   Infantil, 75% no Ensino Fundamental)
//   - "crítico"  -> Nº de faltas não justificadas (Nº FNJ) já
//                   ultrapassa o limite de notificação obrigatória
//                   (30% sobre o percentual de faltas permitido em
//                   lei, calculado sobre os dias letivos do ano)
//
// O curso, como aparece no relatório da SME, indica a etapa de
// ensino e as regras aplicáveis a cada aluno.
const ETAPAS_ENSINO = {
  EIPREESCOLA: { nome: 'Educação Infantil', frequenciaMinima: 60, faltasPermitidas: 40 },
  'AN.INI.': { nome: 'Ensino Fundamental', frequenciaMinima: 75, faltasPermitidas: 25 },
  CICLO: { nome: 'Ensino Fundamental', frequenciaMinima: 75, faltasPermitidas: 25 },
  CESP: { nome: 'Ensino Fundamental (Educação Especial)', frequenciaMinima: 75, faltasPermitidas: 25 }
}
const CURSO_KEYWORDS = Object.keys(ETAPAS_ENSINO)
const DIAS_LETIVOS_PADRAO = 200 // usado se a configuração não puder ser lida do Supabase

const CASO_VAZIO_KEYS = Object.keys(CASO_VAZIO)

function calcularLimiteNotificacao(curso, diasLetivos) {
  const regra = ETAPAS_ENSINO[curso]
  if (!regra) return null
  const faltasPermitidasNoAno = Math.round(diasLetivos * (regra.faltasPermitidas / 100))
  return Math.round(faltasPermitidasNoAno * 0.3) // 30% sobre o permitido — Lei 13.803/2019
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

// Extrai candidatos de Busca Ativa a partir do texto bruto do PDF de FNJ.
// A âncora confiável é o final de cada linha: Nº FNJ (inteiro) seguido
// de %FNJ e %Freq (os únicos campos com casas decimais no relatório).
function extrairCandidatosFNJ(textoCompleto, diasLetivos = DIAS_LETIVOS_PADRAO) {
  const linhas = textoCompleto.split('\n').map((l) => l.trim()).filter(Boolean)
  const candidatos = []

  for (const linha of linhas) {
    // precisa ter pelo menos um dos códigos de curso conhecidos
    const idxCurso = CURSO_KEYWORDS
      .map((k) => ({ k, i: linha.indexOf(k) }))
      .filter((r) => r.i > -1)
      .sort((a, b) => a.i - b.i)[0]

    if (!idxCurso) continue

    // Nº FNJ (inteiro) + %FNJ + %Freq no final da linha
    const finalMatch = linha.match(/(\d+)\s+(\d{1,3}\.\d{2})\s+(\d{1,3}\.\d{2})\s*$/)
    if (!finalMatch) continue

    const numFNJ = parseInt(finalMatch[1], 10)
    const percentualFNJ = parseFloat(finalMatch[2])
    const percentualFreq = parseFloat(finalMatch[3])
    if (Number.isNaN(numFNJ) || Number.isNaN(percentualFNJ) || Number.isNaN(percentualFreq)) continue
    if (percentualFreq > 100 || percentualFNJ > 100) continue

    // matrícula = dígitos no início da linha
    const matriculaMatch = linha.match(/^\d{4,7}/)
    const matricula = matriculaMatch ? matriculaMatch[0] : null

    // nome = trecho entre a matrícula e o código de curso
    let nomeBruto = linha.slice(matricula ? matricula.length : 0, idxCurso.i)
    nomeBruto = nomeBruto.replace(/[^A-Za-zÀ-ÿ' ]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!nomeBruto || nomeBruto.length < 3) continue

    // turma: melhor esforço — pega o trecho logo após o código de curso
    const restante = linha.slice(idxCurso.i + idxCurso.k.length, linha.length)
    const turmaMatch = restante.match(/^[A-Za-zÀ-ÿ0-9]{1,10}/)
    const turmaBruta = turmaMatch ? turmaMatch[0] : ''

    const regraEnsino = ETAPAS_ENSINO[idxCurso.k]
    const limiteNotificacao = calcularLimiteNotificacao(idxCurso.k, diasLetivos)

    let nivel = null
    if (limiteNotificacao !== null && numFNJ >= limiteNotificacao) nivel = 'critico'
    else if (percentualFreq < regraEnsino.frequenciaMinima) nivel = 'atencao'

    if (!nivel) continue

    candidatos.push({
      chave: `${matricula || 'sm'}-${nomeBruto}`,
      matricula,
      nome: nomeBruto,
      turma: turmaBruta,
      curso: idxCurso.k,
      etapaEnsino: regraEnsino.nome,
      numFNJ,
      percentualFNJ,
      percentualFreq,
      limiteNotificacao,
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

const ETAPA_TITULO_POR_N = Object.fromEntries(ETAPAS.map((e) => [e.n, e.titulo]))

function CasoCard({ caso, onAvancar, onVoltar, onCopiarMensagem, copiado, onGerarFicai, onSalvarObservacao }) {
  const dias = diasDesde(caso.data_primeira_falta)
  const urgente = dias !== null && dias >= 10 && caso.etapa_atual < 5
  const abandono30dias = dias !== null && dias >= 30

  const observacoes = caso.observacoes_por_etapa || {}
  const [textoObs, setTextoObs] = useState(observacoes[caso.etapa_atual] || '')
  const [obsSalva, setObsSalva] = useState(false)

  useEffect(() => {
    setTextoObs(observacoes[caso.etapa_atual] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caso.id, caso.etapa_atual])

  async function salvarObs() {
    if (textoObs === (observacoes[caso.etapa_atual] || '')) return
    await onSalvarObservacao(caso, caso.etapa_atual, textoObs)
    setObsSalva(true)
    setTimeout(() => setObsSalva(false), 2000)
  }

  const etapasComNota = Object.entries(observacoes)
    .filter(([et, txt]) => txt && Number(et) !== caso.etapa_atual)
    .sort((a, b) => Number(a[0]) - Number(b[0]))

  return (
    <div
      className={`bg-paper-raised border rounded-lg p-4 space-y-2.5 ${
        abandono30dias || caso.elegivel_notificacao
          ? 'border-signal'
          : urgente
          ? 'border-moon-deep'
          : 'border-paper-line'
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
          <span className={`font-mono ${abandono30dias ? 'text-signal font-semibold' : urgente ? 'text-moon-deep font-semibold' : ''}`}>
            · {dias} dias sem retorno
          </span>
        )}
      </div>

      {caso.curso && (
        <p className="text-[11px] text-night/45">
          {caso.curso} · Nº FNJ {caso.num_fnj ?? '—'}
          {caso.percentual_freq != null ? ` · Freq. ${Number(caso.percentual_freq).toFixed(1)}%` : ''}
        </p>
      )}

      {caso.elegivel_notificacao && (
        <p className="text-[11px] text-signal font-medium flex items-center gap-1">
          <ShieldAlert size={12} /> Notificação ao Conselho Tutelar obrigatória (Lei nº 13.803/2019)
        </p>
      )}

      {abandono30dias && (
        <p className="text-[11px] text-signal flex items-center gap-1">
          <AlertTriangle size={12} /> 30+ dias sem retorno — caracteriza abandono escolar (Documento
          Orientador de Busca Ativa Escolar / ECA art. 56); reencaminhar ao Conselho Tutelar
        </p>
      )}

      {etapasComNota.length > 0 && (
        <div className="text-[11px] text-night/50 space-y-1 border-t border-paper-line pt-2">
          {etapasComNota.map(([et, txt]) => (
            <p key={et}>
              <span className="font-medium text-night/70">{ETAPA_TITULO_POR_N[et]}:</span> {txt}
            </p>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-paper-line">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wide text-night/40">
            Observação — {ETAPA_TITULO_POR_N[caso.etapa_atual]}
          </label>
          {obsSalva && <span className="text-[10px] text-sage">salvo</span>}
        </div>
        <textarea
          className="mt-1 w-full text-xs border border-paper-line rounded-md px-2 py-1.5 bg-white/60 focus:outline-none min-h-[46px]"
          value={textoObs}
          onChange={(e) => setTextoObs(e.target.value)}
          onBlur={salvarObs}
          placeholder="Informações recebidas nesta etapa..."
        />
      </div>

      <div className="space-y-2 pt-1">
        {caso.etapa_atual === 2 && (
          <button
            onClick={() => onCopiarMensagem(caso)}
            className="w-full text-xs flex items-center justify-center gap-1 text-night/60 hover:text-night border border-paper-line rounded-md px-2 py-1.5"
          >
            {copiado ? <Check size={12} /> : <Copy size={12} />}
            {copiado ? 'Copiado' : 'Copiar mensagem'}
          </button>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onGerarFicai(caso)}
            className="text-xs text-signal hover:underline px-2 py-1"
          >
            Gerar FICAI
          </button>
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
    </div>
  )
}

function ModalImportarPDF({ onFechar, casosExistentes, onConfirmar, diasLetivos }) {
  const inputRef = useRef(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(null)
  const [candidatos, setCandidatos] = useState(null)
  const [nomeArquivo, setNomeArquivo] = useState(null)

  const nomesExistentes = useMemo(
    () => new Set(casosExistentes.map((c) => (c.nome_aluno || '').toLowerCase().trim())),
    [casosExistentes]
  )
  const matriculasExistentes = useMemo(
    () => new Set(casosExistentes.map((c) => c.matricula).filter(Boolean)),
    [casosExistentes]
  )

  async function lerPDF(file) {
    setProcessando(true)
    setErro(null)
    setNomeArquivo(file.name)
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

        // agrupa os fragmentos de texto por linha real da tabela,
        // usando a coordenada Y (altura) de cada fragmento — sem isso,
        // o pdf.js devolve a página inteira como um só bloco de texto
        const porLinha = new Map()
        content.items.forEach((item) => {
          const y = Math.round(item.transform[5])
          if (!porLinha.has(y)) porLinha.set(y, [])
          porLinha.get(y).push(item)
        })

        const linhasDaPagina = [...porLinha.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, itens]) =>
            itens
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map((it) => it.str)
              .join(' ')
          )

        textoCompleto += linhasDaPagina.join('\n') + '\n'
      }

      const extraidos = extrairCandidatosFNJ(textoCompleto, diasLetivos)
      if (extraidos.length === 0) {
        setErro(
          'Nenhum aluno atingiu o critério de atenção (frequência abaixo do mínimo da etapa de ensino) ou de notificação obrigatória (30% sobre o percentual de faltas permitido em lei) neste PDF. Confira se o arquivo é o relatório de Faltas Não Justificadas correto.'
        )
      }
      setCandidatos(
        extraidos.map((c) => {
          const existe =
            (c.matricula && matriculasExistentes.has(c.matricula)) ||
            nomesExistentes.has(c.nome.toLowerCase().trim())
          return { ...c, jaExiste: existe, selecionado: !existe }
        })
      )
    } catch (e) {
      console.error('[BuscaAtiva] Erro ao ler PDF:', e)
      setErro(`Não foi possível ler este PDF (detalhe técnico: ${e?.message || e}). Confira se o arquivo não está corrompido ou protegido por senha.`)
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
              Critério legal (Lei nº 13.803/2019): notificação obrigatória ao Conselho Tutelar quando
              as faltas ultrapassam 30% do percentual permitido — 25% no Fundamental, 40% na Educação
              Infantil — calculado sobre {diasLetivos} dias letivos. Abaixo disso, frequência menor que
              o mínimo da etapa (75%/60%) entra como atenção preventiva.
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
              {candidatos.length} aluno(s) sinalizado(s) — revise nomes e turmas antes de confirmar.{' '}
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
                        {c.nivel === 'critico' ? 'notificação obrigatória' : 'atenção'}
                      </span>
                      {c.jaExiste && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-night/10 text-night/50">
                          já existe na plataforma
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-night/50 font-mono mt-0.5">
                      {c.etapaEnsino} · Nº FNJ {c.numFNJ}
                      {c.limiteNotificacao != null ? ` (limite ${c.limiteNotificacao})` : ''} · Freq.{' '}
                      {c.percentualFreq.toFixed(2)}%
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
                onClick={() => onConfirmar(selecionados, nomeArquivo)}
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
  const [diasLetivos, setDiasLetivos] = useState(DIAS_LETIVOS_PADRAO)
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear())
  const [ficaiCaso, setFicaiCaso] = useState(null)

  useEffect(() => {
    carregarCasos()
    carregarConfig()
  }, [])

  async function carregarConfig() {
    const { data, error } = await supabase.from('busca_ativa_config').select('*').eq('id', 1).maybeSingle()
    if (!error && data) {
      setDiasLetivos(data.dias_letivos)
      setAnoLetivo(data.ano_letivo)
    }
  }

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
    const payload = { ...novoCaso, ano_letivo: anoLetivo, criado_em: new Date().toISOString() }
    const { data, error } = await supabase.from('busca_ativa_casos').insert(payload).select()

    if (error) {
      setCasos((prev) => [{ ...payload, id: `local-${Date.now()}` }, ...prev])
    } else {
      setCasos((prev) => [data[0], ...prev])
    }
    setNovoCaso(CASO_VAZIO)
    setModalAberto(false)
  }

  async function importarCandidatosPDF(selecionados, nomeArquivo) {
    const hoje = new Date().toISOString().slice(0, 10)
    const novosPayloads = selecionados.map((c) => ({
      nome_aluno: c.nome,
      matricula: c.matricula,
      curso: c.curso,
      turma: c.turma,
      ano_letivo: anoLetivo,
      percentual_fnj: c.percentualFNJ,
      percentual_freq: c.percentualFreq,
      num_fnj: c.numFNJ,
      elegivel_notificacao: c.nivel === 'critico',
      data_primeira_falta: hoje,
      faltas_acumuladas: c.numFNJ || 0,
      status: 'ativo',
      etapa_atual: 1,
      origem_importacao: nomeArquivo || null,
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

  async function salvarObservacao(caso, etapa, texto) {
    const novasObs = { ...(caso.observacoes_por_etapa || {}), [etapa]: texto }
    setCasos((prev) => prev.map((c) => (c.id === caso.id ? { ...c, observacoes_por_etapa: novasObs } : c)))
    if (!String(caso.id).startsWith('local-')) {
      await supabase.from('busca_ativa_casos').update({ observacoes_por_etapa: novasObs }).eq('id', caso.id)
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
    const elegiveis = ativos.filter((c) => c.elegivel_notificacao)
    return { ativos: ativos.length, criticos: criticos.length, elegiveis: elegiveis.length, total: casos.length }
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
            Fluxo de 5 etapas — da identificação da falta até o acionamento do Conselho Tutelar —
            seguindo o Documento Orientador de Busca Ativa Escolar da SME e a Lei Federal nº 13.803/2019
            (ECA arts. 55/56).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setModalImportarAberto(true)}
            className="flex items-center gap-2 bg-paper-raised border border-paper-line text-night text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-night/5 transition-colors"
          >
            <Upload size={16} /> Importar PDF (SME)
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors"
          >
            <Plus size={16} /> Novo caso
          </button>
        </div>
      </header>

      {erroConexao && (
        <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg">
          Exibindo dados de exemplo — conecte o Supabase para persistir os registros reais.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-paper-raised border border-paper-line rounded-card p-4">
          <p className="text-2xl font-display text-night">{stats.ativos}</p>
          <p className="text-sm text-night/60">Casos ativos em acompanhamento</p>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-card p-4">
          <p className={`text-2xl font-display ${stats.elegiveis > 0 ? 'text-signal' : 'text-sage'}`}>
            {stats.elegiveis}
          </p>
          <p className="text-sm text-night/60">Notificação ao CT obrigatória (Lei 13.803/2019)</p>
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
                      onGerarFicai={setFicaiCaso}
                      onSalvarObservacao={salvarObservacao}
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

      {modalImportarAberto && (
        <ModalImportarPDF
          casosExistentes={casos}
          diasLetivos={diasLetivos}
          onFechar={() => setModalImportarAberto(false)}
          onConfirmar={importarCandidatosPDF}
        />
      )}

      {ficaiCaso && <FichaFicai caso={ficaiCaso} onFechar={() => setFicaiCaso(null)} />}
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
