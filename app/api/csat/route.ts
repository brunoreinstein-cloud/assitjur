import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/integrations/supabase/client'
import { corsHeaders } from '../_shared/cors'
import { initSentry } from '../_shared/sentry'

const sentry = initSentry()

const maintenance =
  process.env.MAINTENANCE === 'true' || process.env.NEXT_PUBLIC_MAINTENANCE === 'true'
const retryAfter = process.env.RETRY_AFTER || '3600'

export async function POST(request: NextRequest) {
  const headers = { ...corsHeaders }
  if (maintenance) {
    return NextResponse.json(
      { error: 'Service under maintenance' },
      { status: 503, headers: { ...headers, 'Retry-After': retryAfter } }
    )
  }

  try {
    const { sessionId, score, comment } = await request.json()
    if (!sessionId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'sessionId and score are required' },
        { status: 400, headers }
      )
    }

    const { error } = await supabase.from('csat').insert({
      session_id: sessionId,
      score,
      comment,
    })

    if (error) throw error

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error('CSAT API Error:', error)
    ;(await sentry)?.captureException?.(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save CSAT' },
      { status: 500, headers }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

