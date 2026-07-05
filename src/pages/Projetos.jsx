import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, UploadCloud, FolderKanban } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { PROJETOS_SEED, EIXOS, BIMESTRES } from '../data/projetosSeed.js'
import MoonStatus from '../components/MoonStatus.jsx'

const EIXO_COLOR = {
  Pedagógico: 'bg-night/5 text-night',
  Inclusão: 'bg-signal/10 text-signal',
  Administrativo: 'bg-moon/15 text-moon-deep',
  Proteção: 'bg-sage/10 text-sage',
  Evento: 'bg-night/10 text-night'
}

const STATUS_CYCLE = ['aberta', 'em_andamento', 'concluida']

function ProjetoCard({ projeto, onAvancarEtapa }) {
  const [aberto, setAberto] = useState(false)
  const etapas = projeto.etapas || []
  const concluidas = etapas.filter((e) => e.status === 'concluida').length
  const progresso = etapas.length ? Math.round((concluidas / etapas.length) * 100) : 0

  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-paper/60"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${EIXO_COLOR[projeto.eixo] || ''}`}>
              {projeto.eixo}
            </span>
            <span className="text-[11px] text-night/40">{projeto.responsavel_geral}</span>
          </div>
          <p className="text-sm font-medium text-night leading-snug">{projeto.titulo}</p>
          {etapas.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 flex-1 max-w-[160px] bg-paper-line rounded-full overflow-hidden">
                <div className="h-full bg-sage rounded-full" style={{ width: `${progresso}%` }} />
              </div>
              <span className="text-[11px] text-night/40 font-mono">
                {concluidas}/{etapas.length} etapas
              </span>
            </div>
          )}
        </div>
        {aberto ? (
          <ChevronUp size={16} className="text-night/40 shrink-0 mt-1" />
        ) : (
          <ChevronDown size={16} className="text-night/40 shrink-0 mt-1" />
        )}
      </button>
      {aberto && (
        <div className="px-5 pb-4 pt-1 border-t border-paper-line">
          <p className="text-sm text-night/70 leading-relaxed mb-3">{projeto.descricao}</p>
          <ul className="space-y-2">
            {etapas.map((etapa, i) => (
              <li key={etapa.id || i} className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="text-sm text-night">{etapa.descricao}</p>
                  <p className="text-xs text-night/40">
                    {etapa.responsavel}
                    {etapa.prazo ? ` · ${new Date(etapa.prazo).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <button onClick={() => onAvancarEtapa(projeto, etapa)} className="shrink-0" title="Clique para avançar o status">
                  <MoonStatus status={etapa.status || 'aberta'} size={16} showLabel={false} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Projetos() {
  const [projetos, setProjetos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [bimestreAtivo, setBimestreAtivo] = useState('2º Bimestre')
  const [filtroEixo, setFiltroEixo] = useState('Todos')
  const [carregandoBase, setCarregandoBase] = useState(false)

  useEffect(() => {
    carregarProjetos()
  }, [])

  async function carregarProjetos() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('projetos')
      .select('*, projeto_etapas(*)')
      .order('bimestre', { ascending: true })

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[Projetos] Supabase indisponível, usando base semente local:', error.message)
        setErroConexao(true)
      }
      setProjetos(
        PROJETOS_SEED.map((p, i) => ({
          ...p,
          id: `seed-${i}`,
          etapas: p.etapas.map((e, j) => ({ ...e, id: `seed-${i}-${j}`, status: 'aberta' }))
        }))
      )
    } else {
      setErroConexao(false)
      setProjetos(data.map((p) => ({ ...p, etapas: p.projeto_etapas })))
    }
    setCarregando(false)
  }

  async function carregarBaseInicialNoSupabase() {
    setCarregandoBase(true)
    for (const projeto of PROJETOS_SEED) {
      const { etapas, ...projetoSemEtapas } = projeto
      const { data: projetoInserido, error } = await supabase
        .from('projetos')
        .insert(projetoSemEtapas)
        .select()
        .single()

      if (!error && projetoInserido) {
        const etapasComId = etapas.map((e, ordem) => ({ ...e, projeto_id: projetoInserido.id, ordem }))
        await supabase.from('projeto_etapas').insert(etapasComId)
      }
    }
    await carregarProjetos()
    setCarregandoBase(false)
  }

  async function avancarEtapa(projeto, etapa) {
    const idx = STATUS_CYCLE.indexOf(etapa.status || 'aberta')
    const proximo = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    setProjetos((prev) =>
      prev.map((p) =>
        p.id === projeto.id
          ? { ...p, etapas: p.etapas.map((e) => (e.id === etapa.id ? { ...e, status: proximo } : e)) }
          : p
      )
    )

    if (!String(etapa.id).startsWith('seed-')) {
      await supabase.from('projeto_etapas').update({ status: proximo }).eq('id', etapa.id)
    }
  }

  const projeto
