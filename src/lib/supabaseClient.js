import { createClient } from '@supabase/supabase-js'

// As duas variáveis abaixo devem ser configuradas no arquivo .env (local)
// e nas Environment Variables do projeto na Vercel:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
// Nunca coloque a service_role key no frontend — apenas a anon/public key.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabaseClient] Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não encontradas. A aplicação vai rodar em modo de exemplo (dados locais) até que o .env seja configurado.'
  )
}

// IMPORTANTE: createClient lança erro e derruba a aplicação inteira se receber
// valores vazios/undefined. Por isso usamos um placeholder válido como formato
// quando as variáveis reais não existem — as chamadas de rede vão falhar (como
// esperado) e cada módulo já trata esse erro caindo para os dados de exemplo,
// em vez de a tela inteira quebrar antes mesmo de renderizar.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
