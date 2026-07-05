// Base semente da Legislação & Documentos — extraída diretamente dos
// documentos analisados (Caderno de Orientações 2026, Resolução 003/2025-SME,
// Gestão Escolar Duque de Caxias, Mapa Normativo). Usada como fallback
// quando o Supabase ainda não tem os registros, e também pode ser inserida
// no banco com o botão "Carregar base inicial" dentro do módulo.

export const LEGISLACAO_SEED = [
  // ---------------- FEDERAL ----------------
  {
    titulo: 'Constituição Federal de 1988 — Art. 205',
    esfera: 'Federal',
    tipo: 'Lei',
    numero_ato: 'CF/1988',
    data_publicacao: '1988-10-05',
    tema: 'Gestão democrática',
    resumo:
      'Estabelece a educação como direito de todos e dever do Estado e da família, promovida com a colaboração da sociedade, e fundamenta a gestão democrática do ensino público.'
  },
  {
    titulo: 'LDB — Lei de Diretrizes e Bases da Educação Nacional',
    esfera: 'Federal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 9.394/1996',
    data_publicacao: '1996-12-20',
    tema: 'Organização da educação',
    resumo:
      'Estrutura a organização da educação nacional e orienta o funcionamento da escola pública e de seus processos pedagógicos e administrativos. Base para matrícula, EJA, educação especial e atribuições municipais (Art. 11).'
  },
  {
    titulo: 'ECA — Estatuto da Criança e do Adolescente',
    esfera: 'Federal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 8.069/1990',
    data_publicacao: '1990-07-13',
    tema: 'Proteção e busca ativa',
    resumo:
      'Fundamenta a proteção integral de crianças e adolescentes. O Art. 56 é a base legal da Busca Ativa Escolar e do encaminhamento de casos de infrequência ao Conselho Tutelar.'
  },
  {
    titulo: 'BNCC — Base Nacional Comum Curricular',
    esfera: 'Federal',
    tipo: 'Documento interno',
    numero_ato: '—',
    data_publicacao: null,
    tema: 'Currículo',
    resumo: 'Define as aprendizagens essenciais que todos os estudantes devem desenvolver ao longo da Educação Básica.'
  },
  {
    titulo: 'Plano Nacional de Educação (PNE)',
    esfera: 'Federal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 13.005/2014',
    data_publicacao: '2014-06-25',
    tema: 'Gestão democrática',
    resumo:
      'Reforça a gestão democrática, a universalização do atendimento, a valorização dos profissionais da educação e o acompanhamento das metas educacionais.'
  },
  {
    titulo: 'Decreto nº 7.611/2011',
    esfera: 'Federal',
    tipo: 'Decreto',
    numero_ato: 'Decreto nº 7.611/2011',
    data_publicacao: '2011-11-17',
    tema: 'Educação especial',
    resumo:
      'Dispõe sobre a educação especial e o Atendimento Educacional Especializado, incluindo os critérios de identificação de deficiência, TEA e altas habilidades/superdotação usados na matrícula.'
  },
  {
    titulo: 'Lei Estadual nº 7.614/2017 (RJ)',
    esfera: 'Estadual',
    tipo: 'Lei',
    numero_ato: 'Lei nº 7.614/2017',
    data_publicacao: '2017-05-11',
    tema: 'Proteção e busca ativa',
    resumo: 'Fundamenta, junto ao Art. 56 do ECA, a obrigatoriedade da Busca Ativa Escolar no Estado do Rio de Janeiro.'
  },

  // ---------------- MUNICIPAL — DUQUE DE CAXIAS ----------------
  {
    titulo: 'Lei da Gestão Democrática de Duque de Caxias',
    esfera: 'Municipal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 2.864/2017',
    data_publicacao: '2017-11-01',
    tema: 'Gestão democrática',
    resumo:
      'Principal norma municipal da rotina da direção escolar: institui o Conselho Escolar obrigatório, assegura grêmios estudantis, participação de responsáveis, autonomia pedagógica/administrativa/financeira das unidades, e regula a consulta pública para diretor e vice-diretor (requisitos, comissões, quórum, transição de gestão).'
  },
  {
    titulo: 'Plano Municipal de Educação (PME) de Duque de Caxias',
    esfera: 'Municipal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 2.713/2015',
    data_publicacao: '2015-06-01',
    tema: 'Gestão democrática',
    resumo: 'Consolida o planejamento decenal da educação municipal (2010–2020) e orienta metas de longo prazo da rede.'
  },
  {
    titulo: 'Planejamento Decenal da Educação de Duque de Caxias',
    esfera: 'Municipal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 2.640/2014',
    data_publicacao: '2014-01-01',
    tema: 'Gestão democrática',
    resumo: 'Base do Plano Municipal de Educação (2010–2020), referenciada na Resolução 003/2025-SME sobre matrícula.'
  },
  {
    titulo: 'Fundo Municipal de Educação',
    esfera: 'Municipal',
    tipo: 'Lei',
    numero_ato: 'Lei nº 3.170/2021',
    data_publicacao: '2021-01-01',
    tema: 'Administrativo / financeiro',
    resumo: 'Institui o Fundo Municipal de Educação de Duque de Caxias, base da autonomia financeira das unidades escolares.'
  },
  {
    titulo: 'Resolução de Matrícula 2026',
    esfera: 'Municipal',
    tipo: 'Resolução',
    numero_ato: 'Resolução nº 003/2025-SME',
    data_publicacao: '2025-10-30',
    tema: 'Matrícula',
    resumo:
      'Define os parâmetros da Matrícula 2026 para Educação Infantil, Ensino Fundamental, Educação Especial e EJA via Sistema e-Duque: três fases de matrícula, quantitativo de vagas por turma (ex.: até 22 na Ed. Infantil, até 28 no ciclo de alfabetização), formação de Classes Especiais (6 a 16 alunos conforme o tipo), renovação, migração, transferências internas, matrícula de estudantes público da Educação Especial, Busca Ativa (30 faltas = abandono) e calendário completo de matrícula (Anexo I).'
  },
  {
    titulo: 'Deliberação CME/DC nº 01/2005',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 01/2005',
    data_publicacao: '2005-01-01',
    tema: 'Organização da educação',
    resumo: 'Fixa as normas para a organização da Educação Básica no Sistema Municipal de Ensino de Duque de Caxias.'
  },
  {
    titulo: 'Deliberação CME/DC nº 08/2006',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 08/2006',
    data_publicacao: '2006-01-01',
    tema: 'Matrícula',
    resumo:
      'Fixa normas e procedimentos para acesso e permanência de alunos nas Unidades Escolares — inclusive prazo de 45 dias para entrega de histórico escolar pendente na matrícula.'
  },
  {
    titulo: 'Deliberação CME/DC nº 16/2016',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 16/2016',
    data_publicacao: '2016-01-01',
    tema: 'Educação especial',
    resumo: 'Regula o período prioritário de inscrição e matrícula de estudantes com deficiência, TGD/TEA e altas habilidades.'
  },
  {
    titulo: 'Deliberação CME/DC nº 19/2019',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 19/2019',
    data_publicacao: '2019-01-01',
    tema: 'EJA',
    resumo: 'Regula o ingresso na Educação de Jovens e Adultos a partir dos 15 anos, com autorização do responsável para menores de idade.'
  },
  {
    titulo: 'Deliberação CME/DC nº 24/2021',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 24/2021',
    data_publicacao: '2021-01-01',
    tema: 'Proteção e busca ativa',
    resumo:
      'Define o conceito de ausência escolar (3 dias consecutivos ou 5 dias alternados sem justificativa) que baliza o fluxo de Busca Ativa da rede.'
  },
  {
    titulo: 'Deliberação CME/DC nº 27/2023',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 27/2023',
    data_publicacao: '2023-01-01',
    tema: 'Matrícula',
    resumo: 'Altera dispositivo da Deliberação 01/2005, posteriormente revogado pela Deliberação 29/2024.'
  },
  {
    titulo: 'Deliberação CME/DC nº 29/2024',
    esfera: 'CME/DC',
    tipo: 'Deliberação',
    numero_ato: 'Deliberação nº 29/2024',
    data_publicacao: '2024-01-01',
    tema: 'Matrícula',
    resumo: 'Revoga o §2º do artigo 5º da Deliberação CME/DC nº 01/2005, conforme alterado pela Deliberação nº 27/2023.'
  },

  // ---------------- PROGRAMAS E SISTEMAS FEDERAIS OPERACIONAIS ----------------
  {
    titulo: 'Censo Escolar 2026 — Sistema Educacenso',
    esfera: 'Federal',
    tipo: 'Documento interno',
    numero_ato: '—',
    data_publicacao: null,
    tema: 'Censo e dados',
    resumo:
      'Pesquisa estatística obrigatória do INEP. 1ª etapa (Matrícula Inicial): data de referência 27/05/2026, coleta até 31/07/2026. 2ª etapa (Situação do Aluno): 01/02 a 12/03/2027. Atenção especial aos vínculos de AEE — alunos com apenas um vínculo podem ser desconsiderados, prejudicando repasse de recursos.'
  },
  {
    titulo: 'Programa Escola e Comunidade (Proec)',
    esfera: 'Federal',
    tipo: 'Documento interno',
    numero_ato: 'MEC/FNDE — lançado em abril/2024',
    data_publicacao: '2024-04-01',
    tema: 'Financiamento e projetos',
    resumo:
      'Apoia técnica e financeiramente projetos de formação (educação integral, cidadania, cultura de paz). Adesão da rede via PAR/Simec; envio de Projetos de Formação pela escola via PDDE Interativo. É preciso clicar em "Enviar Projeto de Formação para o MEC" — salvar sozinho não conclui a candidatura.'
  },
  {
    titulo: 'Avaliações CAEd/UFJF — Plataforma PARC',
    esfera: 'Municipal',
    tipo: 'Documento interno',
    numero_ato: '—',
    data_publicacao: null,
    tema: 'Avaliação e monitoramento',
    resumo:
      'Avaliações de fluência, formativas e somativas aplicadas em parceria com a SME. Gestores cadastram turmas, acompanham o "Perfil de Leitor" dos alunos e acessam itinerários formativos com certificação. Datas específicas divulgadas por portaria/Diário Oficial de Duque de Caxias.'
  }
]

export const ESFERAS = ['Federal', 'Estadual', 'Municipal', 'CME/DC', 'Interno']
export const TIPOS = ['Lei', 'Decreto', 'Resolução', 'Deliberação', 'Portaria', 'Ofício', 'Documento interno']
