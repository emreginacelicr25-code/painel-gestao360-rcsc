import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Save } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

const MESES_ORDEM = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Soma as 12 faltas mensais (na ordem Jan..Dez) nos 4 bimestres, usando o
// mapa de bimestres configurado (qual mês pertence a qual bimestre) —
// vem de busca_ativa_config, ajustado conforme o calendário letivo do ano.
function calcularFaltasPorBimestre(faltasMensais, mapaBimestres) {
  if (!faltasMensais || !mapaBimestres) return null
  const somas = [0, 0, 0, 0]
  MESES_ORDEM.forEach((mes, i) => {
    const bim = mapaBimestres[mes]
    if (bim >= 1 && bim <= 4 && faltasMensais[i] != null) {
      somas[bim - 1] += Number(faltasMensais[i]) || 0
    }
  })
  return somas
}

// ---------------------------------------------------------------
// Dados fixos da escola, conforme o cabeçalho do modelo oficial de
// FICAI (Ficha de Comunicação de Aluno Infrequente).
// ---------------------------------------------------------------
const DADOS_ESCOLA = {
  censo: '33049130',
  telefone: '(21) 27730013',
  nome: 'E M Regina Celi da Silva Cerdeira',
  endereco: 'Avenida Perimetral Primavera',
  distrito: 'Campos Elyseos',
  email: 'escola2.reginaceli@smeduquedecaxias.rj.gov.br'
}

const TURNOS = [
  '1º – 7:30/11:30',
  '1º – 7:00/11:00',
  '2º – 13:00/17:00',
  '2º – 11:00/15:00',
  '3º – 15:00/19:00',
  '3º – 18:00/22:00'
]

const BIMESTRES = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre']

function camposVazios(caso) {
  return {
    nome_aluno: caso?.nome_aluno || '',
    id_aluno: caso?.matricula || '',
    data_nascimento: '',
    filiacao: '',
    endereco: '',
    cep: '',
    telefone: '',
    responsavel_na_escola: '',
    curso: caso?.curso || '',
    ano_escolaridade: caso?.serie || '',
    turma: caso?.turma || '',
    turno: null,
    frequenta_sala_recursos: null,
    faltas_injustificadas: ['', '', '', ''],
    dias_letivos: ['', '', '', ''],
    data_comunicacao: new Date().toISOString().slice(0, 10),
    observacao: '',
    nome_servidor: '',
    medidas: { telefone: false, impresso: false, vizinhos: false, visita: false, visita_data: '' },
    resultados: {
      telefones_nao_pertencem: false,
      compareceu_regularizou: false,
      compareceu_regularizou_data: '',
      compareceu_continuou: false,
      compareceu_continuou_data: '',
      nao_compareceu: false
    },
    motivos_alegados: '',
    situacao_familiar: '',
    participacao_reunioes: [null, null, null, null],
    documentos_anexos: '',
    encaminhamento_ct_data: '',
    nome_diretor: '',
    atuacao_mp_data_volta: '',
    promotor: ''
  }
}

// Marcador "( )" / "(X)" clicável — reproduz a notação do modelo
// original tanto na tela quanto na impressão (mais confiável que
// depender do checkbox nativo, que imprime de forma inconsistente
// entre navegadores).
function Marcador({ marcado, onToggle, texto }) {
  return (
    <span onClick={onToggle} className="cursor-pointer select-none whitespace-nowrap">
      ( {marcado ? 'X' : '\u00A0'} ) {texto}
    </span>
  )
}

function CampoLinha({ label, children, corSpan = 1 }) {
  return (
    <tr>
      <td className="border border-black/70 bg-[#BDD7EE] font-semibold text-xs px-2 py-1 align-top w-56">
        {label}
      </td>
      <td className="border border-black/70 text-xs px-2 py-1" colSpan={corSpan}>
        {children}
      </td>
    </tr>
  )
}

function FaixaTitulo({ children }) {
  return (
    <tr>
      <td colSpan={2} className="border border-black/70 bg-[#BDD7EE] font-bold text-xs text-center px-2 py-1">
        {children}
      </td>
    </tr>
  )
}

