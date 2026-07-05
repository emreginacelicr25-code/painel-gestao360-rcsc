// Base semente de Projetos & Ações — extraída do Plano de Ação Anual 2026.
// Cada projeto já vem com suas etapas reais, retiradas das tabelas de
// "Ações Previstas" e do calendário bimestral do documento fonte.

export const PROJETOS_SEED = [
  // ---------------- 1º BIMESTRE ----------------
  {
    titulo: 'Acolhida Especial e organização do ano letivo',
    bimestre: '1º Bimestre',
    eixo: 'Pedagógico',
    responsavel_geral: 'Direção + OP Liliam',
    descricao:
      'Abertura do ano: recepção de alunos novos com protocolo de adaptação gradual, organização de turmas e diagnóstico inicial.',
    etapas: [
      { descricao: 'Recepção dos alunos novos — Acolhida Especial EI', responsavel: 'Direção + OP + Professores' },
      { descricao: 'Levantamento de matrículas e organização das turmas (conferência e-Duque/INEP)', responsavel: 'Secretaria + Direção' },
      { descricao: '1ª Reunião de Planejamento — definição de metas e projetos do ano', responsavel: 'OP Liliam + Direção' },
      { descricao: 'Diagnóstico inicial — sondagens de leitura e escrita (Ciclo de Alfabetização)', responsavel: 'Professores + OP' },
      { descricao: 'Levantamento de alunos com necessidades específicas — identificar PEIs a elaborar/revisar', responsavel: 'OP + Prof. AEE + Psicólogo' }
    ]
  },
  {
    titulo: 'Projeto Pedagógico 2026 — elaboração e entrega ao DAISE',
    bimestre: '1º Bimestre',
    eixo: 'Administrativo',
    responsavel_geral: 'Direção + OP',
    descricao: 'Finalização e protocolo do Projeto Pedagógico 2026 dentro do prazo de 31/03.',
    etapas: [
      { descricao: 'Elaboração/revisão do Projeto Pedagógico 2026', responsavel: 'Direção + OP', prazo: '2026-03-31' },
      { descricao: 'Entrega e protocolo no DAISE', responsavel: 'Direção', prazo: '2026-03-31' }
    ]
  },
  {
    titulo: 'Constituição do Grupo de Busca Ativa',
    bimestre: '1º Bimestre',
    eixo: 'Proteção',
    responsavel_geral: 'OE Elaine + Direção + Secretaria',
    descricao: 'Ativação da planilha de Busca Ativa por turma e primeiro monitoramento do ano.',
    etapas: [
      { descricao: 'Constituir Grupo de Busca Ativa e ativar planilha por turma', responsavel: 'OE Elaine + Direção' },
      { descricao: 'Mapeamento de alunos em situação de vulnerabilidade', responsavel: 'OE + Psicólogo' },
      { descricao: 'Sensibilização da equipe docente sobre protocolo de proteção infantil', responsavel: 'Direção + Psicólogo' }
    ]
  },
  {
    titulo: 'Conselho de Classe e Reunião de Responsáveis — 1º Bimestre',
    bimestre: '1º Bimestre',
    eixo: 'Pedagógico',
    responsavel_geral: 'Direção + OP + Professores',
    descricao: 'Fechamento do bimestre com análise pedagógica e visita da Supervisão Escolar.',
    etapas: [
      { descricao: 'Conselho de Classe — atas assinadas, análise do e-Duque, devolutiva', responsavel: 'Direção + OP + Professores' },
      { descricao: 'Reunião de Responsáveis — diagnóstico, metas, inclusão, frequência', responsavel: 'Equipe Diretiva + Pedagógica' },
      { descricao: 'Visita da Supervisão Escolar (Quézia Ribeiro Almeida)', responsavel: 'Direção + OP + Secretaria' }
    ]
  },

  // ---------------- 2º BIMESTRE ----------------
  {
    titulo: 'Gincana Inclusiva 2026',
    bimestre: '2º Bimestre',
    eixo: 'Inclusão',
    responsavel_geral: 'OP + Professores + Direção',
    descricao: 'Projeto anual temático (90 Anos de Maurício de Sousa) com fases coletivas, provas e encerramento.',
    etapas: [
      { descricao: 'Fase 2 — Atividades Coletivas', responsavel: 'OP + Professores' },
      { descricao: 'Dia D — Fase 3: Provas e Encerramento, sorteio do cestão', responsavel: 'OP + Professores + Direção', prazo: '2026-06-03' }
    ]
  },
  {
    titulo: 'Culminância PROEC — Visita à Floresta da Tijuca',
    bimestre: '2º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Direção + OP',
    descricao: 'Passeio para a equipe vencedora da Gincana, custeado pelo Programa Escola e Comunidade.',
    etapas: [{ descricao: 'Organizar logística e custeio via PROEC', responsavel: 'Direção + OP', prazo: '2026-06-30' }]
  },
  {
    titulo: 'Arraiá do Regina — Festa Julina',
    bimestre: '2º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Toda a comunidade escolar',
    descricao: 'Principal evento comunitário do bimestre.',
    etapas: [{ descricao: 'Realização do Arraiá do Regina', responsavel: 'Toda a comunidade escolar', prazo: '2026-07-18' }]
  },
  {
    titulo: 'Reuniões de Responsáveis e AEE — 2º Bimestre',
    bimestre: '2º Bimestre',
    eixo: 'Pedagógico',
    responsavel_geral: 'Equipe Diretiva + Pedagógica',
    descricao: 'Acolhida no auditório seguida de reunião por turma, e reunião específica de AEE/Sala de Recursos.',
    etapas: [
      { descricao: 'Reuniões de Responsáveis — todas as turmas', responsavel: 'Equipe Diretiva + Pedagógica', prazo: '2026-05-22' },
      { descricao: 'Reunião de Responsáveis — AEE (Sala de Recursos)', responsavel: 'Prof. AEE + OP', prazo: '2026-05-30' }
    ]
  },

  // ---------------- 3º BIMESTRE ----------------
  {
    titulo: 'Semana da Educação Infantil',
    bimestre: '3º Bimestre',
    eixo: 'Pedagógico',
    responsavel_geral: 'Professoras EI + OP + Direção',
    descricao:
      'Celebração do universo da infância — brincadeiras, arte, movimento e protagonismo das crianças pequenas (turmas 41, 42, 51, 52).',
    etapas: [
      { descricao: 'Abertura temática — ambiente imersivo', responsavel: 'Professoras EI + equipe' },
      { descricao: 'Circuito de Brincadeiras — estações tradicionais, motoras e sensoriais', responsavel: 'Prof. EI + Prof. Ed. Física' },
      { descricao: 'Mostra de Produções — portfólios e registros do 1º/2º bimestres', responsavel: 'Professoras EI' },
      { descricao: 'Momento com as Famílias — tarde aberta', responsavel: 'OP + Professoras EI' },
      { descricao: 'Roda de Histórias com recursos visuais', responsavel: 'Dinamizador de Leitura / OP' },
      { descricao: 'Registro documental (fotos, vídeos, portfólio)', responsavel: 'OP + Professoras' }
    ]
  },
  {
    titulo: 'Semana da Pessoa com Deficiência Intelectual e Múltipla',
    bimestre: '3º Bimestre',
    eixo: 'Inclusão',
    responsavel_geral: 'Prof. AEE + CE + OP + Psicólogo + OE',
    descricao: 'Sensibilização da comunidade escolar sobre direitos, potencialidades e pertencimento.',
    etapas: [
      { descricao: 'Abertura com palestra / roda de conversa sobre DI/DMúltipla', responsavel: 'OP + Psicólogo + Direção' },
      { descricao: 'Mostra das Classes Especiais (CE1, CE3, CE5, CE6, CE7)', responsavel: 'Professores CE + Prof. AEE' },
      { descricao: 'Atividades integradas entre CE/AEE e turmas regulares', responsavel: 'Prof. CE + Prof. Regentes + OP' },
      { descricao: 'Roda com as famílias — escuta ativa', responsavel: 'OE Elaine + Psicólogo' },
      { descricao: 'Painel colaborativo "Somos Todos Iguais nas Diferenças"', responsavel: 'Professores + alunos' },
      { descricao: 'Distribuição do Protocolo de Segurança e Bem-Estar Escolar', responsavel: 'Secretaria + Professores' }
    ]
  },
  {
    titulo: 'Olimpíadas da Inclusão',
    bimestre: '3º Bimestre',
    eixo: 'Inclusão',
    responsavel_geral: 'Direção + OP + Prof. Ed. Física + Prof. AEE + CE',
    descricao: 'Evento esportivo e lúdico com participação de todas as turmas, incluindo CE e AEE.',
    etapas: [
      { descricao: 'Circuito Motor — equilíbrio, coordenação e agilidade', responsavel: 'Todas as turmas' },
      { descricao: 'Corrida da Amizade — duplas mistas EF regular + CE/AEE', responsavel: 'EF + CE + AEE' },
      { descricao: 'Jogo de Alvo — adaptação de distância e tamanho', responsavel: 'Todas as turmas' },
      { descricao: 'Dança das Cadeiras Inclusiva', responsavel: 'EI + 1º e 2º anos' },
      { descricao: 'Revezamento Cooperativo — pontuação por equipe', responsavel: '3º, 4º e 5º anos + CE' },
      { descricao: 'Celebração final — medalhas/diplomas para todos', responsavel: 'Todos' }
    ]
  },

  // ---------------- 4º BIMESTRE ----------------
  {
    titulo: 'Festa da Alegria — Dia das Crianças',
    bimestre: '4º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Equipe Diretiva + Pedagógica + Professores',
    descricao: 'Evento lúdico, inclusivo e alegre para todos os alunos, com acessibilidade garantida.',
    etapas: [
      { descricao: 'Palco central — apresentações de dança, teatro, música, quadrilha temática', responsavel: 'Professores de Arte e Ed. Física' },
      { descricao: 'Estações de Arte — pintura, argila, colagem', responsavel: 'Professores de Arte + Prof. EI' },
      { descricao: 'Estação de Brincadeiras — circuito tradicional e adaptado', responsavel: 'Prof. Ed. Física + Prof. CE/AEE' },
      { descricao: 'Cantinho da Leitura e Contação', responsavel: 'Dinamizador de Leitura / OP' },
      { descricao: 'Estação Sensorial — materiais e espaço calmo', responsavel: 'Prof. AEE + Psicólogo' },
      { descricao: 'Alimentação — lanche coletivo saudável', responsavel: 'Secretaria + famílias voluntárias' }
    ]
  },
  {
    titulo: 'Dia do Professor e do Funcionário Público',
    bimestre: '4º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Direção + OP',
    descricao: 'Homenagens à equipe docente (15/10) e à equipe de apoio/secretaria (28/10).',
    etapas: [
      { descricao: 'Celebração interna com toda a equipe docente', responsavel: 'Direção + OP', prazo: '2026-10-15' },
      { descricao: 'Homenagem à equipe de secretaria, ASGs e agentes de apoio', responsavel: 'Direção', prazo: '2026-10-28' }
    ]
  },
  {
    titulo: 'Aniversário da Escola',
    bimestre: '4º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Toda a equipe + famílias + comunidade',
    descricao: 'Festa comunitária celebrando a história da E.M. Regina Celi da Silva Cerdeira.',
    etapas: [
      { descricao: 'Exposição fotográfica da história da escola', responsavel: 'Direção + OP' },
      { descricao: 'Apresentações das turmas — dança, teatro, música, poesia', responsavel: 'Professores regentes' },
      { descricao: 'Painel colaborativo "Quem faz a Regina Celi"', responsavel: 'Toda a comunidade' }
    ]
  },
  {
    titulo: 'Encerramento de Fim de Ano',
    bimestre: '4º Bimestre',
    eixo: 'Evento',
    responsavel_geral: 'Direção + toda a equipe',
    descricao: 'Cerimônia de encerramento com formaturas simbólicas da EI 5 anos e do 5º ano.',
    etapas: [
      { descricao: 'Abertura — retrospectiva do ano em imagens', responsavel: 'Direção + OP' },
      { descricao: 'Homenagens a alunos e professores destaques', responsavel: 'Direção' },
      { descricao: 'Apresentações culturais por turma', responsavel: 'Professores regentes' },
      { descricao: 'Formatura EI 5 anos e Formatura 5º ano', responsavel: 'Prof. EI + Prof. 5º anos + Direção + OP' }
    ]
  },
  {
    titulo: 'Conselho de Classe Final e Escrituração',
    bimestre: '4º Bimestre',
    eixo: 'Administrativo',
    responsavel_geral: 'Direção + OP + Secretaria',
    descricao: 'Deliberações finais de promoção/retenção e fechamento da escrituração escolar do ano.',
    etapas: [
      { descricao: 'Conselho de Classe Final — atas assinadas', responsavel: 'Direção + OP + Professores' },
      { descricao: 'Escrituração final — atas de resultados e históricos, entrega ao DAISE', responsavel: 'Secretaria + Direção' },
      { descricao: 'Avaliação do Plano de Ação Anual 2026', responsavel: 'Direção + OP + OE + Psicólogo' }
    ]
  }
]

export const EIXOS = ['Pedagógico', 'Inclusão', 'Administrativo', 'Proteção', 'Evento']
export const BIMESTRES = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre']
