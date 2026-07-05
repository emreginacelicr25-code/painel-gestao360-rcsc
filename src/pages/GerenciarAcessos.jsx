import React, { useEffect, useState } from 'react'
import { KeyRound, Plus, X, RotateCcw, Power, ShieldCheck, ListChecks } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import { FUNCIONARIOS_SEED } from '../data/funcionariosSeed.js'
import { MODULOS, TODOS_OS_MODULOS } from '../data/modulos.js'

function gerarSenhaAleatoria() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function SeletorModulos({ selecionados, onMudar }) {
  function alternar(chave) {
    if (selecionados.includes(chave)) onMudar(selecionados.filter((c) => c !== chave))
    else onMudar([...selecionados, chave])
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {MODULOS.map((m) => (
        <label key={m.chave} className="flex items-center gap-2 text-sm text-night cursor-pointer">
          <input
            type="checkbox"
            checked={selecionados.includes(m.chave)}
            onChange={() => alternar(m.chave)}
            className="accent-night"
          />
          {m.label}
        </label>
      ))}
    </div>
  )
}

function ConfirmarSenhaDiretor({ onConfirmar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { usuario, setSenhaAtual } = useAuth()

  async function confirmar(e) {
    e.preventDefault()
    setErro('')
    const { data, error } = await supabase.rpc('eh_diretor_valido', {
      p_login: usuario.login,
      p_senha: senha
    })
    if (error || !data) {
      setErro('Senha incorreta.')
      return
    }
    setSenhaAtual(senha)
    onConfirmar(senha)
  }

  return (
    <div className="max-w-sm">
      <p className="text-sm text-night/70 mb-3">
        Por segurança, confirme sua senha para gerenciar os acessos da equipe.
      </p>
      <form onSubmit={confirmar} className="flex gap-2">
        <input
          type="password"
          autoFocus
          required
          className="flex-1 border border-paper-line rounded-lg px-3 py-2 text-sm"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button type="submit" className="bg-night text-white text-sm px-4 rounded-lg hover:bg-night-soft">
          Confirmar
        </button>
      </form>
      {erro && <p className="text-xs text-signal mt-2">{erro}</p>}
    </div>
  )
}

function ModalNovoUsuario({ onFechar, onCriado, credenciais }) {
  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState(gerarSenhaAleatoria())
  const [papel, setPapel] = useState('equipe')
  const [modulos, setModulos] = useState(TODOS_OS_MODULOS)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const { error } = await supabase.rpc('criar_usuario_acesso', {
      p_login_diretor: credenciais.login,
      p_senha_diretor: credenciais.senha,
      p_novo_login: login.trim(),
      p_nova_senha: senha,
      p_nome_exibicao: nome.trim(),
      p_papel: papel,
      p_funcionario_id: null,
      p_modulos_permitidos: modulos
    })
    setSalvando(false)
    if (error) {
      setErro(error.message.includes('duplicate') ? 'Esse login já existe.' : 'Não foi possível criar o login.')
      return
    }
    onCriado({ nome, login, senha, papel })
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-paper-raised rounded-card w-full max-w-md p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">Novo login</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-night/60">Nome de exibição</label>
            <input
              required
              list="funcionarios-lista"
              className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Liliam Vila Rangel"
            />
            <datalist id="funcionarios-lista">
              {FUNCIONARIOS_SEED.map((f) => (
                <option key={f.nome_completo} value={f.nome_completo} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-night/60">Login</label>
              <input
                required
                className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm font-mono"
                value={login}
                onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                placeholder="liliam.rangel"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-night/60">Papel</label>
              <select
                className="mt-1 w-full border border-paper-line rounded-lg px-3 py-2 text-sm"
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
              >
                <option value="equipe">Equipe</option>
                <option value="diretor">Diretor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-night/60">Senha inicial</label>
            <div className="flex gap-2 mt-1">
              <input
                required
                className="flex-1 border border-paper-line rounded-lg px-3 py-2 text-sm font-mono"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setSenha(gerarSenhaAleatoria())}
                className="text-xs text-night/50 hover:text-night border border-paper-line rounded-lg px-2"
              >
                gerar
              </button>
            </div>
            <p className="text-[11px] text-night/40 mt-1">
              Anote e repasse essa senha à pessoa — ela não fica visível de novo depois de criada.
            </p>
          </div>

          {papel === 'equipe' && (
            <div className="border-t border-paper-line pt-4">
              <label className="text-xs font-medium text-night/60 flex items-center gap-1.5 mb-2">
                <ListChecks size={13} /> Módulos que este login pode acessar
              </label>
              <SeletorModulos selecionados={modulos} onMudar={setModulos} />
            </div>
          )}
          {papel === 'diretor' && (
            <p className="text-xs text-night/40 border-t border-paper-line pt-4">
              Contas com papel Diretor têm acesso completo a todos os módulos automaticamente.
            </p>
          )}

          {erro && <p className="text-xs text-signal">{erro}</p>}
          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors"
          >
            {salvando ? 'Criando…' : 'Criar login'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ModalPermissoes({ usuarioAlvo, credenciais, onFechar, onSalvo }) {
  const [modulos, setModulos] = useState(usuarioAlvo.modulos_permitidos || [])
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.rpc('atualizar_permissoes_usuario', {
      p_login_diretor: credenciais.login,
      p_senha_diretor: credenciais.senha,
      p_usuario_id: usuarioAlvo.id,
      p_modulos_permitidos: modulos
    })
    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="fixed inset-0 bg-night/40 flex items-center justify-center p-4 z-50">
      <div className="bg-paper-raised rounded-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-night">Permissões de {usuarioAlvo.nome_exibicao}</h2>
          <button onClick={onFechar} className="text-night/40 hover:text-night">
            <X size={20} />
          </button>
        </div>
        <SeletorModulos selecionados={modulos} onMudar={setModulos} />
        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full bg-night text-white text-sm font-medium py-2.5 rounded-lg hover:bg-night-soft transition-colors mt-5"
        >
          {salvando ? 'Salvando…' : 'Salvar permissões'}
        </button>
      </div>
    </div>
  )
}

export default function GerenciarAcessos() {
  const { usuario, senhaAtual } = useAuth()
  const [credenciais, setCredenciais] = useState(senhaAtual ? { login: usuario.login, senha: senhaAtual } : null)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoPermissoes, setEditandoPermissoes] = useState(null)
  const [ultimaSenhaGerada, setUltimaSenhaGerada] = useState(null)

  useEffect(() => {
    if (credenciais) carregarUsuarios(credenciais)
  }, [credenciais])

  async function carregarUsuarios(cred) {
    setCarregando(true)
    const { data, error } = await supabase.rpc('listar_usuarios_acesso', {
      p_login_diretor: cred.login,
      p_senha_diretor: cred.senha
    })
    if (!error) setUsuarios(data || [])
    setCarregando(false)
  }

  async function alternarStatus(u) {
    await supabase.rpc('alternar_status_usuario', {
      p_login_diretor: credenciais.login,
      p_senha_diretor: credenciais.senha,
      p_usuario_id: u.id,
      p_ativo: !u.ativo
    })
    carregarUsuarios(credenciais)
  }

  async function redefinirSenha(u) {
    const nova = gerarSenhaAleatoria()
    await supabase.rpc('redefinir_senha_acesso', {
      p_login_diretor: credenciais.login,
      p_senha_diretor: credenciais.senha,
      p_usuario_id: u.id,
      p_nova_senha: nova
    })
    setUltimaSenhaGerada({ nome: u.nome_exibicao, senha: nova })
  }

  if (!credenciais) {
    return (
      <div className="max-w-4xl">
        <header className="mb-6">
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Acesso restrito</p>
          <h1 className="font-display text-3xl text-night flex items-center gap-3">
            <KeyRound size={26} className="text-moon-deep" /> Gerenciar Acessos
          </h1>
        </header>
        <ConfirmarSenhaDiretor onConfirmar={(senha) => setCredenciais({ login: usuario.login, senha })} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-moon-deep uppercase mb-2">Acesso restrito ao diretor</p>
          <h1 className="font-display text-3xl text-night flex items-center gap-3">
            <KeyRound size={26} className="text-moon-deep" /> Gerenciar Acessos
          </h1>
          <p className="text-night/60 mt-1 max-w-xl">
            Crie logins, defina quais módulos cada pessoa pode acessar, redefina senhas e
            ative/desative contas.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-night text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-night-soft transition-colors shrink-0"
        >
          <Plus size={16} /> Novo login
        </button>
      </header>

      {ultimaSenhaGerada && (
        <div className="mb-6 text-sm bg-sage/10 border border-sage/30 text-sage px-4 py-3 rounded-lg flex items-center justify-between">
          <span>
            Nova senha de <strong>{ultimaSenhaGerada.nome}</strong>: <code className="font-mono">{ultimaSenhaGerada.senha}</code> — repasse e não a mostre de novo.
          </span>
          <button onClick={() => setUltimaSenhaGerada(null)} className="text-sage/60 hover:text-sage">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="bg-paper-raised border border-paper-line rounded-card overflow-hidden">
        {carregando ? (
          <p className="p-6 text-sm text-night/50">Carregando…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-night/40 uppercase tracking-wide border-b border-paper-line">
                <th className="py-3 px-5 font-medium">Nome</th>
                <th className="py-3 px-4 font-medium">Login</th>
                <th className="py-3 px-4 font-medium">Papel</th>
                <th className="py-3 px-4 font-medium">Módulos</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-paper-line last:border-0">
                  <td className="py-3.5 px-5 text-night flex items-center gap-2">
                    {u.papel === 'diretor' && <ShieldCheck size={14} className="text-moon-deep" />}
                    {u.nome_exibicao}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-night/60">{u.login}</td>
                  <td className="py-3.5 px-4 text-night/70 capitalize">{u.papel}</td>
                  <td className="py-3.5 px-4 text-xs text-night/50">
                    {u.papel === 'diretor' ? 'Todos' : `${(u.modulos_permitidos || []).length}/${TODOS_OS_MODULOS.length}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.ativo ? 'bg-sage/15 text-sage' : 'bg-signal/10 text-signal'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      {u.papel !== 'diretor' && (
                        <button
                          onClick={() => setEditandoPermissoes(u)}
                          title="Editar módulos permitidos"
                          className="text-night/40 hover:text-night"
                        >
                          <ListChecks size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => redefinirSenha(u)}
                        title="Gerar nova senha"
                        className="text-night/40 hover:text-night"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => alternarStatus(u)}
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                        className={u.ativo ? 'text-night/40 hover:text-signal' : 'text-night/40 hover:text-sage'}
                      >
                        <Power size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <ModalNovoUsuario
          credenciais={credenciais}
          onFechar={() => setModalAberto(false)}
          onCriado={({ nome, login, senha }) => {
            setModalAberto(false)
            setUltimaSenhaGerada({ nome, senha })
            carregarUsuarios(credenciais)
          }}
        />
      )}

      {editandoPermissoes && (
        <ModalPermissoes
          usuarioAlvo={editandoPermissoes}
          credenciais={credenciais}
          onFechar={() => setEditandoPermissoes(null)}
          onSalvo={() => {
            setEditandoPermissoes(null)
            carregarUsuarios(credenciais)
          }}
        />
      )}
    </div>
  )
}
