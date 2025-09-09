/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { createClient, Session } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const TEST_EMAIL = process.env.SUPABASE_TEST_EMAIL
const TEST_PASSWORD = process.env.SUPABASE_TEST_PASSWORD

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getSession(): Promise<Session> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('Missing SUPABASE_TEST_EMAIL or SUPABASE_TEST_PASSWORD')
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (error || !data.session) throw error ?? new Error('No session')
  return data.session
}

describe('Supabase integration', () => {
  it('queries tables and invokes edge function', async () => {
    const session = await getSession()
    console.log('session acquired')

    const { data: processos, error: procError } = await supabase
      .from('processos')
      .select('id, org_id')
      .range(0, 9)
    expect(procError).toBeNull()
    console.log('processos', processos)

    const { data: testemunhas, error: testError } = await supabase
      .from('vw_testemunhas_publicas')
      .select('id, processo_id, nome, email')
      .range(0, 9)
    expect(testError).toBeNull()
    console.log('vw_testemunhas_publicas', testemunhas)

    const projectRef = /https:\/\/([^.]+)\.supabase\.co/.exec(SUPABASE_URL)?.[1]
    if (!projectRef) throw new Error('Invalid SUPABASE_URL')
    const fnUrl = `https://${projectRef}.functions.supabase.co/assistjur-processos`

    const response = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': crypto.randomUUID(),
      },
      body: JSON.stringify({ limit: 1 }),
    })

    console.log('edge function status', response.status)
    expect(response.status).toBe(200)
    const body = await response.json()
    console.log('edge function body', body)
  })
})
