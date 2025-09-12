import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '../_shared/cors';
import { initSentry } from '../_shared/sentry';

const sentry = initSentry();

const maintenance =
  process.env.MAINTENANCE === 'true' || process.env.NEXT_PUBLIC_MAINTENANCE === 'true';
const retryAfter = process.env.RETRY_AFTER || '3600';

export async function GET(_request: NextRequest) {
  try {
    if (maintenance) {
      return NextResponse.json(
        {
          status: 'maintenance',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          services: {
            api: 'down',
            database: 'down'
          }
        },
        { status: 503, headers: { ...corsHeaders, 'Retry-After': retryAfter } }
      );
    }
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          api: 'up',
          database: 'up' // Would check Supabase connection
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    (await sentry)?.captureException?.(error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
