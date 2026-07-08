// api/gerar-resposta.js
// Gera sugestões de resposta para mensagens recebidas na Central de Triagem,
// usando o Gemini (Google), com referência de tom/estilo dos modelos fixos
// da escola + respostas reais recentes, e distinguindo o destinatário:
// responsável do aluno, quem enviou a mensagem (equipe), ou ambos.

const MODELOS_REFERENCIA = [
  `📢 *Comunicado — Aula Passeio*

Prezados responsáveis da turma *[TURMA]*,

Informamos que realizaremos uma *aula passeio* no dia *[DATA]*, com saída prevista às *[HORÁRIO DE SAÍDA]* e retorno às *[HORÁRIO DE RETORNO]*.

📍 Destino: *[LOCAL]*
🎯 Objetivo pedagógico: *[OBJETIVO]*

Para a participação do(a) aluno(a) é necessário:
• Entregar a *autorização assinada* até o dia *[DATA LIMITE]*
• *[Outras orientações: roupa, lanche, valor se houver]*

Contamos com a participação de todos! 🙏`,

  `📢 *Comunicado — Intercorrência na Rotina Escolar*

Prezado(a) responsável por *[NOME DO ALUNO]*, turma *[TURMA]*,

Informamos que hoje, *[DATA]*, seu(sua) filho(a) apresentou *[DESCRIÇÃO]* durante a rotina escolar.

🕐 Horário: *[HORÁRIO]*
✅ Providências adotadas: *[O que foi feito pela escola]*

Pedimos que entre em contato com a escola pelo número *[TELEFONE]* ou compareça pessoalmente para mais informações.

Atenciosamente,
*Equipe Gestora — E.M. Regina Celi*`,

  `⚖️ *Comunicado Urgente — Suspensão de Aulas*

Prezados responsáveis,

Informamos que as aulas do dia *[DATA]* estão *suspensas* em razão de *[MOTIVO]*.

📅 As aulas serão retomadas em *[DATA DE RETORNO]*.

⚖️ *Em cumprimento à legislação vigente, toda aula suspensa deverá ser devidamente reposta em data a ser comunicada oportunamente, garantindo a carga horária mínima estabelecida.*

Lamentamos o transtorno e contamos com a compreensão de todos.

Atenciosamente,
*Direção — E.M. Regina Celi*`,

  `Olá, *[NOME DO RESPONSÁVEL]*! 👋

Recebemos sua mensagem e agradecemos por nos comunicar sobre a ausência de *[NOME DO ALUNO]*.

📋 *Registro realizado.* A justificativa foi anotada em nossos registros.

⚠️ *Atenção importante:* conforme a legislação educacional vigente (LDB — Lei nº 9.394/96), a falta, *ainda que justificada*, é computada no total de ausências do ano letivo.

📊 Lembramos que o aluno pode ter, no máximo, *25% de faltas* do total de dias letivos.

Qualquer dúvida, estamos à disposição!

Atenciosamente,
*E.M. Regina Celi da Silva Cerdeira*`,

  `Olá, *[NOME DA PROFESSORA/PROFESSOR]*! 😊

Recebemos seu registro referente a *[TURMA / ALUNO / SITUAÇÃO]*, e agradecemos pelo cuidado em comunicar a ocorrência.

📋 Para garantir a *qualidade, segurança e clareza* do registro, percebemos que algumas informações precisam ser complementadas:
• *[Especificar o que está faltando]*

✍️ Pedimos gentilmente que complemente o registro respondendo a esta mensagem.

Um registro bem detalhado protege tanto o aluno quanto o profissional. 💚

Agradecemos sua colaboração!

*Equipe Gestora — E.M. Regina Celi da Silva Cerdeira*`,

  `📢 *Comunicado — Pendência de Transferência Escolar*

Prezado(a) responsável por *[NOME DO ALUNO]*,

A Equipe Diretiva informa que, conforme identificado, o(a) aluno(a) está matriculado(a) em outra unidade escolar. No entanto, *não consta em nossos registros* o comparecimento do responsável para a formalização do encerramento da matrícula.

⚠️ *Implicações:* a ausência desse procedimento gera conflito de matrícula no Censo Escolar (MEC).

📜 *Base Legal:* LDB (Lei nº 9.394/96); Resoluções do CNE/CEE.

📍 Solicitamos o *comparecimento imediato* à secretaria: Segunda a sexta-feira · 9h às 16h.

Atenciosamente,
*Equipe Diretiva — E.M. Regina Celi da Silva Cerdeira*`,

  `Olá, famílias! 👋

Passamos aqui para reforçar uma informação importante sobre a nossa rotina escolar:

✅ *As aulas acontecem normalmente todos os dias*, conforme o calendário letivo.

📢 Caso haja qualquer alteração, a escola *enviará um aviso com antecedência* por este canal.

Portanto, *se não houver comunicado, pode tranquilamente enviar seu filho(a)*! 😊

Contamos com a confiança e parceria de vocês.

Atenciosamente,
*E.M. Regina Celi da Silva Cerdeira*`
]

