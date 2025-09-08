import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export const SUPABASE_URL = 'https://fgjypmlszuzkgvhuszxn.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU'

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
