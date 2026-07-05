// src/lib/gerarAvaliacaoPss.js
// Gera a Ficha de Avaliação de Desempenho Funcional - PSS direto no navegador
// (mesma estrutura testada e validada contra o modelo oficial da SME).
//
// Uso:
//   import { gerarAvaliacaoPssBlob } from '../lib/gerarAvaliacaoPss.js'
//   const blob = await gerarAvaliacaoPssBlob(dadosAvaliacao)
//   // depois: baixar o blob (ver função baixarBlob no fim do arquivo)

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, VerticalAlign, ShadingType, ImageRun
} from 'docx'
import brasaoUrl from '../assets/brasao.png'

const CRITERIOS = [
  { fator: 'I - ASSIDUIDADE', nome: 'FREQUÊNCIA', def: 'Comparecimento diário ao local de trabalho para o cumprimento de suas atribuições e permanência regular no local.' },
  { fator: 'I - ASSIDUIDADE', nome: 'PONTUALIDADE', def: 'Observância dos horários estabelecidos para o cumprimento de suas atribuições.' },
  { fator: 'II - DISCIPLINA', nome: 'CUMPRIMENTO', def: 'Capacidade para observar e cumprir as normas e regulamentos.' },
  { fator: 'II - DISCIPLINA', nome: 'ATENDIMENTO', def: 'Observância do contato cordial, respeito à individualidade, acompanhamento e retorno dos solicitantes dos serviços de sua responsabilidade.' },
  { fator: 'III - INICIATIVA / COOPERAÇÃO', nome: '', def: 'Capacidade para se antecipar aos fatos e empreender alternativas inovadoras no desenvolvimento de suas atividades e para a solução de problemas de trabalho.' },
  { fator: 'IV - QUALIDADE DO TRABALHO', nome: 'PRESTEZA', def: 'Pronto atendimento às solicitações e grau de precisão dispensados às atividades sob sua responsabilidade.' },
  { fator: 'IV - QUALIDADE DO TRABALHO', nome: 'INTERESSE', def: 'Empenho demonstrado em conhecer as atividades relacionadas com os objetivos de sua área de trabalho, delas participar e nelas se envolver e organiza suas atividades diárias para realizá-las no prazo estabelecido.' },
  { fator: 'IV - QUALIDADE DO TRABALHO', nome: 'COOPERAÇÃO', def: 'Disponibilidade em colaborar voluntariamente com colegas ou grupos, atendendo às solicitações do trabalho.' },
  { fator: 'V - RESPONSABILIDADE', nome: 'COMPROMISSO', def: 'Nível de atenção demonstrada no cumprimento de suas atribuições, na observância dos prazos e no alcance dos resultados estabelecidos.' },
  { fator: 'V - RESPONSABILIDADE', nome: 'ZELO', def: 'Cuidado na guarda de documentos e informações institucionais, conservação de bens sob sua responsabilidade, cuidado com informações sigilosas omitidas em sua unidade de trabalho.' }
]

const COLUNAS_AVALIACAO = [
  'NÃO ATENDEU ÀS EXPECTATIVAS',
  'ATENDEU PARCIALMENTE ÀS EXPECTATIVAS',
  'ATENDEU ÀS EXPECTATIVAS',
  'SUPEROU ÀS EXPECTATIVAS'
]

const PAGE_WIDTH = 11906
const MARGIN_LR = 550
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LR * 2
const W_FATOR = 1000
const W_CRITERIO = 750
const W_CHECK = 700
const W_DEF = USABLE_WIDTH - W_FATOR - W_CRITERIO - W_CHECK * 4
const TABLE_WIDTH = W_FATOR + W_CRITERIO + W_DEF + W_CHECK * 4

function linhaSublinhada(n) {
  return '_'.repeat(Math.max(0, n))
}

