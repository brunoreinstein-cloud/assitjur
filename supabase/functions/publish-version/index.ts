import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  console.log(`📞 publish-version called with method: ${req.method}`);

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.error('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authorization header present');

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
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user) {
      console.error('❌ No user found');
      return new Response(
        JSON.stringify({ error: 'No user found' }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Buscar perfil do usuário
    console.log('👤 Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || profile.role !== 'ADMIN') {
      console.error('❌ Insufficient permissions. Profile:', profile);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Profile validated:', { role: profile.role, org: profile.organization_id });

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📦 Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { versionId } = requestBody;
    if (!versionId) {
      console.error('❌ Missing versionId in request');
      return new Response(
        JSON.stringify({ error: 'Missing versionId' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a versão existe e pertence à organização
    console.log('📋 Checking version:', versionId);
    const { data: versionToPublish, error: versionError } = await supabase
      .from('versions')
      .select('id, number, org_id, status')
      .eq('id', versionId)
      .eq('org_id', profile.organization_id)
      .single();

    if (versionError) {
      console.error('❌ Version fetch error:', versionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch version', details: versionError.message }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!versionToPublish) {
      console.error('❌ Version not found or access denied');
      return new Response(
        JSON.stringify({ error: 'Version not found' }),
        { status: 404, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Version found:', { number: versionToPublish.number, status: versionToPublish.status });

    if (versionToPublish.status !== 'draft') {
      console.error('❌ Invalid status for publication:', versionToPublish.status);
      return new Response(
        JSON.stringify({ error: 'Only draft versions can be published' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a versão tem dados antes de publicar
    console.log('📊 Checking if version has data...');
    const { count: processosCount, error: countError } = await supabase
      .from('processos')
      .select('*', { count: 'exact', head: true })
      .eq('version_id', versionId);

    if (countError) {
      console.error('❌ Error counting processos:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate version data', details: countError.message }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!processosCount || processosCount === 0) {
      console.error('❌ Cannot publish empty version. Processos count:', processosCount);
      
      // Verificar se houve tentativa de importação recente com dados detalhados
      const { data: versionWithSummary } = await supabase
        .from('versions')
        .select('summary')
        .eq('id', versionId)
        .single();
      
      const summary = versionWithSummary?.summary || {};
      const importErrors = summary.errors || 0;
      const attemptedImport = summary.total_records || 0;
      const imported = summary.imported || 0;
      
      console.log('📊 Version summary analysis:', {
        attempted: attemptedImport,
        imported: imported,
        errors: importErrors,
        hasAttemptedImport: attemptedImport > 0
      });
      
      let errorMessage = 'Não é possível publicar versão vazia';
      let details = `A versão contém ${processosCount || 0} processos. Importe dados válidos primeiro.`;
      
      if (attemptedImport > 0) {
        if (imported === 0) {
          errorMessage = 'Falha total na importação - nenhum dado foi importado';
          details = `Tentativa de importar ${attemptedImport} registros, mas todos falharam (${importErrors} erros). Verifique o formato dos dados e tente novamente.`;
        } else if (imported < attemptedImport / 2) {
          errorMessage = 'Importação com alta taxa de falha';
          details = `Apenas ${imported} de ${attemptedImport} registros foram importados com sucesso (${importErrors} erros). Taxa de sucesso muito baixa.`;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: details,
          importStats: {
            attempted: attemptedImport,
            imported: imported,
            failed: importErrors,
            successful: processosCount || 0,
            successRate: attemptedImport > 0 ? Math.round((imported / attemptedImport) * 100) : 0
          }
        }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Version has ${processosCount} processos, proceeding with publication`);

    const now = new Date().toISOString();

    // 1. Marcar versões anteriores como archived
    console.log('📚 Archiving previous published versions...');
    const { error: archiveError } = await supabase
      .from('versions')
      .update({ status: 'archived' })
      .eq('org_id', profile.organization_id)
      .eq('status', 'published');

    if (archiveError) {
      console.error('❌ Error archiving previous versions:', archiveError);
      // Continue anyway, this is not critical
    } else {
      console.log('✅ Previous versions archived');
    }

    // 2. Publicar nova versão
    console.log('🚀 Publishing version...');
    const { data: publishedVersion, error } = await supabase
      .from('versions')
      .update({ 
        status: 'published', 
        published_at: now,
        summary: {
          ...(versionToPublish.summary || {}),
          published_at: now,
          published_by: user.email
        }
      })
      .eq('id', versionId)
      .select('number, published_at')
      .single();

    if (error) {
      console.error('❌ Error publishing version:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to publish version', details: error.message }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!publishedVersion) {
      console.error('❌ No version data returned after publish');
      return new Response(
        JSON.stringify({ error: 'Failed to publish version - no data returned' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Published version v${publishedVersion.number} for org ${profile.organization_id}`);

    // Iniciar processamento automatico de testemunhas em background
    console.log('Starting automatic witness data processing...');
    try {
      supabase.functions.invoke('process-witness-data', {
        body: { org_id: profile.organization_id }
      }).then(() => {
        console.log('✅ Witness processing initiated successfully');
      }).catch((err) => {
        console.error('⚠️ Non-critical: Failed to start witness processing:', err);
      });
    } catch (bgError) {
      console.error('⚠️ Non-critical: Background process error:', bgError);
    }

    return new Response(
      JSON.stringify({ 
        number: publishedVersion.number, 
        publishedAt: publishedVersion.published_at,
        processosCount: processosCount
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 CRITICAL ERROR in publish-version:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});