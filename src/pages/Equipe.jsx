import React, { useEffect, useMemo, useState } from 'react'
import { UploadCloud, X, Camera, ExternalLink, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { FUNCIONARIOS_SEED, FUNCOES } from '../data/funcionariosSeed.js'

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

function ModalPerfil({ funcionario, onFechar, onSalvarFoto }) {
  const [fotoUrl, setFotoUrl] = useState(funcionario.foto_url || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await onSalvarFoto(funcionario, fotoUrl)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
      <div className="bg-paper-raised rounded-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">Perfil</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <Avatar funcionario={{ ...funcionario, foto_url: fotoUrl }} size={64} />
          <div>
            <p className="font-display text-lg text-night leading-tight">{funcionario.nome_completo}</p>
            <p className="text-sm text-night/50">{funcionario.funcao}</p>
          </div>
        </div>

        <dl className="space-y-3 text-sm mb-5">
          <div>
            <dt className="text-xs text-night/40 uppercase tracking-wide">Regime / dias</dt>
            <dd className="text-night">{funcionario.regime_dias}</dd>
          </div>
          <div>
            <dt className="text-xs text-night/40 uppercase tracking-wide">Atribuição central</dt>
            <dd className="text-night leading-relaxed">{funcionario.atribuicao_central}</dd>
          </div>
          {funcionario.documentos_url && (
            <div>
              <dt className="text-xs text-night/40 uppercase tracking-wide">Documentos</dt>
              <dd>
                <a
                  href={funcionario.documentos_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-moon-deep flex items-center gap-1 hover:underline"
                >
                  Abrir pasta <ExternalLink size={12} />
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div className="border-t border-paper-line pt-4">
          <label className="text-xs font-medium text-night/60 flex items-center gap-1.5 mb-1.5">
            <Camera size={13} /> Link da foto (Supabase Storage ou externo)
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-paper-line rounded-lg px-3 py-2 text-sm"
              placeholder="https://…"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
            />
            <button
              onClick={salvar}
              disabled={salvando}
              className="bg-night text-white text-sm px-4 rounded-lg hover:bg-night-soft"
            >
              {salvando ? '…' : 'Salvar'}
            </button>
          </div>
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
  const [selecionado, setSelecionado] = useState(null)
  const [carregandoBase, setCarregandoBase] = useState(false)

  useEffect(() => {
    carregarFuncionarios()
  }, [])

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

  async function salvarFoto(funcionario, fotoUrl) {
    setFuncionarios((prev) => prev.map((f) => (f.id === funcionario.id ? { ...f, foto_url: fotoUrl } : f)))
    if (!String(funcionario.id).startsWith('seed-')) {
      await supabase.from('funcionarios').update({ foto_url: fotoUrl }).eq('id', funcionario.id)
    }
    setSelecionado(null)
  }

  const funcionariosFiltrados = useMemo(() => {
    if (filtroFuncao === 'Todas') return funcionarios
    return funcionarios.filter((f) => f.funcao === filtroFuncao)
  }, [funcionarios, filtroFuncao])

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Equipe gestora e escolar</p>
        <h1 className="font-display text-3xl text-night flex items-center gap-3">
          <Users size={26} className="text-moon-deep" /> Equipe
        </h1>
        <p className="text-night/60 mt-1 max-w-xl">
          Todos os profissionais da E.M. Regina Celi, com função, regime de trabalho e
          atribuição central. Clique em um card para ver o perfil completo.
        </p>
      </header>

      {erroConexao && funcionarios[0]?.id?.startsWith('seed') && (
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

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['Todas', ...FUNCOES].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroFuncao(f)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filtroFuncao === f ? 'bg-night text-white' : 'bg-paper-raised border border-paper-line text-night/60 hover:bg-night/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-night/50">Carregando equipe…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {funcionariosFiltrados.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelecionado(f)}
              className="bg-paper-raised border border-paper-line rounded-card p-4 text-left hover:border-moon transition-colors"
            >
              <Avatar funcionario={f} />
              <p className="text-sm font-medium text-night mt-3 leading-tight">{f.nome_completo}</p>
              <p className="text-xs text-night/50 mt-0.5">{f.funcao}</p>
              <p className="text-[11px] text-night/35 mt-1">{f.regime_dias}</p>
            </button>
          ))}
        </div>
      )}

      {selecionado && (
        <ModalPerfil funcionario={selecionado} onFechar={() => setSelecionado(null)} onSalvarFoto={salvarFoto} />
      )}
    </div>
  )
}