function cell(text, { width, bold = false, size = 18, align = AlignmentType.LEFT, shading = null, verticalMerge = null, verticalAlign = VerticalAlign.CENTER, margins = { top: 10, bottom: 10, left: 50, right: 50 } } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign,
    verticalMerge,
    shading: shading ? { type: ShadingType.CLEAR, fill: shading } : undefined,
    margins,
    children: Array.isArray(text) ? text : [
      new Paragraph({
        alignment: align,
        spacing: { after: 0, before: 0, line: 210, lineRule: 'auto' },
        children: [new TextRun({ text, bold, size })]
      })
    ]
  })
}

function celulaCheckbox(marcado, width) {
  return cell(marcado ? 'X' : '', { width, align: AlignmentType.CENTER, size: 22, bold: true })
}

function construirTabelaCriterios(notas) {
  const rows = []
  rows.push(new TableRow({
    tableHeader: true,
    children: [
      cell('FATORES', { width: W_FATOR, bold: true, align: AlignmentType.CENTER, size: 18 }),
      cell('', { width: W_CRITERIO, shading: 'D9D9D9' }),
      cell('DEFINIÇÕES', { width: W_DEF, bold: true, align: AlignmentType.CENTER, size: 18 }),
      new TableCell({
        width: { size: W_CHECK * 4, type: WidthType.DXA },
        columnSpan: 4,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, before: 0 }, children: [new TextRun({ text: 'AVALIAÇÃO - Assinale com (X)', bold: true, size: 18 })] })]
      })
    ]
  }))
  rows.push(new TableRow({
    tableHeader: true,
    children: [
      cell('', { width: W_FATOR }), cell('', { width: W_CRITERIO }), cell('', { width: W_DEF }),
      ...COLUNAS_AVALIACAO.map((c) => cell(c, { width: W_CHECK, bold: true, align: AlignmentType.CENTER, size: 14 }))
    ]
  }))

  let fatorAnterior = null
  CRITERIOS.forEach((crit, idx) => {
    const primeiraDoGrupo = crit.fator !== fatorAnterior
    const totalDoGrupo = CRITERIOS.filter((c) => c.fator === crit.fator).length
    fatorAnterior = crit.fator
    const notaIdx = notas ? notas[idx] : undefined

    rows.push(new TableRow({
      children: [
        totalDoGrupo > 1
          ? cell(primeiraDoGrupo ? crit.fator : '', { width: W_FATOR, bold: true, size: 14, align: AlignmentType.CENTER, verticalMerge: primeiraDoGrupo ? 'restart' : 'continue' })
          : cell(crit.fator, { width: W_FATOR, bold: true, size: 14, align: AlignmentType.CENTER }),
        cell(crit.nome, { width: W_CRITERIO, bold: true, size: 13, align: AlignmentType.CENTER }),
        cell(crit.def, { width: W_DEF, size: 13 }),
        ...COLUNAS_AVALIACAO.map((_, ci) => celulaCheckbox(notaIdx === ci, W_CHECK))
      ]
    }))
  })

  return new Table({ width: { size: TABLE_WIDTH, type: WidthType.DXA }, rows })
}

async function carregarBrasao() {
  const resp = await fetch(brasaoUrl)
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}

/**
 * Gera o Blob do docx de Avaliação PSS.
 * @param {object} dados
 *  - lotacao, funcionario_nome, cargo, data_lotacao
 *  - periodo_inicio, periodo_fim  (ex: 'ABR/2026', 'JUN/2026')
 *  - notas: { [indiceCriterio 0..9]: indiceColuna 0..3 }
 *  - consideracoes: string
 *  - indicacao: 'permanecer' | 'transferencia' | 'desligamento'
 *  - dia, mes, ano: string da data de assinatura
 */
