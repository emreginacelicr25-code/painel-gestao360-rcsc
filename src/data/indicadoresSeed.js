// Indicadores oficiais do Plano de Ação Anual 2026 — seção 9.2 (gerais) e
// seção 3.5 (Busca Ativa). O valor apurado começa vazio ("A apurar") e é
// preenchido pela equipe a cada bimestre diretamente na interface.

export const INDICADORES_SEED = [
  {
    indicador: 'Taxa de frequência escolar',
    meta: '≥ 85% em todas as turmas',
    verificacao: 'Planilha de Busca Ativa + e-Duque',
    responsavel: 'OE + Secretaria'
  },
  {
    indicador: 'PEIs elaborados e revisados',
    meta: '100% dos alunos com laudo ou avaliação',
    verificacao: 'Pasta dos alunos + Drive',
    responsavel: 'OP + Prof. AEE + Psicólogo'
  },
  {
    indicador: 'Relatórios descritivos entregues no prazo',
    meta: '100% dos professores em todos os bimestres',
    verificacao: 'Controle OP + Secretaria',
    responsavel: 'OP + Secretaria'
  },
  {
    indicador: 'Solicitações de AAI protocoladas',
    meta: '100% dos alunos com direito a AAI',
    verificacao: 'Protocolo da Direção',
    responsavel: 'Direção'
  },
  {
    indicador: 'Eventos realizados',
    meta: '100% dos eventos previstos no calendário',
    verificacao: 'Registro no Drive escolar',
    responsavel: 'Direção + OP'
  },
  {
    indicador: 'Atas de COC assinadas',
    meta: '100% dos COCs com atas completas e assinadas',
    verificacao: 'Secretaria',
    responsavel: 'Secretaria'
  },
  {
    indicador: 'Projeto Pedagógico entregue',
    meta: 'Entregue e protocolado no DAISE em 2026',
    verificacao: 'Protocolo da Secretaria',
    responsavel: 'Direção + OP'
  },
  {
    indicador: 'Casos de Busca Ativa encerrados',
    meta: 'Zero casos com abandono não documentado ao final do ano',
    verificacao: 'Planilha de Busca Ativa',
    responsavel: 'Direção + OE'
  },
  {
    indicador: 'Respostas ao contato inicial (WhatsApp) — Busca Ativa',
    meta: '≥ 70% de resposta no 1º contato',
    verificacao: 'Planilha de Busca Ativa',
    responsavel: 'OE Elaine'
  }
]

export const BIMESTRES_INDICADORES = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Anual']
