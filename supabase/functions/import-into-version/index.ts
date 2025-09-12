import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'

console.log('🚀 import-into-version function starting - CORS fix applied...');

serve('import-into-version', async (req) => {
  console.log(`📞 import-into-version called with method: ${req.method}, origin: ${req.headers.get('origin')}`);

  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  console.log(`📞 Processing ${req.method} request...`);

  try {
    // Validate request method  
    if (req.method !== 'POST') {
      console.error('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    console.log('✅ Authorization header present');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
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
        { status: 401, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
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
        { status: 403, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
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
    
    // 🔍 CRITICAL DEBUG: Log detailed data structure
    if (requestBody.processos && requestBody.processos.length > 0) {
      const sampleRecord = requestBody.processos[0];
      console.log('🔍 DETAILED RECORD ANALYSIS:', {
        totalRecords: requestBody.processos.length,
        allFields: Object.keys(sampleRecord),
        fieldValues: {
          cnj: sampleRecord.cnj,
          cnj_digits: sampleRecord.cnj_digits,
          reclamante_nome: sampleRecord.reclamante_nome,
          reclamante: sampleRecord.reclamante,
          reclamante_limpo: sampleRecord.reclamante_limpo,
          reu_nome: sampleRecord.reu_nome,
          reu: sampleRecord.reu,
          reclamado: sampleRecord.reclamado
        },
        hasRequiredFields: {
          hasCNJ: !!(sampleRecord.cnj || sampleRecord.cnj_digits),
          hasReclamante: !!(sampleRecord.reclamante_nome || sampleRecord.reclamante || sampleRecord.reclamante_limpo),
          hasReu: !!(sampleRecord.reu_nome || sampleRecord.reu || sampleRecord.reclamado)
        }
      });
    }
    
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
        { status: 404, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    if (version.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Can only import into draft versions' }),
        { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
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
        { status: 500, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
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

      // Timeout management (extended for very large datasets)
      const startTime = Date.now();
      const maxExecutionTime = 900000; // 15 minutes for large datasets (was 8 minutes)

      const processosWithVersion = validProcessos.map((p: any, index: number) => {
        // 🔍 Log field mapping for first few records
        if (index < 3) {
          console.log(`🔍 MAPPING RECORD ${index + 1}:`, {
            originalFields: Object.keys(p),
            mapping: {
              cnj: `"${p.cnj || p.CNJ || ''}" (from: ${p.cnj ? 'cnj' : p.CNJ ? 'CNJ' : 'empty'})`,
              cnj_digits: `"${p.cnj_digits || p.CNJ_digits || ''}" (from: ${p.cnj_digits ? 'cnj_digits' : p.CNJ_digits ? 'CNJ_digits' : 'empty'})`,
              reclamante_nome: `"${p.reclamante_nome || p.reclamante || p.reclamante_limpo || ''}" (from: ${p.reclamante_nome ? 'reclamante_nome' : p.reclamante ? 'reclamante' : p.reclamante_limpo ? 'reclamante_limpo' : 'empty'})`,
              reu_nome: `"${p.reu_nome || p.reu || p.reclamado || ''}" (from: ${p.reu_nome ? 'reu_nome' : p.reu ? 'reu' : p.reclamado ? 'reclamado' : 'empty'})`
            }
          });
        }
        
        return {
          org_id: profile.organization_id,
          version_id: versionId,
          cnj: p.cnj || p.CNJ || '',
          cnj_digits: p.cnj_digits || p.CNJ_digits || '',
          cnj_normalizado: p.cnj_digits || p.CNJ_digits || '',
          // 🔧 CRITICAL FIX: Corrected field mapping priority
          reclamante_nome: p.reclamante_nome || p.reclamante_limpo || p.reclamante || '',
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
        };
      });

      // 🔧 PERFORMANCE OPTIMIZATION: Reduced batch size for large dataset stability
      const batchSize = 10; // Reduced from 25 to 10 for better reliability with large datasets
      let totalInserted = 0;
      let totalRetried = 0;
      const totalBatches = Math.ceil(processosWithVersion.length / batchSize);
      
      console.log(`🚀 Starting optimized import: ${totalBatches} batches of ${batchSize} records each`);
      console.log(`📊 Processing ${processosWithVersion.length} total records with retry mechanism`);
      
      // Process batches with retry mechanism
      for (let i = 0; i < processosWithVersion.length; i += batchSize) {
        // Timeout check with extended time for large datasets
        if (Date.now() - startTime > maxExecutionTime) {
          console.error('⏰ Execution timeout reached, stopping import');
          break;
        }

        const batch = processosWithVersion.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        let retryCount = 0;
        const maxRetries = 2;
        let batchSuccess = false;
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (records ${i + 1}-${Math.min(i + batchSize, processosWithVersion.length)})`);
        
        // Retry mechanism for failed batches
        while (!batchSuccess && retryCount <= maxRetries) {
          if (retryCount > 0) {
            console.log(`🔄 Retrying batch ${batchNumber} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            totalRetried++;
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          
          try {
            // Process individual records in batch
            let batchInserted = 0;
            let batchErrors = 0;
            
            for (const record of batch) {
              try {
                // 🔍 PRE-INSERTION VALIDATION with detailed logging
                const validation = {
                  hasCNJ: !!record.cnj_digits,
                  cnjLength: record.cnj_digits?.length || 0,
                  hasReclamante: !!record.reclamante_nome,
                  hasReu: !!record.reu_nome,
                  cnjValue: record.cnj_digits
                };
                
                if (batchInserted < 3) {
                  console.log(`🔍 VALIDATION RECORD ${batchInserted + 1}:`, validation);
                }
                
                // Validate essential fields before attempting insert
                if (!record.cnj_digits || record.cnj_digits.length !== 20) {
                  console.warn(`⚠️ Skipping invalid CNJ: "${record.cnj_digits}" (length: ${record.cnj_digits?.length || 0})`);
                  batchErrors++;
                  continue;
                }
                
                // ✅ FLEXIBLE VALIDATION: Accept records with valid CNJ even if names are missing
                // This allows importing "stub" records that can be completed later
                console.log(`✅ Processing record with CNJ ${record.cnj_digits}: reclamante="${record.reclamante_nome || 'NULL'}", reu="${record.reu_nome || 'NULL'}"`);
                
                // Convert empty strings to null for cleaner data
                if (record.reclamante_nome === '') record.reclamante_nome = null;
                if (record.reu_nome === '') record.reu_nome = null;
                
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
                    console.error(`❌ Failed to update CNJ ${record.cnj_digits}:`, {
                      error: updateError.message,
                      code: updateError.code,
                      details: updateError.details,
                      recordData: {
                        cnj_digits: record.cnj_digits,
                        reclamante_nome: record.reclamante_nome,
                        reu_nome: record.reu_nome
                      }
                    });
                    batchErrors++;
                  } else {
                    batchInserted++;
                    if (batchInserted % 5 === 0 || batchInserted < 5) {
                      console.log(`📝 Updated record ${batchInserted}: CNJ ${record.cnj_digits}, Reclamante: "${record.reclamante_nome}", Reu: "${record.reu_nome}"`);
                    }
                  }
                } else {
                  // Insert new record
                  const { error: insertError } = await supabase
                    .from('processos')
                    .insert([record]);

                  if (insertError) {
                    console.error(`❌ Failed to insert CNJ ${record.cnj_digits}:`, {
                      error: insertError.message,
                      code: insertError.code,
                      details: insertError.details,
                      hint: insertError.hint,
                      recordData: {
                        cnj_digits: record.cnj_digits,
                        reclamante_nome: record.reclamante_nome,
                        reu_nome: record.reu_nome
                      }
                    });
                    batchErrors++;
                  } else {
                    batchInserted++;
                    if (batchInserted % 5 === 0 || batchInserted < 5) {
                      console.log(`✅ Inserted record ${batchInserted}: CNJ ${record.cnj_digits}, Reclamante: "${record.reclamante_nome}", Reu: "${record.reu_nome}"`);
                    }
                  }
                }
              } catch (recordError: any) {
                console.error(`❌ Error processing CNJ ${record.cnj_digits}:`, recordError.message);
                batchErrors++;
              }
            }

            // Batch completed successfully
            totalInserted += batchInserted;
            errors += batchErrors;
            batchSuccess = true;
            
            console.log(`✅ Batch ${batchNumber} complete: ${batchInserted}/${batch.length} records processed successfully (${batchErrors} errors)`);
            
          } catch (batchError: any) {
            console.error(`❌ Batch ${batchNumber} failed (attempt ${retryCount + 1}):`, batchError.message);
            retryCount++;
            
            if (retryCount > maxRetries) {
              console.error(`🚨 Batch ${batchNumber} failed after ${maxRetries + 1} attempts, skipping batch`);
              errors += batch.length; // Count all records in failed batch as errors
              break;
            }
          }
        }
        
        // Small delay between batches to prevent database overload
        if (batchNumber < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay for large datasets
        }
        
        // Log progress every 10 batches or if significant milestone
        if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
          const progressPercent = Math.round((batchNumber / totalBatches) * 100);
          console.log(`📊 Progress: ${progressPercent}% complete (${totalInserted} imported, ${errors} errors, ${totalRetried} retries)`);
        }
      }

      imported = totalInserted;
      console.log(`🎉 Import complete: ${totalInserted}/${validProcessos.length} processos processed`);
      console.log(`📊 Final stats: ${totalInserted} successful, ${errors} failed, ${totalRetried} batch retries`);
      
      if (errors > 0) {
        console.log(`⚠️ ${errors} records failed to import`);
        
        // Calculate failure rate with retry context
        const failureRate = errors / validProcessos.length;
        if (failureRate > 0.5) {
          console.error(`🚨 High failure rate: ${Math.round(failureRate * 100)}% of records failed (after ${totalRetried} retries)`);
        }
      }
      
      // More lenient validation - allow partial success for large imports
      if (totalInserted === 0 && validProcessos.length > 0) {
        console.error('🚨 CRITICAL: No records were imported despite having valid data');
        return new Response(
          JSON.stringify({ 
            error: 'Import failed - no records were imported',
            details: `Attempted to import ${validProcessos.length} records but all failed`,
            errors: errors,
            retries_attempted: totalRetried
          }),
          { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
        );
      }
      
      // Success criteria: At least 25% of records imported for large datasets
      const successRate = totalInserted / validProcessos.length;
      if (validProcessos.length > 1000 && successRate < 0.25) {
        console.error(`🚨 Large dataset import with low success rate: ${Math.round(successRate * 100)}%`);
        return new Response(
          JSON.stringify({ 
            error: 'Import partially failed - success rate too low for large dataset',
            details: `Only ${totalInserted}/${validProcessos.length} records imported (${Math.round(successRate * 100)}%)`,
            imported: totalInserted,
            errors: errors,
            retries_attempted: totalRetried
          }),
          { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
        );
      }
    } else {
      console.log('⚠️ No valid processos to insert');
    }

    // 4. Atualizar summary da versão com estatísticas detalhadas
    const summary = {
      imported,
      errors,
      warnings,
      retries_attempted: totalRetried || 0,
      success_rate: validProcessos.length > 0 ? Math.round((imported / validProcessos.length) * 100) : 0,
      file_checksum: fileChecksum,
      filename: filename || 'unknown',
      updated_at: new Date().toISOString(),
      updated_by: user.email,
      total_records: (requestBody.processos || []).length,
      processos_count: imported,
      testemunhas_count: testemunhas.length,
      performance_stats: {
        batch_size: 10,
        total_batches: Math.ceil(validProcessos.length / 10),
        processing_time_ms: Date.now() - startTime
      }
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
        success: true,
        summary: {
          imported,
          errors,
          retries_attempted: totalRetried || 0,
          success_rate: validProcessos.length > 0 ? Math.round((imported / validProcessos.length) * 100) : 0,
          warnings,
          valid: imported,
          analyzed: (requestBody.processos || []).length
        }
      }),
      { headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
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
      { status: 500, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }
});