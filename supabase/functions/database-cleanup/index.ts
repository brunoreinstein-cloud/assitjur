import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orgId, operations, preview = false }: CleanupRequest = await req.json();

    console.log(`Starting database cleanup for org ${orgId}`, { operations, preview });

    const results: CleanupResponse['results'] = [];
    let totalProcessed = 0;

    // Se é preview, apenas busca as informações
    if (preview) {
      const { data: previewData, error } = await supabase.rpc('rpc_get_cleanup_preview', {
        p_org_id: orgId
      });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        preview: previewData,
        message: 'Preview gerado com sucesso'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Executa as operações solicitadas
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation) {
          case 'invalid_cnjs':
            result = await supabase.rpc('rpc_cleanup_invalid_cnjs', { p_org_id: orgId });
            break;
          case 'empty_fields':
            result = await supabase.rpc('rpc_cleanup_empty_required_fields', { p_org_id: orgId });
            break;
          case 'duplicates':
            result = await supabase.rpc('rpc_cleanup_duplicates', { p_org_id: orgId });
            break;
          case 'normalize_cnjs':
            result = await supabase.rpc('rpc_cleanup_normalize_cnjs', { p_org_id: orgId });
            break;
          case 'hard_delete_old':
            result = await supabase.rpc('rpc_cleanup_hard_delete_old', { p_org_id: orgId });
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});