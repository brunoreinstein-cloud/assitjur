import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions } from '@/middleware/cors';

const maintenance =
  process.env.MAINTENANCE === 'true' || process.env.NEXT_PUBLIC_MAINTENANCE === 'true';
const retryAfter = process.env.RETRY_AFTER || '3600';

export async function GET(request: NextRequest) {
  try {
    const headers = corsHeaders(request);
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
        { status: 503, headers: { ...headers, 'Retry-After': retryAfter } }
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
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const res = handleOptions(request);
  return res ?? NextResponse.json({}, { status: 200, headers: corsHeaders(request) });
}
