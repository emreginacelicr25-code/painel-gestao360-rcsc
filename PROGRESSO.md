# Progresso da construção — Painel de Gestão RCSC

Documento vivo para continuarmos a construção em etapas sem perder nada do que já foi decidido.

## Identidade visual definida (não mudar sem necessidade)

- **Paleta:** night `#1B2340` (base institucional), moon `#D4AF6A` (destaque/dourado luar),
  sage `#4E7C6F` (positivo/inclusão), signal `#C15B4A` (alerta/escalado), paper `#F7F6F3` (fundo).
- **Tipografia:** Fraunces (display/títulos), Public Sans (corpo/UI), IBM Plex Mono (dados, datas, protocolos).
- **Elemento de assinatura:** `MoonStatus` — status de tarefas/casos representado como fase da lua
  (nova → crescente → cheia → eclipse/escalada), em referência direta ao "Crescente" (documento de
  tarefas da escola) e ao Grupo Luar Sem Limites. Está em `src/components/MoonStatus.jsx` — reutilizar
  em todos os módulos futuros para manter coerência.
- **Layout:** sidebar fixa escura (`Sidebar.jsx`) + conteúdo em cards claros com `rounded-card` (14px).

## ✅ Já construído (Etapa 1)

1. **Scaffold completo do projeto** (Vite + React + Tailwind + Supabase JS + React Router).
2. **Sidebar de navegação** com os 8 módulos planejados.
3. **Painel Geral (dashboard)** — indicadores do Plano de Ação, próximos marcos do calendário,
   resumo da equipe gestora.
4. **Módulo Crescente** (100% funcional) — CRUD completo de tarefas:
   - Categorias: Pedagógica / Educacional / Administrativa / Inclusão-AEE / Evento
   - Campos: descrição, aluno/turma, responsável, prazo, status (fase da lua), encaminhamento
     externo (CT/DAIE/CRAS/SME/COTRAN/DAISE), observações
   - Filtro por categoria, criação via modal, avanço de status com um clique
   - Fallback com dados de exemplo quando o Supabase ainda não está conectado
5. **Schema SQL completo** (`supabase/schema.sql`) — já inclui as tabelas de TODOS os módulos
   futuros (busca_ativa_casos, projetos, projeto_etapas, funcionarios, legislacao_documentos,
   indicadores_bimestrais), para não precisarmos migrar depois. RLS habilitado com policy de
   acesso liberado à chave anon (mesmo padrão do central-gestao/painel-recepcao — controle de
   acesso feito por senha na aplicação, não por login de usuário).
6. **Documentação de deploy** (`docs/DEPLOY.md`) seguindo exatamente o fluxo GitHub → Supabase → Vercel
   já usado nos outros projetos.

## 🔜 Próximas etapas (nesta ordem sugerida)

### Etapa 2 — Busca Ativa Escolar
- Kanban com as 5 etapas do fluxo (Identificação → WhatsApp → Convocatória formal →
  Mobilização comunitária → Conselho Tutelar), usando a tabela `busca_ativa_casos` já criada.
- Cards por aluno com contador de dias, indicador visual de urgência (vincula ao `signal` color
  quando ultrapassar 10 dias sem retorno, conforme Art. 48 da Resolução 003/2025 — 30 faltas
  consecutivas = "abandono").
- Botão de gerar mensagem padrão de WhatsApp (modelo já definido no Plano de Ação).
- Indicadores: taxa de resposta ao 1º contato (meta ≥70%), casos abertos há mais de 30 dias (meta zero).

### Etapa 3 — Legislação & Documentos (aba de consulta)
- Popular `legislacao_documentos` com todo o mapeamento já feito:
  - Federal: CF/88 art. 205, LDB 9.394/96, ECA 8.069/90, BNCC, PNE 13.005/2014
  - Municipal: Lei 2.864/2017 (gestão democrática), Lei 2.713/2015 (PME), Lei 3.170/2021
    (Fundo Municipal de Educação), Resolução 003/2025-SME (matrícula 2026, com anexo do
    calendário completo — já temos o texto integral extraído do PDF)
  - CME/DC: Deliberações 01/2005, 08/2006, 29/2024, 24/2021 (busca ativa/infrequência),
    16/2016 (educação especial), 19/2019 (EJA)
- Upload dos PDFs originais para Supabase Storage (o texto já está todo extraído nos documentos
  que você enviou — dá pra fazer isso diretamente).
- Busca por tema/esfera/tipo, reaproveitando o padrão `?consulta=1` do central-documentos-rcsc.
- Considerar também os conteúdos federais avulsos já levantados: Censo Escolar/Educacenso
  (datas 2026), Programa Escola e Comunidade/PROEC (fluxo PDDE Interativo), avaliações CAEd/PARC.

### Etapa 4 — Projetos & Ações
- Timeline bimestral usando `projetos` + `projeto_etapas`, pré-populada com todo o calendário
  do Plano de Ação 2026: Gincana Inclusiva, PROEC/Floresta da Tijuca, Semana da Ed. Infantil,
  Semana da Pessoa com Deficiência, Olimpíadas da Inclusão, Festa da Alegria, Aniversário da
  Escola, Encerramento de Fim de Ano — cada um já tem "Ações Previstas" detalhadas no documento
  fonte, prontas para virar checklist.

### Etapa 5 — Equipe (funcionários)
- Grid de cards com foto (`funcionarios.foto_url`, Supabase Storage), função, regime de dias,
  atribuição central — dados já mapeados: Liliam, Elaine, José Jorge, Maria Lúcia, agentes de
  apoio (Jeovanna/Mariana/Rose/Yanca), professores AEE (Hilda/Bianca/Daniela).
- Perfil individual ao clicar: histórico de atribuições + link para documentos.
- **Pendência a confirmar com Mário:** fotos dos funcionários precisam ser enviadas (upload) —
  não existem nos documentos fonte.

### Etapa 6 — Indicadores (dashboard completo)
- Todos os indicadores da seção 9.2 do Plano de Ação, com gráficos de evolução por bimestre
  (usar `chart_display` ou Recharts dentro do React).

### Etapa 7 — Integrações com outras plataformas
- Links diretos + preview de dados-chave do `rcsc-triagem`, `transporte-escolar`,
  `plataforma-inclusao-rcsc` e `central-documentos-rcsc`.
- **Pendência a confirmar com Mário:** para puxar dados reais (não só links), precisamos das
  URLs/Supabase de cada uma dessas plataformas — se forem o mesmo projeto Supabase, é só
  apontar para as tabelas existentes; se forem projetos separados, precisamos das credenciais
  de leitura de cada um.

## Decisões em aberto para confirmar com Mário

1. Login único por senha (como `central-gestao`/`painel-recepcao`) ou temos conta por membro
   da equipe (Liliam, Elaine, José Jorge, Maria Lúcia) com permissões diferentes?
2. As outras plataformas (triagem, transporte, inclusão, documentos) usam o **mesmo** projeto
   Supabase ou projetos separados? Isso muda como a aba "Integrações" vai funcionar.
3. Fotos da equipe: enviar arquivos ou preencher depois direto na interface?
