import {
  ClipboardList,
  Search,
  FolderKanban,
  Users,
  Scale,
  Compass,
  Link2,
  MessageCircle,
  CalendarClock,
  FileText
} from 'lucide-react'

// Lista central dos módulos que o diretor pode liberar/restringir por login.
// Usada no Sidebar (navegação), no App.jsx (proteção de rota) e no painel
// de Gerenciar Acessos (checkboxes de permissão). Painel Geral e Gerenciar
// Acessos não entram aqui: o primeiro é sempre liberado, o segundo é
// exclusivo do papel "diretor".
export const MODULOS = [
  { chave: 'crescente', to: '/crescente', label: 'Crescente (Tarefas)', icon: ClipboardList },
  { chave: 'busca-ativa', to: '/busca-ativa', label: 'Busca Ativa', icon: Search },
  { chave: 'mensagens', to: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { chave: 'agendamentos', to: '/agendamentos', label: 'Agendamentos', icon: CalendarClock },
  { chave: 'relatorios', to: '/relatorios', label: 'Solicitação de Relatórios', icon: FileText },
  { chave: 'projetos', to: '/projetos', label: 'Projetos & Ações', icon: FolderKanban },
  { chave: 'equipe', to: '/equipe', label: 'Equipe', icon: Users },
  { chave: 'legislacao', to: '/legislacao', label: 'Legislação & Documentos', icon: Scale },
  { chave: 'indicadores', to: '/indicadores', label: 'Indicadores', icon: Compass },
  { chave: 'integracoes', to: '/integracoes', label: 'Outras Plataformas', icon: Link2 }
]

export const TODOS_OS_MODULOS = MODULOS.map((m) => m.chave)
