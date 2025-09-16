import { supabase, ensureSessionOrThrow } from '@/lib/supabaseClient'

export interface TestemunhaPublica {
  id: number
  processo_id: number
  nome: string | null
  email: string | null
  risco_sensibilidade: string | null
}

export interface ExplorarResponse {
  data: TestemunhaPublica[]
  total: number
  error?: string
}

export async function explorarTestemunhas(page = 1, pageSize = 10): Promise<ExplorarResponse> {
  await ensureSessionOrThrow()

  // TODO: Esta função precisa ser atualizada com a view/tabela correta
  // A view 'vw_testemunhas_publicas' não existe no banco atual
  console.warn('explorarTestemunhas: função temporariamente desabilitada - view não existe')
  
  return { 
    data: [], 
    total: 0, 
    error: 'Função temporariamente indisponível - estrutura do banco sendo atualizada' 
  }

  /*
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count, status } = await supabase
    .from('vw_testemunhas_publicas')
    .select('id, processo_id, nome, email, risco_sensibilidade', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) {
    if (status === 401) {
      return { data: [], total: 0, error: 'Sessão inválida. Faça login.' }
    }
    if (status === 403) {
      return { data: [], total: 0, error: 'Acesso negado pelas políticas de segurança.' }
    }
    throw error
  }

  return { data: data ?? [], total: count ?? 0 }
  */
}
