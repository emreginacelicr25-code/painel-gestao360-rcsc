import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { MODULOS } from './data/modulos.js'
import Login from './pages/Login.jsx'
import PainelGeral from './pages/PainelGeral.jsx'
import Crescente from './pages/Crescente.jsx'
import BuscaAtiva from './pages/BuscaAtiva.jsx'
import Legislacao from './pages/Legislacao.jsx'
import Projetos from './pages/Projetos.jsx'
import Equipe from './pages/Equipe.jsx'
import Indicadores from './pages/Indicadores.jsx'
import Integracoes from './pages/Integracoes.jsx'
import GerenciarAcessos from './pages/GerenciarAcessos.jsx'
import Mensagens from './pages/Mensagens.jsx'
import Agendamentos from './pages/Agendamentos.jsx'
import RelatoriosSolicitados from './pages/RelatoriosSolicitados.jsx'
import AtasReuniao from './pages/AtasReuniao.jsx' 

const PAGINAS_POR_MODULO = {
  crescente: Crescente,
  'busca-ativa': BuscaAtiva,
  projetos: Projetos,
  equipe: Equipe,
  legislacao: Legislacao,
  indicadores: Indicadores,
  integracoes: Integracoes,
  mensagens: Mensagens,
  agendamentos: Agendamentos,
  relatorios: RelatoriosSolicitados, atas: AtasReuniao,
}

export default function App() {
  const { usuario, isDiretor, temAcesso, carregando } = useAuth()

  if (carregando) {
    return <div className="min-h-screen bg-night" />
  }

  if (!usuario) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 p-8 md:p-10 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<PainelGeral />} />
          {MODULOS.map(({ chave, to }) => {
            const Pagina = PAGINAS_POR_MODULO[chave]
            return (
              <Route
                key={to}
                path={to}
                element={temAcesso(chave) ? <Pagina /> : <Navigate to="/" replace />}
              />
            )
          })}
          <Route path="/acessos" element={isDiretor ? <GerenciarAcessos /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
