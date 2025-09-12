import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

interface CleanupRequest {
  orgId: string;
  operations: string[];
  preview?: boolean;
}

interface CleanupResponse {
  success: boolean;
  results: Array<{
    operation: string;
    success: boolean;
    count: number;
    message: string;
  }>;
  totalProcessed: number;
  error?: string;
}

serve('database-cleanup', async (req) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        results: [],
        totalProcessed: 0,
        error: 'Token de autorização não encontrado'
      }), {
        headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
        status: 401
      });
    }

    // Create user client for permission checks
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Create service role client for operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orgId, operations, preview = false }: CleanupRequest = await req.json();

    console.log(`Starting database cleanup for org ${orgId}`, { operations, preview });

    // Verificar se o usuário tem permissão (ADMIN na organização)
    const { data: userProfile, error: profileError } = await userSupabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', (await userSupabase.auth.getUser()).data?.user?.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({
        success: false,
        results: [],
        totalProcessed: 0,
        error: 'Erro ao verificar permissões do usuário'
      }), {
        headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
        status: 403
      });
    }

    if (userProfile.role !== 'ADMIN' || userProfile.organization_id !== orgId) {
      console.error('Access denied:', { userRole: userProfile.role, userOrg: userProfile.organization_id, requestedOrg: orgId });
      return new Response(JSON.stringify({
        success: false,
        results: [],
        totalProcessed: 0,
        error: 'Acesso negado. Apenas administradores podem executar esta operação.'
      }), {
        headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
        status: 403
      });
    }

    const results: CleanupResponse['results'] = [];
    let totalProcessed = 0;

    // Se é preview, apenas busca as informações
    if (preview) {
      const { data: previewData, error } = await serviceSupabase.rpc('rpc_get_cleanup_preview', {
        p_org_id: orgId
      });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        preview: previewData,
        message: 'Preview gerado com sucesso'
      }), {
        headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
        status: 200
      });
    }

    // Executa as operações solicitadas
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation) {
          case 'invalid_cnjs':
            result = await serviceSupabase.rpc('rpc_cleanup_invalid_cnjs', { p_org_id: orgId });
            break;
          case 'empty_fields':
            result = await serviceSupabase.rpc('rpc_cleanup_empty_required_fields', { p_org_id: orgId });
            break;
          case 'duplicates':
            result = await serviceSupabase.rpc('rpc_cleanup_duplicates', { p_org_id: orgId });
            break;
          case 'normalize_cnjs':
            result = await serviceSupabase.rpc('rpc_cleanup_normalize_cnjs', { p_org_id: orgId });
            break;
          case 'hard_delete_old':
            result = await serviceSupabase.rpc('rpc_cleanup_hard_delete_old', { p_org_id: orgId });
            break;
          default:
            throw new Error(`Operação desconhecida: ${operation}`);
        }

        if (result.error) throw result.error;

        const count = result.data?.deleted_count || result.data?.updated_count || 0;
        totalProcessed += count;

        results.push({
          operation,
          success: true,
          count,
          message: result.data?.message || 'Operação concluída'
        });

        console.log(`Operation ${operation} completed:`, result.data);
        
      } catch (opError) {
        console.error(`Error in operation ${operation}:`, opError);
        results.push({
          operation,
          success: false,
          count: 0,
          message: opError.message || 'Erro na operação'
        });
      }
    }

    const response: CleanupResponse = {
      success: results.every(r => r.success),
      results,
      totalProcessed
    };

    console.log('Cleanup completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
      status: 200
    });

  } catch (error) {
    console.error('Database cleanup error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      results: [],
      totalProcessed: 0,
      error: error.message
    }), {
      headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId },
      status: 500
    });
  }
});