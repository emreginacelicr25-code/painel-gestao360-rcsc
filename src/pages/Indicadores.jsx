import React, { useEffect, useMemo, useState } from 'react'
import { Compass, Save } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { INDICADORES_SEED, BIMESTRES_INDICADORES } from '../data/indicadoresSeed.js'

function KpiCard({ label, valor, meta, tom = 'night' }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-card p-5">
      <p className={`text-3xl font-display text-${tom}`}>{valor}</p>
      <p className="text-sm text-night mt-1">{label}</p>
      {meta && <p className="text-xs text-night/40 mt-1">Meta: {meta}</p>}
    </div>
  )
}

function LinhaIndicador({ item, registro, onSalvar }) {
  const [valor, setValor] = useState(registro?.valor_apurado || '')
  const [observacao, setObservacao] = useState(registro?.observacao || '')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    setValor(registro?.valor_apurado || '')
    setObservacao(registro?.observacao || '')
  }, [registro])

  async function salvar() {
    setSalvando(true)
    await onSalvar(item.indicador, valor, observacao)
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 1500)
  }

  return (
    <tr className="border-t border-paper-line align-top">
      <td className="py-3.5 pr-4">
        <p className="text-sm text-night font-medium">{item.indicador}</p>
        <p className="text-xs text-night/40 mt-0.5">{item.responsavel}</p>
      </td>
      <td className="py-3.5 pr-4 text-xs text-night/60 max-w-[180px]">{item.meta}</td>
      <td className="py-3.5 pr-4">
        <input
          className="w-28 border border-paper-line rounded-md px-2 py-1.5 text-sm"
          placeholder="A apurar"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </td>
      <td className="py-3.5 pr-4">
        <input
          className="w-full border border-paper-line rounded-md px-2 py-1.5 text-sm"
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </td>
      <td className="py-3.5">
        <button
          onClick={salvar}
          disabled={salvando}
          className="text-night/50 hover:text-night flex items-center gap-1 text-xs"
          title="Salvar"
        >
          <Save size={14} /> {salvo ? 'Salvo' : ''}
        </button>
      </td>
    </tr>
  )
}

export default function Indicadores() {
  const [bimestre, setBimestre] = useState('2º Bimestre')
  const [registros, setRegistros] = useState([])
  const [kpisCrescente, setKpisCrescente] = useState(null)
  const [kpisBuscaAtiva, setKpisBuscaAtiva] = useState(null)

  useEffect(() => {
    carregarRegistros(bimestre)
    carregarKpisAoVivo()
  }, [bimestre])

  async function carregarRegistros(b) {
    const { data, error } = await supabase.from('indicadores_bimestrais').select('*').eq('bimestre', b)
    if (!error && data) setRegistros(data)
    else setRegistros([])
  }

  async function carregarKpisAoVivo() {
    const { data: tarefas } = await supabase.from('crescente_tarefas').select('status')
    if (tarefas && tarefas.length > 0) {
      const concluidas = tarefas.filter((t) => t.status === 'concluida').length
      const escaladas = tarefas.filter((t) => t.status === 'escalada').length
      setKpisCrescente({ total: tarefas.length, concluidas, escaladas })
    }

    const { data: casos } = await supabase.from('busca_ativa_casos').select('data_primeira_falta,status')
    if (casos && casos.length > 0) {
      const ativos = casos.filter((c) => !['transferido', 'evadido', 'retornou'].includes(c.status))
      const criticos = ativos.filter((c) => {
        const dias = c.data_primeira_falta
          ? Math.floor((Date.now() - new Date(c.data_primeira_falta).getTime()) / 86400000)
          : 0
        return dias >= 30
      })
      setKpisBuscaAtiva({ ativos: ativos.length, criticos: criticos.length })
    }
  }

  async function salvarIndicador(indicador, valor_apurado, observacao) {
    const existente = registros.find((r) => r.indicador === indicador)
    if (existente && !String(existente.id).startsWith('local-')) {
      await supabase.from('indicadores_bimestrais').update({ valor_apurado, observacao }).eq('id', existente.id)
    } else {
      const { data } = await supabase
        .from('indicadores_bimestrais')
        .insert({ bimestre, indicador, valor_apurado, observacao })
        .select()
      if (data) setRegistros((prev) => [...prev.filter((r) => r.indicador !== indicador), data[0]])
      return
    }
    setRegistros((prev) =>
      prev.map((r) => (r.indicador === indicador ? { ...r, valor_apurado, observacao } : r))
    )
  }

  const registroPorIndicador = useMemo(() => {
    const map = {}
    registros.forEach((r) => (map[r.indicador] = r))
    return map
  }, [registros])

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Painel de resultados</p>
        <h1 className="font-display text-3xl text-night flex items-center gap-3">
          <Compass size={26} className="text-moon-deep" /> Indicadores
        </h1>
        <p className="text-night/60 mt-1 max-w-xl">
          Indicadores oficiais do Plano de Ação Anual (seção 9.2) e dados calculados ao vivo a
          partir do Crescente e da Busca Ativa.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Tarefas concluídas (Crescente)"
          valor={kpisCrescente ? `${kpisCrescente.concluidas}/${kpisCrescente.total}` : '—'}
          tom="sage"
        />
        <KpiCard
          label="Tarefas escaladas"
          valor={kpisCrescente ? kpisCrescente.escaladas : '—'}
          tom={kpisCrescente?.escaladas > 0 ? 'signal' : 'sage'}
        />
        <KpiCard label="Casos de Busca Ativa em curso" valor={kpisBuscaAtiva ? kpisBuscaAtiva.ativos : '—'} />
        <KpiCard
          label="Casos com 30+ dias"
          valor={kpisBuscaAtiva ? kpisBuscaAtiva.criticos : '—'}
          meta="zero"
          tom={kpisBuscaAtiva?.criticos > 0 ? 'signal' : 'sage'}
        />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {BIMESTRES_INDICADORES.map((b) => (
          <button
            key={b}
            onClick={() => setBimestre(b)}
            className={`text-sm px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              bimestre === b ? 'bg-night text-white' : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="bg-paper-raised border border-paper-line rounded-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-night/40 uppercase tracking-wide">
              <th className="py-3 px-5 font-medium">Indicador</th>
              <th className="py-3 pr-4 font-medium">Meta</th>
              <th className="py-3 pr-4 font-medium">Apurado</th>
              <th className="py-3 pr-4 font-medium">Observação</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody className="px-5">
            {INDICADORES_SEED.map((item) => (
              <LinhaIndicador
                key={item.indicador}
                item={item}
                registro={registroPorIndicador[item.indicador]}
                onSalvar={salvarIndicador}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-night/40 mt-3 px-1">
        Os KPIs do topo são calculados automaticamente. Os valores apurados da tabela são
        preenchidos manualmente a cada bimestre e ficam salvos no Supabase.
      </p>
    </div>
  )
      }
