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

    // 1. Limpeza inteligente de dados (otimizado para duplicatas)
    console.log('🧹 Clearing existing version data...');
    
    const { error: deleteError } = await supabase
      .from('processos')
      .delete()
      .eq('org_id', profile.organization_id)
      .eq('version_id', versionId);

    if (deleteError) {
      console.error('❌ Error clearing version data:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Version data cleared successfully');

    // 2. Validação prévia de CNJs únicos
    if (processos.length > 0) {
      const cnjsSet = new Set();
      const validProcessos = [];
      let duplicatesFound = 0;

      for (const processo of processos) {
        const cnj = processo.cnj_digits || processo.CNJ_digits || '';
        if (cnj && cnj.length === 20) {
          if (!cnjsSet.has(cnj)) {
            cnjsSet.add(cnj);
            validProcessos.push(processo);
          } else {
            duplicatesFound++;
          }
        }
      }

      if (duplicatesFound > 0) {
        console.log(`⚠️ Found and removed ${duplicatesFound} duplicate CNJs`);
      }

      // Substituir array original pelos dados únicos
      requestBody.processos = validProcessos;
    }

    let imported = 0;
    let errors = 0;
    let warnings = 0;

    // 3. Inserir processos com robustez melhorada
    const validProcessos = requestBody.processos || [];
    if (validProcessos.length > 0) {
      console.log(`📊 Preparing to insert ${validProcessos.length} processos...`);
      
      // Parse array fields function (optimized)
      const parseArrayField = (field: any) => {
        if (!field) return null;
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          return field.split(/[;,]/).map(s => s.trim()).filter(Boolean);
        }
        return null;
      };

      // Timeout management (increased for large files)
      const startTime = Date.now();
      const maxExecutionTime = 300000; // 5 minutos

      const processosWithVersion = validProcessos.map((p: any) => ({
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
        data_audiencia: p.data_audiencia && p.data_audiencia.match(/^\d{4}-\d{2}-\d{2}$/) ? p.data_audiencia : null,
        advogados_ativo: parseArrayField(p.advogados_ativo),
        advogados_passivo: parseArrayField(p.advogados_passivo),
        testemunhas_ativo: parseArrayField(p.testemunhas_ativo),
        testemunhas_passivo: parseArrayField(p.testemunhas_passivo),
        observacoes: p.observacoes || null,
      }));

      // Batch otimizado para evitar timeout (50 registros para maior estabilidade)
      const batchSize = 50;
      let totalInserted = 0;
      const totalBatches = Math.ceil(processosWithVersion.length / batchSize);
      
      console.log(`🚀 Starting import: ${totalBatches} batches of ${batchSize} records each`);
      console.log(`📊 Processing ${processosWithVersion.length} total records`);
      
      for (let i = 0; i < processosWithVersion.length; i += batchSize) {
        // Timeout check
        if (Date.now() - startTime > maxExecutionTime) {
          console.error('⏰ Execution timeout reached, stopping import');
          break;
        }

        const batch = processosWithVersion.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (records ${i + 1}-${Math.min(i + batchSize, processosWithVersion.length)})`);
        
        // Simplified insertion strategy - individual record processing for better error handling
        let batchInserted = 0;
        
        for (const record of batch) {
          try {
            // Validate essential fields before attempting insert
            if (!record.cnj_digits || record.cnj_digits.length !== 20) {
              console.warn(`⚠️ Skipping invalid CNJ: ${record.cnj_digits}`);
              errors++;
              continue;
            }
            
            // Check if record already exists
            const { data: existingRecord } = await supabase
              .from('processos')
              .select('id')
              .eq('org_id', record.org_id)
              .eq('cnj_digits', record.cnj_digits)
              .is('deleted_at', null)
              .single();

            if (existingRecord) {
              // Update existing record
              const { error: updateError } = await supabase
                .from('processos')
                .update({
                  cnj: record.cnj,
                  cnj_normalizado: record.cnj_normalizado,
                  reclamante_nome: record.reclamante_nome,
                  reu_nome: record.reu_nome,
                  comarca: record.comarca,
                  tribunal: record.tribunal,
                  vara: record.vara,
                  fase: record.fase,
                  status: record.status,
                  reclamante_cpf_mask: record.reclamante_cpf_mask,
                  data_audiencia: record.data_audiencia,
                  advogados_ativo: record.advogados_ativo,
                  advogados_passivo: record.advogados_passivo,
                  testemunhas_ativo: record.testemunhas_ativo,
                  testemunhas_passivo: record.testemunhas_passivo,
                  observacoes: record.observacoes,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRecord.id);

              if (updateError) {
                console.error(`❌ Failed to update CNJ ${record.cnj_digits}:`, updateError.message);
                errors++;
              } else {
                batchInserted++;
                if (batchInserted % 10 === 0) {
                  console.log(`📝 Updated ${batchInserted} records in batch ${batchNumber}...`);
                }
              }
            } else {
              // Insert new record
              const { error: insertError } = await supabase
                .from('processos')
                .insert([record]);

              if (insertError) {
                console.error(`❌ Failed to insert CNJ ${record.cnj_digits}:`, insertError.message);
                console.error(`🔍 Insert error details:`, {
                  code: insertError.code,
                  details: insertError.details,
                  hint: insertError.hint
                });
                errors++;
              } else {
                batchInserted++;
                if (batchInserted % 10 === 0) {
                  console.log(`✅ Inserted ${batchInserted} records in batch ${batchNumber}...`);
                }
              }
            }
          } catch (recordError: any) {
            console.error(`❌ Error processing CNJ ${record.cnj_digits}:`, recordError.message);
            errors++;
          }
        }

        totalInserted += batchInserted;
        console.log(`✅ Batch ${batchNumber} complete: ${batchInserted}/${batch.length} records processed successfully`);
        
        // Small delay between batches to prevent overwhelming the database
        if (batchNumber < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      imported = totalInserted;
      console.log(`🎉 Import complete: ${totalInserted}/${validProcessos.length} processos processed`);
      console.log(`📊 Final stats: ${totalInserted} successful, ${errors} failed`);
      
      if (errors > 0) {
        console.log(`⚠️ ${errors} records failed to import`);
        
        // Se mais de 50% falharam, considerar como erro crítico
        const failureRate = errors / validProcessos.length;
        if (failureRate > 0.5) {
          console.error(`🚨 High failure rate: ${Math.round(failureRate * 100)}% of records failed`);
        }
      }
      
      if (totalInserted === 0 && validProcessos.length > 0) {
        console.error('🚨 CRITICAL: No records were imported despite having valid data');
        return new Response(
          JSON.stringify({ 
            error: 'Import failed - no records were imported',
            details: `Attempted to import ${validProcessos.length} records but all failed`,
            errors: errors
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('⚠️ No valid processos to insert');
    }

    // 4. Atualizar summary da versão
    const summary = {
      imported,
      errors,
      warnings,
      file_checksum: fileChecksum,
      filename: filename || 'unknown',
      updated_at: new Date().toISOString(),
      updated_by: user.email,
      total_records: (requestBody.processos || []).length,
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
          analyzed: (requestBody.processos || []).length
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