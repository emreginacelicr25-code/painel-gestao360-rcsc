-- ============================================================
-- PAINEL DE GESTÃO — E.M. REGINA CELI DA SILVA CERDEIRA
-- Schema Supabase — Etapa 1
-- ============================================================
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- As tabelas marcadas [ETAPA FUTURA] já estão aqui para não
-- precisarmos migrar depois — serão usadas pelos módulos das
-- próximas etapas (Busca Ativa, Projetos, Equipe, Legislação).
-- ============================================================

-- ---------- MÓDULO 1: CRESCENTE (tarefas / agenda de gestão) ----------
create table if not exists crescente_tarefas (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('Pedagógica','Educacional','Administrativa','Inclusão / AEE','Evento')),
  descricao text not null,
  aluno_turma text,
  responsavel text,
  prazo date,
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','escalada')),
  encaminhamento_externo text default '—' check (encaminhamento_externo in ('—','CT','DAIE','CRAS','SME','COTRAN','DAISE')),
  observacoes text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists idx_crescente_categoria on crescente_tarefas (categoria);
create index if not exists idx_crescente_status on crescente_tarefas (status);

-- ---------- MÓDULO 2 [ETAPA FUTURA]: BUSCA ATIVA ----------
create table if not exists busca_ativa_casos (
  id uuid primary key default gen_random_uuid(),
  nome_aluno text not null,
  turma text not null,
  data_primeira_falta date,
  faltas_acumuladas integer default 0,
  contato_whatsapp_data date,
  contato_whatsapp_resultado text check (contato_whatsapp_resultado in ('respondeu','nao_respondeu','numero_invalido')),
  convocatoria_formal_data date,
  convocatoria_formal_meio text check (convocatoria_formal_meio in ('whatsapp','impresso','entregue')),
  visita_domiciliar_data date,
  visita_domiciliar_relato text,
  conselho_tutelar_protocolo text,
  conselho_tutelar_data date,
  retorno_data date,
  retorno_observacoes text,
  status text default 'ativo' check (status in ('ativo','em_busca','transferido','evadido','aguardando_ct','retornou')),
  etapa_atual integer default 1 check (etapa_atual between 1 and 5),
  criado_em timestamptz default now()
);

-- ---------- MÓDULO 3 [ETAPA FUTURA]: PROJETOS & AÇÕES ----------
create table if not exists projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  bimestre text check (bimestre in ('1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre')),
  eixo text check (eixo in ('Pedagógico','Inclusão','Administrativo','Proteção','Evento')),
  descricao text,
  responsavel_geral text,
  status text default 'planejado' check (status in ('planejado','em_andamento','concluido')),
  criado_em timestamptz default now()
);

create table if not exists projeto_etapas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  descricao text not null,
  responsavel text,
  prazo date,
  status text default 'aberta' check (status in ('aberta','em_andamento','concluida','escalada')),
  ordem integer default 0
);

-- ---------- MÓDULO 4 [ETAPA FUTURA]: EQUIPE / FUNCIONÁRIOS ----------
create table if not exists funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  funcao text not null,
  regime_dias text,
  atribuicao_central text,
  foto_url text,
  telefone text,
  email text,
  documentos_url text, -- link para pasta no Drive/Supabase Storage
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------- MÓDULO 5 [ETAPA FUTURA]: LEGISLAÇÃO & DOCUMENTOS ----------
create table if not exists legislacao_documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  esfera text check (esfera in ('Federal','Estadual','Municipal','CME/DC','Interno')),
  tipo text check (tipo in ('Lei','Decreto','Resolução','Deliberação','Portaria','Ofício','Documento interno')),
  numero_ato text,
  data_publicacao date,
  resumo text,
  tema text, -- ex: matrícula, inclusão, gestão democrática, transporte
  arquivo_url text, -- Supabase Storage
  link_externo text,
  criado_em timestamptz default now()
);

create index if not exists idx_legislacao_tema on legislacao_documentos (tema);
create index if not exists idx_legislacao_esfera on legislacao_documentos (esfera);

-- ---------- MÓDULO 6 [ETAPA FUTURA]: INDICADORES ----------
create table if not exists indicadores_bimestrais (
  id uuid primary key default gen_random_uuid(),
  bimestre text not null,
  indicador text not null,
  meta text,
  valor_apurado text,
  observacao text,
  atualizado_em timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Padrão adotado nas outras plataformas: acesso via senha
-- compartilhada no frontend (não é autenticação por usuário).
-- Aqui deixamos RLS habilitado e liberado para a chave anon,
-- já que o controle de acesso acontece na camada da aplicação
-- (tela de senha), igual ao central-gestao e ao painel-recepcao.
-- ============================================================
alter table crescente_tarefas enable row level security;
alter table busca_ativa_casos enable row level security;
alter table projetos enable row level security;
alter table projeto_etapas enable row level security;
alter table funcionarios enable row level security;
alter table legislacao_documentos enable row level security;
alter table indicadores_bimestrais enable row level security;

create policy "acesso_total_anon" on crescente_tarefas for all using (true) with check (true);
create policy "acesso_total_anon" on busca_ativa_casos for all using (true) with check (true);
create policy "acesso_total_anon" on projetos for all using (true) with check (true);
create policy "acesso_total_anon" on projeto_etapas for all using (true) with check (true);
create policy "acesso_total_anon" on funcionarios for all using (true) with check (true);
create policy "acesso_total_anon" on legislacao_documentos for all using (true) with check (true);
create policy "acesso_total_anon" on indicadores_bimestrais for all using (true) with check (true);
