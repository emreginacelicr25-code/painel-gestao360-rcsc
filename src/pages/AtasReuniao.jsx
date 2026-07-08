import React, { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, X, ClipboardList, CheckCircle2, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

const CATEGORIAS = {
  temas: { label: 'Temas Tratados', color: 'bg-night/10 text-night' },
  encaminhamentos: { label: 'Encaminhamentos', color: 'bg-moon/20 text-moon-deep' },
  avaliacao: { label: 'Avaliação Pedagógica', color: 'bg-sage/15 text-sage' },
  planejamento: { label: 'Planejamento', color: 'bg-moon/20 text-moon-deep' },
  busca_ativa: { label: 'Busca Ativa', color: 'bg-night/10 text-night' },
  outros: { label: 'Outros', color: 'bg-sage/15 text-sage' }
}

function proximaQuinta() {
  const hoje = new Date()
  const dia = hoje.getDay()
  const diff = (4 - dia + 7) % 7
  const alvo = new Date(hoje)
  alvo.setDate(hoje.getDate() + (diff === 0 ? 7 : diff))
  return alvo.toISOString().slice(0, 10)
}

function formatarData(dataISO) {
  if (!dataISO) return ''
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AtasReuniao() {
  const { usuario } = useAuth()
  const [aba, setAba] = useState('pauta')
  const [dataSelecionada, setDataSelecionada] = useState(proximaQuinta())
  const [datasDisponiveis, setDatasDisponiveis] = useState([])
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [novoConteudo, setNovoConteudo] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('temas')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarDatas()
  }, [])

  useEffect(() => {
    carregarRegistros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada])

  async function carregarDatas() {
    const { data, error } = await supabase
      .from('atas_reuniao')
      .select('data_reuniao')
      .order('data_reuniao', { ascending: false })

    if (!error && data) {
      const unicas = Array.from(new Set(data.map((r) => r.data_reuniao)))
      setDatasDisponiveis(unicas)
    }
  }

  async function carregarRegistros() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase
      .from('atas_reuniao')
      .select('*')
      .eq('data_reuniao', dataSelecionada)
      .order('criado_em', { ascending: true })

    if (error) {
      setErro('Não foi possível carregar os registros. Tente novamente.')
      setRegistros([])
    } else {
      setRegistros(data || [])
    }
    setCarregando(false)
  }

  const pautaItens = useMemo(() => registros.filter((r) => r.tipo === 'pauta'), [registros])
  const ataItens = useMemo(() => registros.filter((r) => r.tipo === 'entrada'), [registros])

  const ataAgrupada = useMemo(() => {
    const grupos = {}
    for (const chave of Object.keys(CATEGORIAS)) grupos[chave] = []
    for (const item of ataItens) {
      if (grupos[item.categoria]) grupos[item.categoria].push(item)
      else grupos.outros.push(item)
    }
    return grupos
  }, [ataItens])

  async function adicionarRegistro() {
    if (!novoConteudo.trim()) return
    setEnviando(true)
    setErro('')

    const payload = {
      tipo: aba === 'pauta' ? 'pauta' : 'entrada',
      data_reuniao: dataSelecionada,
      categoria: aba === 'pauta' ? null : novaCategoria,
      conteudo: novoConteudo.trim(),
      autor_nome: usuario?.nome_exibicao || 'Desconhecido',
      autor_id: usuario?.id ? String(usuario.id) : null
    }

    const { error } = await supabase.from('atas_reuniao').insert(payload)

    if (error) {
      setErro('Não foi possível salvar. Tente novamente.')
    } else {
      setNovoConteudo('')
      if (!datasDisponiveis.includes(dataSelecionada)) {
        setDatasDisponiveis((prev) => [dataSelecionada, ...prev])
      }
      await carregarRegistros()
    }
    setEnviando(false)
  }

  async function excluirRegistro(id) {
    const confirmar = window.confirm('Excluir este registro?')
    if (!confirmar) return
    const { error } = await supabase.from('atas_reuniao').delete().eq('id', id)
    if (!error) {
      await carregarRegistros()
    }
  }

  const podeExcluir = (item) => usuario?.papel === 'diretor' || item.autor_id === String(usuario?.id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <BookOpen className="w-7 h-7 text-night" />
        <h1 className="text-2xl font-semibold text-night">Atas de Reunião</h1>
      </div>
      <p className="text-night/60 mb-6">
        Reuniões quinzenais de equipe — quintas-feiras, 13h. Pauta colaborativa e registro estruturado da ata.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl border border-night/10 p-4">
        <Calendar className="w-5 h-5 text-night/50" />
        <label className="text-sm text-night/70">Reunião de:</label>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="border border-night/15 rounded-lg px-3 py-1.5 text-sm text-night"
        />
        {datasDisponiveis.length > 0 && (
          <select
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="border border-night/15 rounded-lg px-3 py-1.5 text-sm text-night"
          >
            <option value={dataSelecionada}>{formatarData(dataSelecionada)} (selecionada)</option>
            {datasDisponiveis
              .filter((d) => d !== dataSelecionada)
              .map((d) => (
                <option key={d} value={d}>
                  {formatarData(d)}
                </option>
              ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAba('pauta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            aba === 'pauta' ? 'bg-night text-white' : 'bg-white text-night/70 border border-night/10'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Pauta ({pautaItens.length})
        </button>
        <button
          onClick={() => setAba('ata')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            aba === 'ata' ? 'bg-night text-white' : 'bg-white text-night/70 border border-night/10'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Registro da Ata ({ataItens.length})
        </button>
      </div>

      {erro && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</div>
      )}

      <div className="bg-white rounded-xl border border-night/10 p-4 mb-6">
        {aba === 'ata' && (
          <select
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            className="mb-3 border border-night/15 rounded-lg px-3 py-1.5 text-sm text-night"
          >
            {Object.entries(CATEGORIAS).map(([chave, { label }]) => (
              <option key={chave} value={chave}>
                {label}
              </option>
            ))}
          </select>
        )}
        <textarea
          value={novoConteudo}
          onChange={(e) => setNovoConteudo(e.target.value)}
          placeholder={aba === 'pauta' ? 'Propor um tema para a pauta...' : 'Registrar um item da ata...'}
          rows={3}
          className="w-full border border-night/15 rounded-lg px-3 py-2 text-sm text-night resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={adicionarRegistro}
            disabled={enviando || !novoConteudo.trim()}
            className="flex items-center gap-1.5 bg-sage text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {enviando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {carregando ? (
        <p className="text-night/50 text-sm">Carregando...</p>
      ) : aba === 'pauta' ? (
        <div className="space-y-3">
          {pautaItens.length === 0 && (
            <p className="text-night/50 text-sm">Nenhum item de pauta ainda para esta reunião.</p>
          )}
          {pautaItens.map((item) => (
            <ItemCard key={item.id} item={item} podeExcluir={podeExcluir(item)} onExcluir={excluirRegistro} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(CATEGORIAS).map(([chave, { label, color }]) => (
            <div key={chave}>
              <div className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${color}`}>
                {label}
              </div>
              <div className="space-y-2">
                {ataAgrupada[chave].length === 0 ? (
                  <p className="text-night/40 text-sm">Nenhum registro nesta categoria.</p>
                ) : (
                  ataAgrupada[chave].map((item) => (
                    <ItemCard key={item.id} item={item} podeExcluir={podeExcluir(item)} onExcluir={excluirRegistro} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, podeExcluir, onExcluir }) {
  return (
    <div className="bg-white rounded-lg border border-night/10 p-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-night whitespace-pre-wrap">{item.conteudo}</p>
        <p className="text-xs text-night/45 mt-1">
          {item.autor_nome} · {formatarDataHora(item.criado_em)}
        </p>
      </div>
      {podeExcluir && (
        <button onClick={() => onExcluir(item.id)} className="text-night/30 hover:text-red-500 shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
          }
