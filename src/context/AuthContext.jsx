import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

const CHAVE_SESSAO = 'gestao-rcsc:sessao'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null) // { id, nome_exibicao, papel, funcionario_id, login }
  const [senhaAtual, setSenhaAtual] = useState('') // só em memória, nunca persistida
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_SESSAO)
      if (salvo) setUsuario(JSON.parse(salvo))
    } catch {
      /* sem localStorage disponível */
    }
    setCarregando(false)
  }, [])

  async function entrar(login, senha) {
    setErro('')
    const { data, error } = await supabase.rpc('verificar_login', { p_login: login, p_senha: senha })

    if (error) {
      setErro('Não foi possível conectar ao servidor. Tente novamente em instantes.')
      return false
    }

    const resultado = Array.isArray(data) ? data[0] : data
    if (!resultado?.sucesso) {
      setErro('Login ou senha incorretos.')
      return false
    }

    const sessao = {
      id: resultado.usuario_id,
      nome_exibicao: resultado.nome_exibicao,
      papel: resultado.papel,
      funcionario_id: resultado.funcionario_id,
      modulos_permitidos: resultado.modulos_permitidos || [],
      login
    }
    setUsuario(sessao)
    setSenhaAtual(senha) // guardado só em memória, usado para ações administrativas nesta sessão
    try {
      window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    } catch {
      /* sem localStorage disponível */
    }
    return true
  }

  function sair() {
    setUsuario(null)
    setSenhaAtual('')
    try {
      window.localStorage.removeItem(CHAVE_SESSAO)
    } catch {
      /* sem localStorage disponível */
    }
  }

  const isDiretor = usuario?.papel === 'diretor'

  function temAcesso(moduloChave) {
    if (!usuario) return false
    if (isDiretor) return true
    return (usuario.modulos_permitidos || []).includes(moduloChave)
  }

  return (
    <AuthContext.Provider value={{ usuario, senhaAtual, setSenhaAtual, isDiretor, temAcesso, carregando, erro, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
