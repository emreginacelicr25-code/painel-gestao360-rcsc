import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Link2, ExternalLink, Settings2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

// ---------------------------------------------------------------
// Confirmado por Mário (print do Supabase): rcsc-inclusao e
// rcsc-triagem são PROJETOS SEPARADOS, cada um com seu próprio
// banco. Ou seja, este painel não pode simplesmente consultar as
// mesmas tabelas — cada plataforma precisa da própria URL + chave
// anon para gerarmos uma prévia ao vivo. Guardamos isso no
// navegador (localStorage), nunca no código-fonte, já que é
// informação de configuração local de cada gestor.
// ---------------------------------------------------------------

const PLATAFORMAS_PADRAO = [
  {
    chave: 'triagem',
    nome: 'RCSC Triagem',
    descricao: 'Triagem e fila de impressão da escola.',
    projetoSupabase: 'rcsc-triagem'
  },
  {
    chave: 'transporte',
    nome: 'Transporte Escolar',
    descricao: 'Gestão de transporte — painéis de administração e de monitor.',
    projetoSupabase: '—'
  },
  {
    chave: 'inclusao',
    nome: 'Plataforma de Inclusão',
    descricao: 'Monitoramento de inclusão (React/Vite na Vercel).',
    projetoSupabase: 'rcsc-inclusao'
  },
  {
    chave: 'documentos',
    nome: 'Central de Documentos',
    descricao: 'Hub de documentos administrativos, com aba de consulta somente leitura.',
    projetoSupabase: '—'
  }
]

const CHAVE_STORAGE = 'gestao-rcsc:integracoes-v2'

function lerConfigSalva() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(CHAVE_STORAGE) : null
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function salvarConfig(config) {
  try {
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(config))
  } catch {
    /* ambiente sem localStorage — fica só na sessão atual */
  }
}

function CardPlataforma({ plataforma, config, onSalvar }) {
  const [editando, setEditando] = useState(!config?.url)
  const [siteUrl, setSiteUrl] = useState(config?.siteUrl || '')
  const [supabaseUrl, setSupabaseUrl] = useState(config?.url || '')
  const [anonKey, setAnonKey] = useState(config?.anonKey || '')
  const [tabela, setTabela] = useState(config?.tabela || '')

  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | carregando | ok | erro

  useEffect(() => {
    if (config?.url && config?.anonKey && config?.tabela) {
      buscarPreview(config)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscarPreview(cfg) {
    setStatus('carregando')
    try {
      const client = createClient(cfg.url, cfg.anonKey)
      const { count, error } = await client.from(cfg.tabela).select('*', { count: 'exact', head: true })
      if (error) throw error
      setPreview({ count })
      setStatus('ok')
    } catch (e) {
      console.warn(`[Integrações] Falha ao consultar ${plataforma.nome}:`, e.message)
      setStatus('erro')
    }
  }

  function salvar() {
    const novaConfig = { siteUrl, url: supabaseUrl, anonKey, tabela }
    onSalvar(plataforma.chave, novaConfig)
    setEditando(false)
    if (supabaseUrl && anonKey && tabela) buscarPreview(novaConfig)
  }

  return (
    <div className="bg-paper-raised border border-paper-line rounded-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg text-night">{plataforma.nome}</p>
          <p className="text-sm text-night/60 mt-1">{plataforma.descricao}</p>
          {plataforma.projetoSupabase !== '—' && (
            <p className="text-[11px] text-night/35 font-mono mt-1">projeto: {plataforma.projetoSupabase}</p>
          )}
        </div>
        <button onClick={() => setEditando((v) => !v)} className="text-night/30 hover:text-night shrink-0">
          <Settings2 size={16} />
        </button>
      </div>

      {editando ? (
        <div className="mt-4 space-y-2.5">
          <div>
            <label className="text-[11px] text-night/50">Link do site (Vercel)</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5"
              placeholder="https://…vercel.app"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-night/50">Supabase Project URL</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
              placeholder="https://xxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
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
            <label className="text-[11px] text-night/50">Tabela para prévia (opcional)</label>
            <input
              className="w-full border border-paper-line rounded-lg px-3 py-2 text-sm mt-0.5 font-mono"
              placeholder="ex.: triagens, casos_inclusao"
              value={tabela}
              onChange={(e) => setTabela(e.target.value)}
            />
          </div>
          <button
            onClick={salvar}
            className="w-full bg-night text-white text-sm py-2 rounded-lg hover:bg-night-soft mt-1"
          >
            Salvar configuração
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {config?.tabela && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              {status === 'carregando' && <span className="text-night/40 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> consultando…</span>}
              {status === 'ok' && (
                <span className="text-sage flex items-center gap-1">
                  <CheckCircle2 size={12} /> {preview?.count ?? 0} registros em "{config.tabela}"
                </span>
              )}
              {status === 'erro' && (
                <span className="text-signal flex items-center gap-1">
                  <XCircle size={12} /> não foi possível consultar (verifique URL/chave/tabela)
                </span>
              )}
            </div>
          )}
          {config?.siteUrl ? (
            <a
              href={config.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-moon-deep flex items-center gap-1.5 hover:underline"
            >
              Abrir plataforma <ExternalLink size={13} />
            </a>
          ) : (
            <p className="text-xs text-night/40">Nenhum link configurado ainda — clique no ícone de engrenagem.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Integracoes() {
  const [config, setConfig] = useState({})

  useEffect(() => {
    setConfig(lerConfigSalva())
  }, [])

  function handleSalvar(chave, dados) {
    const novo = { ...config, [chave]: dados }
    setConfig(novo)
    salvarConfig(novo)
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Ecossistema Universo Digital</p>
        <h1 className="font-display text-3xl text-night flex items-center gap-3">
          <Link2 size={26} className="text-moon-deep" /> Outras Plataformas
        </h1>
        <p className="text-night/60 mt-1 max-w-xl">
          rcsc-inclusao e rcsc-triagem são projetos Supabase separados — por isso cada
          plataforma tem sua própria configuração de acesso abaixo (link do site + credenciais
          de leitura), em vez de uma conexão única.
        </p>
      </header>

      <div className="mb-6 text-sm bg-moon/10 border border-moon/30 text-moon-deep px-4 py-3 rounded-lg">
        <strong>Atenção ao plano Free do Supabase:</strong> sua organização já tem 2 projetos
        ativos (rcsc-inclusao e rcsc-triagem). Um projeto novo para este painel de gestão pode
        exigir upgrade de plano ou pausar um projeto existente — vale confirmar isso antes de
        criar o projeto <code>painel-gestao-rcsc</code> no Supabase.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATAFORMAS_PADRAO.map((p) => (
          <CardPlataforma key={p.chave} plataforma={p} config={config[p.chave]} onSalvar={handleSalvar} />
        ))}
      </div>

      <div className="mt-8 bg-paper-raised border border-paper-line rounded-lg p-4 text-sm text-night/70">
        <p className="font-medium text-night mb-1">Como preencher cada plataforma</p>
        <p>
          Em cada projeto no Supabase, vá em <strong>Project Settings → API</strong> e copie a
          <strong> Project URL</strong> e a <strong>anon public key</strong>. A chave anon é
          segura para uso no navegador — é a mesma usada pelo próprio site da plataforma. A
          "tabela para prévia" é opcional: se preenchida, este painel mostra quantos registros
          existem nela; se deixar em branco, o card só funciona como link direto.
        </p>
      </div>
    </div>
  )
      }
