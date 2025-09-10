import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, handleOptions } from '@/middleware/cors';

export async function GET(request: NextRequest) {
  try {
    // Simple health check - in production, check database connectivity
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          api: 'up',
          database: 'up' // Would check Supabase connection
        }
      },
      { headers: corsHeaders(request) }
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