function montarInstrucaoDestinatario(destinatario) {
  if (destinatario === 'equipe') {
    return `Gere exatamente 3 sugestões de resposta, todas endereçadas AO(À) PROFISSIONAL (ex: professora) que enviou o registro/mensagem — agradecendo, confirmando o recebimento e informando os encaminhamentos dados (ex: "a família será/foi comunicada"), quando aplicável. NÃO escreva mensagens para o responsável do aluno aqui.`
  }
  if (destinatario === 'ambos') {
    return `Gere exatamente 2 sugestões, cada uma para um destinatário diferente:
1. Uma mensagem PARA O(A) RESPONSÁVEL do aluno, dando ciência clara e acolhedora do que foi relatado pela equipe (o que aconteceu, quando, e o que a escola já fez, se souber).
2. Uma mensagem de resposta PARA O(A) PROFISSIONAL que enviou o registro (ex: professora), confirmando o recebimento e informando que a família foi/será comunicada.
Marque cada sugestão com o campo "destinatario" igual a "responsavel" ou "equipe", conforme o caso.`
  }
  return `Gere exatamente 3 sugestões de resposta, todas endereçadas AO(À) RESPONSÁVEL do aluno, dando ciência clara e acolhedora da situação relatada.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ erro: 'GEMINI_API_KEY não configurada no servidor' })
  }

  const { mensagem, categoria, urgencia, alunoNome, alunoTurma, remetente, destinatario } = req.body || {}

  if (!mensagem || !String(mensagem).trim()) {
    return res.status(400).json({ erro: 'Campo "mensagem" é obrigatório' })
  }

  const destinatarioNormalizado = ['responsavel', 'equipe', 'ambos'].includes(destinatario)
    ? destinatario
    : 'responsavel'

  let exemplosReais = []
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      const url = `${supabaseUrl}/rest/v1/mensagens_atendimento?select=resposta&resposta=not.is.null&order=criado_em.desc&limit=5`
      const resp = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      })
      if (resp.ok) {
        const dados = await resp.json()
        exemplosReais = (dados || [])
          .map((d) => d.resposta)
          .filter((r) => r && String(r).trim().length > 10)
          .slice(0, 5)
      }
    }
  } catch (e) {
    console.warn('[gerar-resposta] Falha ao buscar exemplos reais:', e.message)
  }

  const promptSistema = `Você é um assistente que ajuda a equipe da E.M. Regina Celi da Silva Cerdeira (escola pública municipal, Duque de Caxias/RJ, Centro de Referência em Educação Inclusiva) a redigir respostas para mensagens recebidas de responsáveis de alunos ou funcionários via WhatsApp.

Escreva no MESMO ESTILO dos exemplos abaixo: tom institucional, mas acolhedor; uso moderado de emojis (📢 ⚠️ ✅ 👋 💚 conforme o tom da mensagem); saudação nominal quando fizer sentido; fechamento com "Atenciosamente," seguido da assinatura apropriada (Direção / Secretaria / Equipe Gestora / Equipe Diretiva — E.M. Regina Celi, conforme o assunto). Cite legislação (LDB, ECA) apenas quando genuinamente relevante. Use *asteriscos* para negrito estilo WhatsApp.

A resposta deve ser ORIGINAL e ESPECÍFICA ao conteúdo da mensagem recebida — não repita um modelo genérico, adapte à situação real descrita.

=== EXEMPLOS DE ESTILO DA ESCOLA ===
${MODELOS_REFERENCIA.join('\n\n---\n\n')}
${exemplosReais.length > 0 ? `\n\n=== RESPOSTAS REAIS RECENTES (mesma escola) ===\n${exemplosReais.join('\n\n---\n\n')}` : ''}
=== FIM DOS EXEMPLOS ===

${montarInstrucaoDestinatario(destinatarioNormalizado)}

Responda SOMENTE em formato JSON válido, sem markdown, sem texto antes ou depois, no formato:
{"sugestoes": [{"destinatario": "responsavel", "texto": "..."}, {"destinatario": "equipe", "texto": "..."}]}
(o campo "destinatario" de cada item deve ser sempre "responsavel" ou "equipe", conforme para quem a mensagem se destina)`

  const promptUsuario = `Mensagem recebida:
Remetente: ${remetente || 'não informado'}
Categoria: ${categoria || 'não informada'}
Urgência: ${urgencia || 'não informada'}
Aluno: ${alunoNome || 'não informado'}
Turma: ${alunoTurma || 'não informada'}
Texto da mensagem: "${mensagem}"`

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    const resposta = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${promptSistema}\n\n${promptUsuario}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!resposta.ok) {
      const erroTexto = await resposta.text()
      console.error('[gerar-resposta] Erro da API Gemini:', erroTexto)
      return res.status(502).json({ erro: 'Falha ao consultar o Gemini' })
    }

    const dados = await resposta.json()
    const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textoGerado) {
      return res.status(502).json({ erro: 'Resposta vazia do Gemini' })
    }

    let parsed
    try {
      parsed = JSON.parse(textoGerado)
    } catch {
      return res.status(502).json({ erro: 'Resposta do Gemini em formato inesperado' })
    }

    return res.status(200).json({ sugestoes: parsed.sugestoes || [] })
  } catch (e) {
    console.error('[gerar-resposta] Erro inesperado:', e.message)
    return res.status(500).json({ erro: 'Erro interno ao gerar resposta' })
  }
      }