function inputTexto(valor, onChange, placeholder = '') {
  return (
    <input
      className="w-full border-0 focus:outline-none text-xs bg-transparent print:border-0"
      value={valor}
      placeholder={placeholder}
      onChange={onChange}
    />
  )
}

export default function FichaFicai({ caso, onFechar }) {
  const [dados, setDados] = useState(() => camposVazios(caso))
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [autoPreenchido, setAutoPreenchido] = useState(false)
  const [cadastroEncontrado, setCadastroEncontrado] = useState(false)
  const [turnoCadastro, setTurnoCadastro] = useState(null)

  useEffect(() => {
    async function carregarConfigEPreencher() {
      const { data: config } = await supabase.from('busca_ativa_config').select('*').eq('id', 1).maybeSingle()
      if (config && caso?.faltas_mensais) {
        const somas = calcularFaltasPorBimestre(caso.faltas_mensais, config.mapa_bimestres)
        if (somas) {
          const diasBim = config.dias_por_bimestre || {}
          setDados((prev) => {
            const aindaVazioFaltas = prev.faltas_injustificadas.every((v) => v === '')
            const aindaVazioDias = prev.dias_letivos.every((v) => v === '')
            return {
              ...prev,
              faltas_injustificadas: aindaVazioFaltas ? somas.map(String) : prev.faltas_injustificadas,
              dias_letivos: aindaVazioDias
                ? [1, 2, 3, 4].map((n) => String(diasBim[String(n)] ?? ''))
                : prev.dias_letivos
            }
          })
          setAutoPreenchido(true)
        }
      }

      if (caso?.matricula) {
        const { data: cadastro } = await supabase
          .from('busca_ativa_alunos_cadastro')
          .select('*')
          .eq('matricula', String(caso.matricula))
          .maybeSingle()
        if (cadastro) {
          setDados((prev) => ({
            ...prev,
            data_nascimento: prev.data_nascimento || cadastro.data_nascimento || '',
            filiacao: prev.filiacao || cadastro.filiacao || '',
            endereco: prev.endereco || cadastro.endereco || '',
            cep: prev.cep || cadastro.cep || '',
            telefone: prev.telefone || cadastro.telefone || '',
            ano_escolaridade: prev.ano_escolaridade || cadastro.serie || '',
            turma: prev.turma || cadastro.turma || '',
            frequenta_sala_recursos:
              prev.frequenta_sala_recursos ?? (cadastro.recebe_atendimento_especializado ? 'sim' : null)
          }))
          setTurnoCadastro(cadastro.turno || null)
          setCadastroEncontrado(true)
        }
      }
    }
    carregarConfigEPreencher()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(campo, valor) {
    setDados((prev) => ({ ...prev, [campo]: valor }))
  }
  function setLista(campo, indice, valor) {
    setDados((prev) => {
      const nova = [...prev[campo]]
      nova[indice] = valor
      return { ...prev, [campo]: nova }
    })
  }
  function setMedida(chave, valor) {
    setDados((prev) => ({ ...prev, medidas: { ...prev.medidas, [chave]: valor } }))
  }
  function setResultado(chave, valor) {
    setDados((prev) => ({ ...prev, resultados: { ...prev.resultados, [chave]: valor } }))
  }

  async function salvarRascunho(marcarEncaminhado) {
    setSalvando(true)
    const payload = {
      caso_id: String(caso.id).startsWith('local-') ? null : caso.id,
      data_encaminhamento: dados.encaminhamento_ct_data || null,
      dados_formulario: dados
    }
    const { error } = await supabase.from('busca_ativa_ficai').insert(payload)
    if (error) {
      console.warn('[FichaFicai] Não foi possível salvar no Supabase:', error.message)
    }
    if (marcarEncaminhado && payload.caso_id) {
      await supabase
        .from('busca_ativa_casos')
        .update({ etapa_atual: 5, status: 'aguardando_ct' })
        .eq('id', payload.caso_id)
      await supabase.from('busca_ativa_acoes').insert({
        caso_id: payload.caso_id,
        tipo_acao: 'encaminhamento_ficai',
        profissional: dados.nome_servidor || dados.nome_diretor || null,
        descricao: 'FICAI preenchida e encaminhada ao Conselho Tutelar.'
      })
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  function imprimir() {
    window.print()
  }

  return createPortal(
    <div id="ficai-modal-root" className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body > *:not(#ficai-modal-root) { display: none !important; }
          #ficai-modal-root {
            position: static !important;
            background: none !important;
            display: block !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .no-print, .no-print * { display: none !important; }
          #ficai-print-area table { page-break-inside: auto; }
          #ficai-print-area tr { page-break-inside: avoid; break-inside: avoid; }
          input, textarea { border: none !important; background: transparent !important; }
        }
      `}</style>

      <div className="bg-paper-raised rounded-card w-full max-w-3xl p-6 my-8">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="font-display text-xl text-night">
            FICAI — {caso?.nome_aluno || 'Novo aluno'}
          </h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-night/50 mb-4 no-print">
          Preencha ou ajuste os campos abaixo. Nada é obrigatório para visualizar a impressão —
          salve quando quiser guardar um rascunho, e marque "salvar e encaminhar" só quando a
          ficha for de fato levada ao Conselho Tutelar (isso avança o caso para a Etapa 5).
          {cadastroEncontrado && (
            <span className="block text-sage mt-1">
              Dados cadastrais encontrados para esta matrícula — nascimento, filiação e endereço
              já vieram preenchidos. Confira antes de imprimir.
            </span>
          )}
        </p>

        <div id="ficai-print-area" className="bg-white text-black">
          {/* Cabeçalho */}
          <div className="text-center text-[11px] leading-tight mb-2">
            <p className="font-bold">ESTADO DO RIO DE JANEIRO</p>
            <p className="font-bold">PREFEITURA MUNICIPAL DE DUQUE DE CAXIAS</p>
            <p className="font-bold">SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
            <p className="font-bold">{DADOS_ESCOLA.nome}</p>
            <p className="italic mt-1">{DADOS_ESCOLA.endereco}</p>
            <p className="italic">
              {DADOS_ESCOLA.telefone} Email: {DADOS_ESCOLA.email}
            </p>
          </div>

          <table className="w-full border-collapse border border-black/70 mb-0">
            <tbody>
              <FaixaTitulo>FICHA DE COMUNICAÇÃO DE ALUNO INFREQUENTE (FICAI)</FaixaTitulo>
            </tbody>
          </table>

          <table className="w-full border-collapse mb-0">
            <tbody>
              <FaixaTitulo>DADOS DA ESCOLA</FaixaTitulo>
              <CampoLinha label="CENSO">{DADOS_ESCOLA.censo}</CampoLinha>
              <CampoLinha label="TELEFONE">{DADOS_ESCOLA.telefone}</CampoLinha>
              <CampoLinha label="NOME DA ESCOLA">{DADOS_ESCOLA.nome}</CampoLinha>
              <CampoLinha label="ENDEREÇO">{DADOS_ESCOLA.endereco}</CampoLinha>
              <CampoLinha label="DISTRITO">{DADOS_ESCOLA.distrito}</CampoLinha>

              <FaixaTitulo>DADOS DO ALUNO</FaixaTitulo>
              <CampoLinha label="NOME DO ALUNO:">
                {inputTexto(dados.nome_aluno, (e) => set('nome_aluno', e.target.value))}
              </CampoLinha>
              <CampoLinha label="ID ALUNO:">
                {inputTexto(dados.id_aluno, (e) => set('id_aluno', e.target.value))}
              </CampoLinha>
              <CampoLinha label="DATA DE NASCIMENTO:">
                <input
                  type="date"
                  className="border-0 focus:outline-none text-xs bg-transparent"
                  value={dados.data_nascimento}
                  onChange={(e) => set('data_nascimento', e.target.value)}
                />
              </CampoLinha>
              <CampoLinha label="FILIAÇÃO:">
                {inputTexto(dados.filiacao, (e) => set('filiacao', e.target.value), 'Nome da mãe e/ou do pai')}
              </CampoLinha>
              <CampoLinha label="ENDEREÇO:">
                {inputTexto(dados.endereco, (e) => set('endereco', e.target.value))}
              </CampoLinha>
              <CampoLinha label="CEP:">{inputTexto(dados.cep, (e) => set('cep', e.target.value))}</CampoLinha>
              <CampoLinha label="TELEFONE:">
                {inputTexto(dados.telefone, (e) => set('telefone', e.target.value))}
              </CampoLinha>
              <CampoLinha label="RESPONSÁVEL NA ESCOLA:">
                {inputTexto(dados.responsavel_na_escola, (e) => set('responsavel_na_escola', e.target.value))}
              </CampoLinha>

              <FaixaTitulo>SITUAÇÃO ESCOLAR</FaixaTitulo>
              <CampoLinha label="CURSO">
                {inputTexto(dados.curso, (e) => set('curso', e.target.value))}
              </CampoLinha>
              <CampoLinha label="ANO DE ESCOLARIDADE">
                {inputTexto(dados.ano_escolaridade, (e) => set('ano_escolaridade', e.target.value))}
              </CampoLinha>
              <CampoLinha label="TURMA:">
                {inputTexto(dados.turma, (e) => set('turma', e.target.value))}
              </CampoLinha>
              <CampoLinha label="TURNO:">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {TURNOS.map((t, i) => (
                    <Marcador
                      key={t}
                      marcado={dados.turno === i}
                      onToggle={() => set('turno', dados.turno === i ? null : i)}
                      texto={t}
                    />
                  ))}
                </div>
                {turnoCadastro && (
                  <p className="no-print text-[10px] text-night/40 mt-1">
                    Cadastro indica: {turnoCadastro} — confirme o horário exato acima.
                  </p>
                )}
              </CampoLinha>
              <CampoLinha label="FREQUENTA A SALA DE RECURSOS:">
                <div className="flex gap-4">
                  <Marcador
                    marcado={dados.frequenta_sala_recursos === 'sim'}
                    onToggle={() => set('frequenta_sala_recursos', dados.frequenta_sala_recursos === 'sim' ? null : 'sim')}
                    texto="SIM"
                  />
                  <Marcador
                    marcado={dados.frequenta_sala_recursos === 'nao'}
                    onToggle={() => set('frequenta_sala_recursos', dados.frequenta_sala_recursos === 'nao' ? null : 'nao')}
                    texto="NÃO"
                  />
                </div>
              </CampoLinha>
              <CampoLinha label="Nº DE FALTAS INJUSTIFICADAS">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {BIMESTRES.map((b, i) => (
                    <label key={b} className="flex items-center gap-1">
                      <span className="whitespace-nowrap">{b}:</span>
                      <input
                        className="w-14 border-b border-black/40 text-xs bg-transparent focus:outline-none"
                        value={dados.faltas_injustificadas[i]}
                        onChange={(e) => setLista('faltas_injustificadas', i, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
                {autoPreenchido && (
                  <p className="no-print text-[10px] text-sage mt-1">
                    Preenchido automaticamente a partir da última importação de frequência — confira antes de imprimir.
                  </p>
                )}
              </CampoLinha>
              <CampoLinha label="Nº DE DIAS LETIVOS">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {BIMESTRES.map((b, i) => (
                    <label key={b} className="flex items-center gap-1">
                      <span className="whitespace-nowrap">{b}:</span>
                      <input
                        className="w-14 border-b border-black/40 text-xs bg-transparent focus:outline-none"
                        value={dados.dias_letivos[i]}
                        onChange={(e) => setLista('dias_letivos', i, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </CampoLinha>
              <CampoLinha label="DATA DA COMUNICAÇÃO:">
                <input
                  type="date"
                  className="border-0 focus:outline-none text-xs bg-transparent"
                  value={dados.data_comunicacao}
                  onChange={(e) => set('data_comunicacao', e.target.value)}
                />
              </CampoLinha>

              <FaixaTitulo>OBSERVAÇÃO ACERCA DO ALUNO</FaixaTitulo>
              <CampoLinha label="">
                <textarea
                  className="w-full border-0 focus:outline-none text-xs bg-transparent min-h-[50px]"
                  value={dados.observacao}
                  onChange={(e) => set('observacao', e.target.value)}
                />
              </CampoLinha>
              <CampoLinha label="NOME DO SERVIDOR:">
                {inputTexto(dados.nome_servidor, (e) => set('nome_servidor', e.target.value))}
              </CampoLinha>
              <CampoLinha label="ASSINATURA DO SERVIDOR:">
                <div className="h-8 border-b border-black/40" />
              </CampoLinha>

              <FaixaTitulo>MEDIDAS ADOTADAS PELA ESCOLA</FaixaTitulo>
              <CampoLinha label="">
                <div className="flex flex-col gap-1">
                  <Marcador
                    marcado={dados.medidas.telefone}
                    onToggle={() => setMedida('telefone', !dados.medidas.telefone)}
                    texto="CONVOCAÇÃO DO RESPONSÁVEL VIA TELEFONE"
                  />
                  <Marcador
                    marcado={dados.medidas.impresso}
                    onToggle={() => setMedida('impresso', !dados.medidas.impresso)}
                    texto="CONVOCAÇÃO DO RESPONSÁVEL VIA IMPRESSO"
                  />
                  <Marcador
                    marcado={dados.medidas.vizinhos}
                    onToggle={() => setMedida('vizinhos', !dados.medidas.vizinhos)}
                    texto="ATRAVÉS DE VIZINHOS"
                  />
                  <div className="flex items-center gap-2">
                    <Marcador
                      marcado={dados.medidas.visita}
                      onToggle={() => setMedida('visita', !dados.medidas.visita)}
                      texto="ATRAVÉS DE VISITA DOMICILIAR EM:"
                    />
                    <input
                      type="date"
                      className="border-0 border-b border-black/40 focus:outline-none text-xs bg-transparent"
                      value={dados.medidas.visita_data}
                      onChange={(e) => setMedida('visita_data', e.target.value)}
                    />
                  </div>
                </div>
              </CampoLinha>

              <FaixaTitulo>RESULTADOS OBTIDOS</FaixaTitulo>
              <CampoLinha label="">
                <div className="flex flex-col gap-1">
                  <Marcador
                    marcado={dados.resultados.telefones_nao_pertencem}
                    onToggle={() => setResultado('telefones_nao_pertencem', !dados.resultados.telefones_nao_pertencem)}
                    texto="OS TELEFONES PARA CONTATO NÃO PERTENCEM A FAMÍLIA"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Marcador
                      marcado={dados.resultados.compareceu_regularizou}
                      onToggle={() => setResultado('compareceu_regularizou', !dados.resultados.compareceu_regularizou)}
                      texto="RESPONSÁVEL COMPARECEU EM"
                    />
                    <input
                      type="date"
                      className="border-0 border-b border-black/40 focus:outline-none text-xs bg-transparent"
                      value={dados.resultados.compareceu_regularizou_data}
                      onChange={(e) => setResultado('compareceu_regularizou_data', e.target.value)}
                    />
                    <span>E REGULARIZOU A FREQUÊNCIA</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Marcador
                      marcado={dados.resultados.compareceu_continuou}
                      onToggle={() => setResultado('compareceu_continuou', !dados.resultados.compareceu_continuou)}
                      texto="RESPONSÁVEL COMPARECEU EM"
                    />
                    <input
                      type="date"
                      className="border-0 border-b border-black/40 focus:outline-none text-xs bg-transparent"
                      value={dados.resultados.compareceu_continuou_data}
                      onChange={(e) => setResultado('compareceu_continuou_data', e.target.value)}
                    />
                    <span>MAS O ALUNO CONTINUOU FALTANDO</span>
                  </div>
                  <Marcador
                    marcado={dados.resultados.nao_compareceu}
                    onToggle={() => setResultado('nao_compareceu', !dados.resultados.nao_compareceu)}
                    texto="RESPONSÁVEL NÃO COMPARECEU ÀS CONVOCAÇÕES FEITAS"
                  />
                </div>
              </CampoLinha>

              <FaixaTitulo>MOTIVOS ALEGADOS PARA FALTAS</FaixaTitulo>
              <CampoLinha label="">
                <textarea
                  className="w-full border-0 focus:outline-none text-xs bg-transparent min-h-[40px]"
                  value={dados.motivos_alegados}
                  onChange={(e) => set('motivos_alegados', e.target.value)}
                />
              </CampoLinha>

              <FaixaTitulo>SITUAÇÃO FAMILIAR E NECESSIDADES VERIFICADAS</FaixaTitulo>
              <CampoLinha label="">
                <textarea
                  className="w-full border-0 focus:outline-none text-xs bg-transparent min-h-[40px]"
                  value={dados.situacao_familiar}
                  onChange={(e) => set('situacao_familiar', e.target.value)}
                />
              </CampoLinha>

              <FaixaTitulo>PARTICIPAÇÃO DO RESPONSÁVEL NAS REUNIÕES</FaixaTitulo>
              <CampoLinha label="S – SIM  N – NÃO">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {BIMESTRES.map((b, i) => (
                    <div key={b} className="flex items-center gap-2">
                      <span className="whitespace-nowrap">{b}:</span>
                      <Marcador
                        marcado={dados.participacao_reunioes[i] === 'S'}
                        onToggle={() => setLista('participacao_reunioes', i, dados.participacao_reunioes[i] === 'S' ? null : 'S')}
                        texto="S"
                      />
                      <Marcador
                        marcado={dados.participacao_reunioes[i] === 'N'}
                        onToggle={() => setLista('participacao_reunioes', i, dados.participacao_reunioes[i] === 'N' ? null : 'N')}
                        texto="N"
                      />
                    </div>
                  ))}
                </div>
              </CampoLinha>

              <FaixaTitulo>DOCUMENTOS ANEXOS</FaixaTitulo>
              <CampoLinha label="">
                <textarea
                  className="w-full border-0 focus:outline-none text-xs bg-transparent min-h-[30px]"
                  value={dados.documentos_anexos}
                  onChange={(e) => set('documentos_anexos', e.target.value)}
                />
              </CampoLinha>

              <FaixaTitulo>ENCAMINHAMENTO DA FICAI AO CONSELHO TUTELAR – DATA:</FaixaTitulo>
              <CampoLinha label="DATA:">
                <input
                  type="date"
                  className="border-0 focus:outline-none text-xs bg-transparent"
                  value={dados.encaminhamento_ct_data}
                  onChange={(e) => set('encaminhamento_ct_data', e.target.value)}
                />
              </CampoLinha>
              <CampoLinha label="NOME DO DIRETOR:">
                {inputTexto(dados.nome_diretor, (e) => set('nome_diretor', e.target.value))}
              </CampoLinha>
              <CampoLinha label="ASSINATURA:">
                <div className="h-8 border-b border-black/40" />
              </CampoLinha>

              <FaixaTitulo>ATUAÇÃO DO MINISTÉRIO PÚBLICO</FaixaTitulo>
              <CampoLinha label="ENCAMINHAMENTO DA FICAI DE VOLTA À ESCOLA – DATA:">
                <input
                  type="date"
                  className="border-0 focus:outline-none text-xs bg-transparent"
                  value={dados.atuacao_mp_data_volta}
                  onChange={(e) => set('atuacao_mp_data_volta', e.target.value)}
                />
              </CampoLinha>
              <CampoLinha label="PROMOTOR DE JUSTIÇA:">
                {inputTexto(dados.promotor, (e) => set('promotor', e.target.value))}
              </CampoLinha>
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-paper-line no-print">
          {salvo && <span className="text-xs text-sage">Salvo!</span>}
          <div className="flex-1" />
          <button onClick={onFechar} className="text-sm text-night/60 hover:text-night px-3 py-2">
            Fechar
          </button>
          <button
            disabled={salvando}
            onClick={() => salvarRascunho(false)}
            className="text-sm flex items-center gap-1.5 border border-paper-line text-night font-medium px-4 py-2 rounded-lg hover:bg-night/5 disabled:opacity-50"
          >
            <Save size={15} /> Salvar rascunho
          </button>
          <button
            disabled={salvando}
            onClick={() => salvarRascunho(true)}
            className="text-sm flex items-center gap-1.5 bg-night text-white font-medium px-4 py-2 rounded-lg hover:bg-night-soft disabled:opacity-50"
          >
            <Save size={15} /> Salvar e encaminhar ao CT
          </button>
          <button
            onClick={imprimir}
            className="text-sm flex items-center gap-1.5 bg-signal text-white font-medium px-4 py-2 rounded-lg hover:opacity-90"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
