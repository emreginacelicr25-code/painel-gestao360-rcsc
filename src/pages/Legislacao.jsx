import React, { useEffect, useMemo, useState } from 'react'
import { Search, ExternalLink, UploadCloud, ChevronDown, ChevronUp, Scale } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { LEGISLACAO_SEED, ESFERAS, TIPOS } from '../data/legislacaoSeed.js'

const ESFERA_COLOR = {
  Federal: 'bg-night/10 text-night',
  Estadual: 'bg-moon/20 text-moon-deep',
  Municipal: 'bg-sage/15 text-sage',
  'CME/DC': 'bg-signal/10 text-signal',
  Interno: 'bg-night/5 text-night/60'
}

function ItemLegislacao({ item }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-paper/60"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${ESFERA_COLOR[item.esfera] || ''}`}>
              {item.esfera}
            </span>
            <span className="text-[11px] text-night/40 font-mono">{item.numero_ato}</span>
          </div>
          <p className="text-sm font-medium text-night leading-snug">{item.titulo}</p>
        </div>
        {aberto ? (
          <ChevronUp size={16} className="text-night/40 shrink-0 mt-1" />
        ) : (
          <ChevronDown size={16} className="text-night/40 shrink-0 mt-1" />
        )}
      </button>
      {aberto && (
        <div className="px-5 pb-4 pt-1 border-t border-paper-line">
          <p className="text-sm text-night/70 leading-relaxed">{item.resumo}</p>
          <div className="flex items-center gap-4 mt-3">
            {item.data_publicacao && (
              <span className="text-xs text-night/40 font-mono">
                {new Date(item.data_publicacao).toLocaleDateString('pt-BR')}
              </span>
            )}
            <span className="text-xs text-night/40">{item.tema}</span>
            {item.arquivo_url && (
              <a
                href={item.arquivo_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-moon-deep flex items-center gap-1 hover:underline"
              >
                Abrir PDF <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Legislacao() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroEsfera, setFiltroEsfera] = useState('Todas')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [carregandoBase, setCarregandoBase] = useState(false)

  useEffect(() => {
    carregarItens()
  }, [])

  async function carregarItens() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('legislacao_documentos')
      .select('*')
      .order('esfera', { ascending: true })

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[Legislacao] Supabase indisponível, usando base semente local:', error.message)
        setErroConexao(true)
      }
      setItens(LEGISLACAO_SEED.map((it, i) => ({ ...it, id: `seed-${i}` })))
    } else {
      setErroConexao(false)
      setItens(data)
    }
    setCarregando(false)
  }

  async function carregarBaseInicialNoSupabase() {
    setCarregandoBase(true)
    const { error } = await supabase.from('legislacao_documentos').insert(LEGISLACAO_SEED)
    if (!error) {
      await carregarItens()
    } else {
      console.error('[Legislacao] Falha ao carregar base inicial:', error.message)
    }
    setCarregandoBase(false)
  }

  const itensFiltrados = useMemo(() => {
    return itens.filter((it) => {
      const combinaEsfera = filtroEsfera === 'Todas' || it.esfera === filtroEsfera
      const combinaTipo = filtroTipo === 'Todos' || it.tipo === filtroTipo
      const combinaBusca =
        !busca ||
        it.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        it.resumo?.toLowerCase().includes(busca.toLowerCase()) ||
        it.tema?.toLowerCase().includes(busca.toLowerCase())
      return combinaEsfera && combinaTipo && combinaBusca
    })
  }, [itens, busca, filtroEsfera, filtroTipo])

  const agrupadoPorEsfera = useMemo(() => {
    const grupos = {}
    itensFiltrados.forEach((it) => {
      if (!grupos[it.esfera]) grupos[it.esfera] = []
      grupos[it.esfera].push(it)
    })
    return grupos
  }, [itensFiltrados])

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Base legal e normativa</p>
        <h1 className="font-display text-3xl text-night flex items-center gap-3">
          <Scale size={26} className="text-moon-deep" /> Legislação & Documentos
        </h1>
        <p className="text-night/60 mt-1 max-w-xl">
          Consulta direta às leis, resoluções e deliberações que fundamentam a gestão da E.M.
          Regina Celi — federal, estadual, municipal e do Conselho Municipal de Educação.
        </p>
      </header>

      {erroConexao && itens[0]?.id?.startsWith('seed') && (
        <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span>Exibindo a base local (ainda não carregada no Supabase).</span>
          <button
            onClick={carregarBaseInicialNoSupabase}
            disabled={carregandoBase}
            className="flex items-center gap-1.5 text-xs bg-night text-white px-3 py-1.5 rounded-md hover:bg-night-soft whitespace-nowrap"
          >
            <UploadCloud size={13} /> {carregandoBase ? 'Carregando…' : 'Carregar base inicial'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-night/30" />
          <input
            placeholder="Buscar por título, tema ou palavra-chave…"
            className="w-full pl-9 pr-3 py-2.5 border border-paper-line rounded-lg text-sm bg-paper-raised"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="border border-paper-line rounded-lg px-3 py-2.5 text-sm bg-paper-raised"
          value={filtroEsfera}
          onChange={(e) => setFiltroEsfera(e.target.value)}
        >
          <option>Todas</option>
          {ESFERAS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <select
          className="border border-paper-line rounded-lg px-3 py-2.5 text-sm bg-paper-raised"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option>Todos</option>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {carregando ? (
        <p className="text-sm text-night/50">Carregando legislação…</p>
      ) : itensFiltrados.length === 0 ? (
        <p className="text-sm text-night/50">Nenhum documento encontrado para esses filtros.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(agrupadoPorEsfera).map(([esfera, lista]) => (
            <section key={esfera}>
              <h2 className="text-xs font-semibold text-night/40 uppercase tracking-wide mb-3">
                {esfera} · {lista.length} {lista.length === 1 ? 'documento' : 'documentos'}
              </h2>
              <div className="space-y-2">
                {lista.map((item) => (
                  <ItemLegislacao key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
          }
