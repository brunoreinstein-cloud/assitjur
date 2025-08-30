import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`📞 import-into-version called with method: ${req.method}`);

  try {
    // Validate request method  
    if (req.method !== 'POST') {
      console.error('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const requestBody = await req.json();
    console.log('📥 Received import request:', {
      versionId: requestBody.versionId,
      processosCount: requestBody.processos?.length || 0,
      testemunhasCount: requestBody.testemunhas?.length || 0,
      hasFileChecksum: !!requestBody.fileChecksum,
      firstProcessoFields: requestBody.processos?.[0] ? Object.keys(requestBody.processos[0]) : [],
      firstProcessoSample: requestBody.processos?.[0] || null
    });
    
    const { versionId, processos = [], testemunhas = [], fileChecksum, filename } = requestBody;

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

    // 1. Limpar TODOS os dados da organização para evitar duplicatas
    console.log('🧹 Clearing existing data for organization...');
    
    // Primeiro, limpar dados da versão específica
    const { error: versionDeleteError } = await supabase
      .from('processos')
      .delete()
      .eq('org_id', profile.organization_id)
      .eq('version_id', versionId);

    if (versionDeleteError) {
      console.error('❌ Error clearing version data:', versionDeleteError);
    }

    // Depois, limpar dados draft (não publicados) para evitar conflitos
    const { error: draftDeleteError } = await supabase
      .from('processos')
      .delete()
      .eq('org_id', profile.organization_id)
      .is('version_id', null);

    if (draftDeleteError) {
      console.error('❌ Error clearing draft data:', draftDeleteError);
    }

    console.log('✅ Existing data cleared successfully');

    let imported = 0;
    let errors = 0;
    let warnings = 0;

    // 2. Inserir processos com version_id e campos corrigidos
    if (processos.length > 0) {
      console.log(`📊 Preparing to insert ${processos.length} processos. Sample data:`, processos[0]);
      
      const processosWithVersion = processos.map((p: any, index: number) => {
        // Convert date strings to proper format
        const dataAudiencia = p.data_audiencia 
          ? (p.data_audiencia.match(/^\d{4}-\d{2}-\d{2}$/) 
              ? p.data_audiencia 
              : null)
          : null;

        // Parse array fields if they come as strings
        const parseArrayField = (field: any) => {
          if (!field) return null;
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            return field.split(/[;,]/).map(s => s.trim()).filter(Boolean);
          }
          return null;
        };

        const mappedData = {
          org_id: profile.organization_id,
          version_id: versionId,
          cnj: p.cnj || p.CNJ || '',
          cnj_digits: p.cnj_digits || p.CNJ_digits || '',
          cnj_normalizado: p.cnj_digits || p.CNJ_digits || '',
          reclamante_nome: p.reclamante_nome || p.reclamante || '',
          reu_nome: p.reu_nome || p.reu || p.reclamado || '',
          comarca: p.comarca || null,
          tribunal: p.tribunal || null,
          vara: p.vara || null,
          fase: p.fase || null,
          status: p.status || null,
          reclamante_cpf_mask: p.reclamante_cpf_mask || p.reclamante_cpf || null,
          data_audiencia: dataAudiencia,
          advogados_ativo: parseArrayField(p.advogados_ativo),
          advogados_passivo: parseArrayField(p.advogados_passivo),
          testemunhas_ativo: parseArrayField(p.testemunhas_ativo),
          testemunhas_passivo: parseArrayField(p.testemunhas_passivo),
          observacoes: p.observacoes || null,
        };

        // Log sample of mapped data for first few records
        if (index < 3) {
          console.log(`📋 Sample mapped data #${index + 1}:`, mappedData);
        }

        return mappedData;
      });

      console.log(`Inserting ${processosWithVersion.length} processos into version ${versionId}`);
      
      // Insert in batches of 100 to avoid timeouts
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < processosWithVersion.length; i += batchSize) {
        const batch = processosWithVersion.slice(i, i + batchSize);
        console.log(`📦 Inserting batch ${Math.floor(i / batchSize) + 1}, records ${i + 1}-${Math.min(i + batchSize, processosWithVersion.length)}`);
        
        // Use upsert to handle potential duplicates
        const { data: insertedBatch, error: batchError } = await supabase
          .from('processos')
          .upsert(batch, { 
            onConflict: 'org_id,cnj_digits',
            ignoreDuplicates: false 
          })
          .select('id');

        if (batchError) {
          console.error(`❌ Error upserting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          
          // Try individual inserts for this batch to identify specific errors
          console.log('🔍 Trying individual inserts for problematic batch...');
          for (const record of batch) {
            const { error: individualError } = await supabase
              .from('processos')
              .upsert(record, { onConflict: 'org_id,cnj_digits' })
              .select('id');
              
            if (individualError) {
              console.error(`❌ Individual error for CNJ ${record.cnj_digits}:`, individualError);
              errors++;
            } else {
              totalInserted++;
            }
          }
        } else {
          const batchInserted = insertedBatch?.length || 0;
          totalInserted += batchInserted;
          console.log(`✅ Successfully upserted batch ${Math.floor(i / batchSize) + 1}: ${batchInserted} records`);
        }
      }

      imported = totalInserted;
      console.log(`🎉 Total processos inserted: ${totalInserted}`);
    } else {
      console.log('⚠️ No processos to insert - array is empty');
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
    console.error('💥 CRITICAL ERROR in import-into-version:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});