# Como publicar — painel-gestao-rcsc

Mesmo fluxo que você já usa nos outros projetos (rcsc-triagem, transporte-escolar etc.).

## 1. Supabase

1. No seu projeto Supabase (pode ser o mesmo já usado pelos outros painéis, ou um novo), abra o **SQL Editor**.
2. Cole e execute o conteúdo de `supabase/schema.sql`.
3. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `VITE_SUPABASE_URL`
   - `anon public key` → vai virar `VITE_SUPABASE_ANON_KEY`

## 2. GitHub

1. Crie o repositório `painel-gestao-rcsc` em `emreginacelicr25-code` (mesma organização dos outros).
2. Suba todos os arquivos desta pasta.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env` localmente e preencha com os valores do Supabase.
Nunca suba o `.env` para o GitHub (já está previsto no `.gitignore`).

## 4. Vercel

1. Importe o repositório `painel-gestao-rcsc` na Vercel.
2. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Build command: `npm run build` — Output directory: `dist` (padrão do Vite, detectado automaticamente).
4. Deploy.

## 5. Rodando localmente antes de publicar

```
npm install
npm run dev
```

Sem o `.env` preenchido, o Crescente funciona com dados de exemplo (aviso amarelo aparece na tela),
então dá pra revisar o visual antes de conectar o banco de verdade.
