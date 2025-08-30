import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { versionId } = await req.json();

    // Verificar se a versão existe e pertence à organização
    const { data: versionToPublish } = await supabase
      .from('versions')
      .select('id, number, org_id, status')
      .eq('id', versionId)
      .eq('org_id', profile.organization_id)
      .single();

    if (!versionToPublish) {
      return new Response(
        JSON.stringify({ error: 'Version not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (versionToPublish.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Only draft versions can be published' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // 1. Marcar versões anteriores como archived
    await supabase
      .from('versions')
      .update({ status: 'archived' })
      .eq('org_id', profile.organization_id)
      .eq('status', 'published');

    // 2. Publicar nova versão
    const { data: publishedVersion, error } = await supabase
      .from('versions')
      .update({ 
        status: 'published', 
        published_at: now,
        summary: {
          ...versionToPublish.summary,
          published_at: now,
          published_by: user.email
        }
      })
      .eq('id', versionId)
      .select('number, published_at')
      .single();

    if (error) {
      console.error('Error publishing version:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to publish version' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Published version v${publishedVersion.number} for org ${profile.organization_id}`);

    // After publishing, process witness data from the imported processos
    try {
      // Get processos data for this organization
      const { data: processosData, error: processosError } = await supabase
        .from('processos')
        .select('*')
        .eq('org_id', profile.organization_id)
        .is('deleted_at', null);

      if (processosError) {
        console.error('Error fetching processos for witness processing:', processosError);
      } else if (processosData && processosData.length > 0) {
        console.log(`Processing witness data for ${processosData.length} processos`);
        
        // Extract witness data and update records
        const updates = processosData
          .filter(p => p.testemunhas_ativo === null && p.testemunhas_passivo === null)
          .map(processo => {
            // Extract witness arrays from raw data if available
            // This is a placeholder - in real implementation, witness data would come from the import
            const testemunhasAtivo = []; // Would be extracted from import data
            const testemunhasPassivo = []; // Would be extracted from import data
            
            return {
              id: processo.id,
              testemunhas_ativo: testemunhasAtivo,
              testemunhas_passivo: testemunhasPassivo
            };
          });

        if (updates.length > 0) {
          console.log(`Updating ${updates.length} processos with witness data`);
          // Note: In a real implementation, we would batch update these records
        }
      }
    } catch (witnessError) {
      console.error('Error processing witness data after publication:', witnessError);
      // Don't fail the publication if witness processing fails
    }

    return new Response(
      JSON.stringify({ 
        number: publishedVersion.number, 
        publishedAt: publishedVersion.published_at 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-version:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});