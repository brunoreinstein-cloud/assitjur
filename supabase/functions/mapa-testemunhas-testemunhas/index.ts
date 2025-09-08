import { corsHeaders } from '../_shared/cors.ts';
import { mapaTestemunhasSchema, MapaResponseSchema } from '../_shared/mapa-contracts.ts';
import {
  validateJWT,
  createAuthenticatedClient,
  checkRateLimit,
  secureLog,
  withTimeout,
} from '../_shared/security.ts';

function createSecureErrorResponse(error: unknown, req: Request, expose: boolean): Response {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  secureLog('mapa-testemunhas-testemunhas error', { cid, error: String(error) });
  const message = expose && error instanceof Error ? error.message : 'Internal server error';
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders(req), 'x-correlation-id': cid },
  });
}

async function handler(req: Request): Promise<Response> {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const headers = { ...corsHeaders(req), 'x-correlation-id': cid };

  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || null;
    if (!validateJWT(token)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    const supabase = createAuthenticatedClient(token!);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    if (!checkRateLimit(`${user.id}:mapa-testemunhas`, 20, 60_000)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers,
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = mapaTestemunhasSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body';
      secureLog('mapa-testemunhas-testemunhas invalid body', { cid, message });
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers,
      });
    }

    const dto = parsed.data;
    secureLog('mapa-testemunhas-testemunhas fetch', { cid, dto });

    const mockData = [
      {
        nome: 'João Silva',
        qtd_testemunhos: 3,
        polo_ativo_autor: 1,
        polo_ativo_testemunha: 2,
        polo_passivo_reu: 0,
        polo_passivo_testemunha: 0,
        troca_favor: false,
        triangulacao: false,
        created_at: new Date().toISOString(),
      },
      {
        nome: 'Maria Santos',
        qtd_testemunhos: 5,
        polo_ativo_autor: 2,
        polo_ativo_testemunha: 3,
        polo_passivo_reu: 1,
        polo_passivo_testemunha: 1,
        troca_favor: true,
        triangulacao: false,
        created_at: new Date().toISOString(),
      },
    ];

    const startIndex = (dto.page - 1) * dto.limit;
    const paginatedData = mockData.slice(startIndex, startIndex + dto.limit);

    const result = {
      data: paginatedData,
      total: mockData.length,
    };

    const validation = MapaResponseSchema.safeParse(result);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid server response' }), {
        status: 500,
        headers,
      });
    }

    secureLog('mapa-testemunhas-testemunhas success', {
      cid,
      count: result.data.length,
    });

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    return createSecureErrorResponse(error, req, true);
  }
}

Deno.serve((req) => withTimeout(handler(req), 30_000));

