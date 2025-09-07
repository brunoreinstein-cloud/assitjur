import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!

let client: SupabaseClient<Database>

export function getSupabaseClient() {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  }
  return client
}

export const supabase = getSupabaseClient()

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function ensureSessionOrThrow() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    throw new Error('Sessão não encontrada. Faça login.')
  }
  return session
}

export function getProjectRef(): string {
  const match = /https:\/\/([^.]+)\.supabase\.co/.exec(SUPABASE_URL)
  return match ? match[1] : ''
}
