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

    const { versionId, processos = [], testemunhas = [], fileChecksum, filename } = await req.json();

    // Verificar se a versão existe e é draft
    const { data: version } = await supabase
      .from('versions')
      .select('id, status, org_id')
      .eq('id', versionId)
      .eq('org_id', profile.organization_id)
      .single();

    if (!version) {
      return new Response(
        JSON.stringify({ error: 'Version not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (version.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Can only import into draft versions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Limpar dados existentes da versão (idempotência)
    await supabase
      .from('processos')
      .delete()
      .eq('version_id', versionId);

    let imported = 0;
    let errors = 0;
    let warnings = 0;

    // 2. Inserir processos com version_id e campos corrigidos
    if (processos.length > 0) {
      const processosWithVersion = processos.map((p: any) => {
        // Convert date strings to proper format
        const dataAudiencia = p.data_audiencia 
          ? (p.data_audiencia.match(/^\d{4}-\d{2}-\d{2}$/) 
              ? p.data_audiencia 
              : null)
          : null;

        return {
          org_id: profile.organization_id,
          version_id: versionId,
          cnj: p.cnj || '',
          cnj_digits: p.cnj_digits || '',
          cnj_normalizado: p.cnj_digits || '',
          reclamante_nome: p.reclamante_nome || '',
          reu_nome: p.reu_nome || '',
          comarca: p.comarca || null,
          tribunal: p.tribunal || null,
          vara: p.vara || null,
          fase: p.fase || null,
          status: p.status || null,
          reclamante_cpf_mask: p.reclamante_cpf_mask || null,
          data_audiencia: dataAudiencia,
          advogados_ativo: p.advogados_ativo || null,
          advogados_passivo: p.advogados_passivo || null,
          testemunhas_ativo: p.testemunhas_ativo || null,
          testemunhas_passivo: p.testemunhas_passivo || null,
          observacoes: p.observacoes || null,
        };
      });

      console.log(`Inserting ${processosWithVersion.length} processos into version ${versionId}`);
      
      const { data: insertedProcessos, error: processosError } = await supabase
        .from('processos')
        .insert(processosWithVersion)
        .select('id');

      if (processosError) {
        console.error('Error inserting processos:', processosError);
        errors += processos.length;
      } else {
        imported += insertedProcessos?.length || 0;
        console.log(`Successfully inserted ${insertedProcessos?.length || 0} processos`);
      }
    }

    // 3. Atualizar summary da versão
    const summary = {
      imported,
      errors,
      warnings,
      file_checksum: fileChecksum,
      filename: filename || 'unknown',
      updated_at: new Date().toISOString(),
      updated_by: user.email,
      total_records: processos.length,
      processos_count: imported,
      testemunhas_count: testemunhas.length
    };

    await supabase
      .from('versions')
      .update({ 
        summary,
        file_checksum: fileChecksum
      })
      .eq('id', versionId);

    console.log(`Imported ${imported} processos into version ${versionId}`);

    return new Response(
      JSON.stringify({ 
        summary: {
          imported,
          errors,
          warnings,
          valid: imported,
          analyzed: processos.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-into-version:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});