export async function gerarAvaliacaoPssBlob(dados) {
  const brasaoBuffer = await carregarBrasao()
  const d = {
    lotacao: 'E.M. Regina Celi da Silva Cerdeira',
    funcionario_nome: '', cargo: '', data_lotacao: '',
    periodo_inicio: '', periodo_fim: '',
    notas: {}, consideracoes: '', indicacao: null,
    dia: '', mes: '', ano: String(new Date().getFullYear()),
    ...dados
  }

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: PAGE_WIDTH, height: 16838 }, margin: { top: 300, bottom: 300, left: MARGIN_LR, right: MARGIN_LR } } },
      children: [
        new Paragraph({
          children: [
            new ImageRun({ data: brasaoBuffer, type: 'png', transformation: { width: 48, height: 62 } }),
            new TextRun({ text: '  PREFEITURA DE DUQUE DE CAXIAS', bold: true, size: 20 })
          ]
        }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO', bold: true, size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'FICHA DE AVALIAÇÃO DE DESEMPENHO FUNCIONAL - PSS', bold: true, underline: {}, size: 22 })] }),

        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'LOTAÇÃO: ', bold: true, size: 20 }),
            new TextRun({ text: d.lotacao + linhaSublinhada(60 - d.lotacao.length), size: 20 })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'FUNCIONÁRIO(A): ', bold: true, size: 20 }),
            new TextRun({ text: (d.funcionario_nome || '') + linhaSublinhada(40 - (d.funcionario_nome || '').length), bold: true, size: 20 }),
            new TextRun({ text: '   CARGO: ', bold: true, size: 20 }),
            new TextRun({ text: (d.cargo || '') + linhaSublinhada(28 - (d.cargo || '').length), size: 20 }),
            new TextRun({ text: '   DATA DE LOTAÇÃO: ', bold: true, size: 20 }),
            new TextRun({ text: (d.data_lotacao || '') + linhaSublinhada(10), size: 20 })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 60, after: 100 },
          children: [new TextRun({ text: `AVALIAÇÃO DE DESEMPENHO - PERÍODO: ${d.periodo_inicio} até ${d.periodo_fim}`, bold: true, underline: {}, size: 20 })]
        }),

        construirTabelaCriterios(d.notas),

        new Paragraph({ text: '', spacing: { before: 60 } }),

        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell([new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: 'CONSIDERAÇÕES:', bold: true, size: 18 })] })], { width: TABLE_WIDTH })] }),
            new TableRow({ children: [cell([new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: d.consideracoes || '', size: 18 })] })], { width: TABLE_WIDTH, verticalAlign: VerticalAlign.TOP, margins: { top: 40, bottom: 140, left: 80, right: 80 } })] })
          ]
        }),

        new Paragraph({ text: '', spacing: { before: 60 } }),

        new Paragraph({
          spacing: { before: 60, after: 100 },
          children: [
            new TextRun({ text: 'INDICAÇÃO: ', bold: true, size: 20 }),
            new TextRun({ text: `(${d.indicacao === 'permanecer' ? 'X' : ' '}) PERMANECER NO SETOR   `, size: 20 }),
            new TextRun({ text: `(${d.indicacao === 'transferencia' ? 'X' : ' '}) TRANSFERÊNCIA DE SETOR   `, size: 20 }),
            new TextRun({ text: `(${d.indicacao === 'desligamento' ? 'X' : ' '}) DESLIGAMENTO`, size: 20 })
          ]
        }),

        new Paragraph({ children: [new TextRun({ text: `Duque de Caxias, ${d.dia || '_____'} / ${d.mes || '_____'} / ${d.ano}`, size: 20 })] }),

        new Table({
          width: { size: TABLE_WIDTH, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                cell([new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4 } }, children: [new TextRun({ text: 'Chefe Imediato Contratado', size: 16 })] })], { width: TABLE_WIDTH / 2 }),
                cell([
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DE ACORDO,', bold: true, size: 16 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4 } }, spacing: { before: 150 }, children: [new TextRun({ text: 'Departamento de Gestão de Pessoal          Subsecretária', size: 16 })] })
                ], { width: TABLE_WIDTH / 2 })
              ]
            })
          ]
        })
      ]
    }]
  })

  return Packer.toBlob(doc)
}

/** Dispara o download do blob no navegador com um nome de arquivo amigável. */
export function baixarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
