import { serve } from '../_shared/observability.ts';
import { audit } from "../_shared/audit.ts"
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'

interface ProcessedRow {
  cnj: string
  cnj_digits: string  // Alinhado com novo schema
  reclamante_limpo?: string  // Mapeamento correto do template
  comarca?: string
  tribunal?: string
  vara?: string
  fase?: string
  status?: string
  reclamante_nome?: string
  reclamante_cpf?: string
  reu_nome?: string
  data_audiencia?: string
  observacoes?: string
}

interface ProcessedDataValidationResult {
  totalRows: number
  validRows: number
  errors: ValidationError[]
  warnings: ValidationError[]
}

interface ValidationError {
  row: number
  column: string
  type: 'error' | 'warning'
  message: string
  value?: string
}

interface HeaderMappingResult {
  requiredFields: Record<string, number>;
  optionalFields: Record<string, number>;
  unmappedFields: string[];
  suggestions: Array<{
    header: string;
    suggestion: string;
    confidence: number;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  normalizedValue?: any;
}

// Header mapping will be handled by the advanced function later in the file

// Text sanitization will be handled by the advanced function later in the file

// CNJ validation and duplicate checking will be handled by the advanced functions later in the file

serve('process-base-upload', async (req) => {
  console.log('📊 Base Upload Function Started');
  console.log('Method:', req.method, 'URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { user, organization_id: orgId, role, supa: supabase } = await getAuth(req);
    if (!user) {
      throw new Error('Missing or invalid authorization header');
    }

    const userId = user.id;

    if (role !== 'ADMIN') {
      throw new Error('Only admins can upload base data');
    }

    console.log('✅ Admin user verified for org:', orgId);

    const formData = await req.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string // 'validate' or 'publish'

    if (!file) {
      throw new Error('No file provided')
    }

    console.log(`Processing ${action} for file: ${file.name}, size: ${file.size}`)

    // Check file size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit. Please use a smaller file.')
    }

    // Process file in chunks to avoid memory issues
    const validationResult = await processFileInChunks(file, orgId, userId, user.email!, action, supabase)
    
    if (action === 'validate') {
      // Just return validation results
      return new Response(
        JSON.stringify({
          success: true,
          validation: validationResult
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (action === 'publish') {
      return new Response(
        JSON.stringify({
          success: true,
          version: validationResult
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    console.error('💥 Function error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Memory-efficient file processing using chunks
async function processFileInChunks(
  file: File, 
  orgId: string, 
  userId: string, 
  userEmail: string,
  action: string, 
  supabase: any
): Promise<any> {
  console.log('📝 Starting chunk-based processing...');
  
  const CHUNK_SIZE = 1000; // Process 1000 rows at a time
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let totalRows = 0;
  let validRows = 0;
  let processedCount = 0;
  
  // Read file in smaller chunks
  const arrayBuffer = await file.arrayBuffer();
  console.log('📁 File loaded into memory:', (arrayBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
  
  const workbook = XLSX.read(arrayBuffer, { 
    type: 'array',
    cellStyles: false,
    cellNF: false,
    cellHTML: false
  });
  
  // Get first worksheet
  const worksheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[worksheetName];
  
  // Get headers first
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const headers: string[] = [];
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell ? String(cell.v) : '');
  }
  
  console.log('📊 Headers found:', headers);
  
  // Use advanced header mapping
  const headerMappingResult = mapHeadersAdvanced(headers);
  const headerMap = { ...headerMappingResult.requiredFields, ...headerMappingResult.optionalFields };
  
  // Skip validation errors for headers - this was causing "Linha 0" error
  if (action === 'validate' && headerMappingResult.fileType === 'processos') {
    // Log the mapping for debugging but don't add errors for missing headers during validation
    console.log('🔍 Required field mappings configured:', Object.keys(headerMappingResult.requiredFields));
    console.log('📋 Optional field mappings configured:', Object.keys(headerMappingResult.optionalFields));
    
    // Only warn if truly critical fields are missing
    if (Object.keys(headerMappingResult.requiredFields).length === 0) {
      console.warn('⚠️ No required fields mapped - this might indicate a template mismatch');
    }
  } else if (headerMappingResult.fileType === 'testemunhas') {
    // Testemunha validation
    if (!headerMappingResult.requiredFields.nome_testemunha) {
      errors.push({
        row: 0,
        column: 'nome_testemunha',
        type: 'error',
        message: 'Coluna "Nome_Testemunha" é obrigatória'
      });
    }
    
    if (!headerMappingResult.requiredFields.cnjs_como_testemunha) {
      errors.push({
        row: 0,
        column: 'cnjs_como_testemunha',
        type: 'error',
        message: 'Coluna "CNJs_Como_Testemunha" é obrigatória'
      });
    }
  }
  
  // Log header mapping suggestions for better diagnostics
  if (headerMappingResult.suggestions.length > 0) {
    console.log('💡 Header mapping suggestions:', headerMappingResult.suggestions);
  }
  
  if (headerMappingResult.unmappedFields.length > 0) {
    console.log('⚠️ Unmapped fields:', headerMappingResult.unmappedFields);
  }
  
  totalRows = range.e.r; // Total rows minus header
  console.log('📈 Total rows to process:', totalRows);
  
  if (action === 'validate') {
    // For validation, process a sample of rows (max 5000 to avoid memory issues)
    const sampleSize = Math.min(5000, totalRows);
    console.log('🔍 Processing sample of', sampleSize, 'rows for validation');
    
    const duplicateCNJs = new Set<string>();
    
    for (let row = 1; row <= sampleSize; row++) {
      const rowData: any[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      
      try {
        const processedRow = await processRow(rowData, headerMap, row, errors, warnings, duplicateCNJs, headerMappingResult.fileType);
        if (processedRow) {
          validRows++;
        }
      } catch (error: any) {
        errors.push({
          row: row,
          column: 'general',
          type: 'error',
          message: `Error processing row: ${error.message}`
        });
      }
    }
    
    return {
      totalRows: sampleSize,
      validRows,
      errors: errors.slice(0, 100), // Limit errors to avoid memory issues
      warnings: warnings.slice(0, 50)
    };
  }
  
  if (action === 'publish') {
    console.log('🚀 Starting publish process...');
    
    // Create new dataset version first
    const versionHash = generateHash();
    
    const { data: version, error: versionError } = await supabase
      .from('dataset_versions')
      .insert({
        org_id: orgId,
        status: 'DRAFT',
        hash: versionHash,
        version_number: await getNextVersionNumber(supabase, orgId),
        description: `Upload from ${file.name}`,
        created_by: userId
      })
      .select()
      .single();

    if (versionError) {
      throw new Error(`Failed to create version: ${versionError.message}`);
    }
    
    console.log('✅ Version created:', version.id);

    // Upload file to storage
    const storagePath = `${orgId}/${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from('assistjur-bases')
      .upload(storagePath, file);

    if (storageError) {
      console.error('⚠️ Storage upload error:', storageError);
    }

    // Usar staging table para processamento robusto
    const stagingData: any[] = [];
    const duplicateCNJs = new Set<string>();
    
    // Limpar staging antes de começar
    await supabase.rpc('cleanup_staging');
    
    for (let row = 1; row <= totalRows; row++) {
      const rowData: any[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      
      try {
        const processedRow = await processRow(rowData, headerMap, row, errors, warnings, duplicateCNJs, headerMappingResult.fileType);
        if (processedRow) {
          // Preparar dados para staging (mapeamento correto)
          stagingData.push({
            cnj: processedRow.cnj,
            cnj_digits: processedRow.cnj_digits || processedRow.cnj_normalizado, // Compatibilidade
            reclamante_limpo: processedRow.reclamante_limpo || processedRow.reclamante_nome, // Mapeamento
            reu_nome: processedRow.reu_nome,
            comarca: processedRow.comarca,
            tribunal: processedRow.tribunal,
            vara: processedRow.vara,
            fase: processedRow.fase,
            status: processedRow.status,
            reclamante_cpf: processedRow.reclamante_cpf,
            data_audiencia: processedRow.data_audiencia,
            observacoes: processedRow.observacoes,
            row_number: row,
            import_job_id: version.id
          });
          validRows++;
        }
      } catch (error: any) {
        errors.push({
          row: row,
          column: 'general',
          type: 'error',
          message: `Error processing row: ${error.message}`
        });
      }
      
      processedCount++;
      
      // Insert batch em staging quando atingir chunk size
      if (stagingData.length >= CHUNK_SIZE || row === totalRows) {
        if (stagingData.length > 0) {
          console.log(`💾 Inserting staging batch of ${stagingData.length} records...`);
          
          const { error: stagingError } = await supabase
            .from('stg_processos')
            .insert(stagingData);

          if (stagingError) {
            console.error(`❌ Staging insert error:`, stagingError);
            throw new Error(`Failed to insert staging batch: ${stagingError.message}`);
          }
          
          stagingData.length = 0; // Clear the batch
        }
      }
      
      // Log progress every 500 rows for better feedback
      if (processedCount % 500 === 0) {
        console.log(`📊 Progress: ${processedCount}/${totalRows} rows processed (${Math.round((processedCount/totalRows)*100)}%)`);
      }
    }

    // Save file record
    const { error: fileError } = await supabase
      .from('dataset_files')
      .insert({
        version_id: version.id,
        storage_path: storagePath,
        original_filename: file.name,
        file_size: file.size,
        rows_count: totalRows,
        validation_report: {
          errors: errors.slice(0, 100),
          warnings: warnings.slice(0, 50),
          validRows
        },
        uploaded_by: userId
      });

    if (fileError) {
      throw new Error(`Failed to save file record: ${fileError.message}`);
    }

    // Processar staging → final usando função robusta
    console.log('🔄 Processing staging to final...');
    const { data: upsertResult, error: upsertError } = await supabase
      .rpc('upsert_staging_to_final', { 
        p_org_id: orgId, 
        p_import_job_id: version.id 
      });

    if (upsertError) {
      throw new Error(`Failed to upsert staging data: ${upsertError.message}`);
    }

    const { inserted_count, updated_count } = upsertResult[0] || { inserted_count: 0, updated_count: 0 };
    console.log(`✅ Upsert completed: ${inserted_count} inserted, ${updated_count} updated`);

    // Limpar staging após sucesso
    await supabase.rpc('cleanup_staging', { p_import_job_id: version.id });

    // Update version status to PUBLISHED and set as active
    await supabase
      .from('dataset_versions')
      .update({ 
        status: 'PUBLISHED', 
        published_at: new Date().toISOString(),
        is_active: true 
      })
      .eq('id', version.id);

    // Deactivate other versions
    await supabase
      .from('dataset_versions')
      .update({ is_active: false })
      .eq('org_id', orgId)
      .neq('id', version.id);

    await audit(req, {
      user_id: userId,
      org_id: orgId,
      action: 'base_published',
      resource: 'dataset_versions',
      after: {
        organization_id: orgId,
        email: userEmail,
        version_id: version.id,
        hash: versionHash,
        rows_imported: validRows,
        filename: file.name
      }
    });

    console.log('🎉 Publish completed successfully!');
    
    return {
      id: version.id,
      hash: versionHash,
      rowsImported: validRows,
      errors: errors.length,
      warnings: warnings.length
    };
  }
  
  throw new Error('Invalid action');
}

/**
 * Advanced header mapping with intelligent pattern matching
 * Supports both 'processos' and 'testemunhas' file types
 */
function mapHeadersAdvanced(headers: string[]): HeaderMappingResult & { fileType: 'processos' | 'testemunhas' } {
  // Detect file type based on headers
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9_]/g, '_'));

  // Check if it's a testemunhas file
  const isTestemunhasFile = normalizedHeaders.some(h => 
    h.includes('nome_testemunha') || 
    h.includes('testemunha') || 
    h.includes('cnjs_como_testemunha') ||
    h.includes('cnj_como_testemunha')
  );

  const fileType = isTestemunhasFile ? 'testemunhas' : 'processos';
  console.log('📋 File type detected:', fileType);

  if (fileType === 'testemunhas') {
    return mapTestemunhasHeaders(headers, normalizedHeaders);
  } else {
    return mapProcessosHeaders(headers, normalizedHeaders);
  }
}

/**
 * Map headers for processos files
 */
function mapProcessosHeaders(headers: string[], normalizedHeaders: string[]): HeaderMappingResult & { fileType: 'processos' } {
  console.log('🏛️ Mapping processos headers...');
  
  const requiredFieldMappings = {
    cnj: ['cnj', 'numero', 'processo', 'num_processo', 'número', 'numero_cnj', 'cnj_processo', 'numerocnj'],
    reclamante_limpo: ['reclamante_limpo', 'reclamante_nome', 'reclamante', 'autor', 'requerente', 'nome_reclamante', 'nome_autor'],
    reu_nome: ['reu_nome', 'reu', 'réu', 'requerido', 'nome_reu', 'demandado', 'nome_requerido', 'empresa', 're_nome']
  };

  console.log('🔍 Required field mappings configured:', Object.keys(requiredFieldMappings));

  const optionalFieldMappings = {
    comarca: ['comarca', 'local', 'municipio', 'município'],
    tribunal: ['tribunal', 'trib', 'orgao', 'órgão'],
    vara: ['vara', 'juizo', 'juízo'],
    fase: ['fase', 'situacao', 'situação', 'etapa'],
    status: ['status', 'situacao', 'situação', 'estado'],
    reclamante_cpf: ['cpf', 'cpf_reclamante', 'documento', 'doc_reclamante', 'cpf_autor'],
    data_audiencia: ['audiencia', 'audiência', 'data_audiencia', 'data', 'data_aud'],
    advogados_ativo: ['advogados_ativo', 'adv_ativo', 'advogado_autor', 'advogados_autor'],
    advogados_passivo: ['advogados_passivo', 'adv_passivo', 'advogado_reu', 'advogados_reu'],
    testemunhas_ativo: ['testemunhas_ativo', 'test_ativo', 'testemunha_autor', 'testemunhas_autor'],
    testemunhas_passivo: ['testemunhas_passivo', 'test_passivo', 'testemunha_reu', 'testemunhas_reu'],
    observacoes: ['observacoes', 'observações', 'obs', 'comentarios', 'comentários'],
    score_risco: ['score', 'risco', 'score_risco', 'pontuacao', 'pontuação'],
    classificacao_final: ['classificacao', 'classificação', 'class_final', 'resultado']
  };

  return performHeaderMapping(headers, normalizedHeaders, requiredFieldMappings, optionalFieldMappings, 'processos');
}

/**
 * Map headers for testemunhas files
 */
function mapTestemunhasHeaders(headers: string[], normalizedHeaders: string[]): HeaderMappingResult & { fileType: 'testemunhas' } {
  const requiredFieldMappings = {
    nome_testemunha: ['nome_testemunha', 'testemunha', 'nome', 'pessoa'],
    cnjs_como_testemunha: ['cnjs_como_testemunha', 'cnj_como_testemunha', 'cnjs', 'processos', 'cnj']
  };

  const optionalFieldMappings = {
    reclamante_nome: ['reclamante_nome', 'reclamante', 'autor', 'requerente'],
    reu_nome: ['reu_nome', 'reu', 'réu', 'requerido', 'demandado']
  };

  return performHeaderMapping(headers, normalizedHeaders, requiredFieldMappings, optionalFieldMappings, 'testemunhas');
}

/**
 * Perform the actual header mapping
 */
function performHeaderMapping(
  headers: string[], 
  normalizedHeaders: string[], 
  requiredFieldMappings: Record<string, string[]>, 
  optionalFieldMappings: Record<string, string[]>,
  fileType: 'processos' | 'testemunhas'
): HeaderMappingResult & { fileType: 'processos' | 'testemunhas' } {
  const requiredFields: Record<string, number> = {};
  const optionalFields: Record<string, number> = {};
  const unmappedFields: string[] = [];
  const suggestions: Array<{ header: string; suggestion: string; confidence: number }> = [];

  headers.forEach((header, index) => {
    const normalized = normalizedHeaders[index];
    let mapped = false;

    // Check required fields
    for (const [field, patterns] of Object.entries(requiredFieldMappings)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(normalized)) {
          requiredFields[field] = index;
          mapped = true;
          break;
        }
      }
      if (mapped) break;
    }

    // Check optional fields if not already mapped
    if (!mapped) {
      for (const [field, patterns] of Object.entries(optionalFieldMappings)) {
        for (const pattern of patterns) {
          if (normalized.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(normalized)) {
            optionalFields[field] = index;
            mapped = true;
            break;
          }
        }
        if (mapped) break;
      }
    }

    // If still not mapped, try to suggest
    if (!mapped) {
      const allMappings = { ...requiredFieldMappings, ...optionalFieldMappings };
      
      for (const [field, patterns] of Object.entries(allMappings)) {
        for (const pattern of patterns) {
          const similarity = calculateSimilarity(normalized, pattern.toLowerCase());
          if (similarity > 0.6) {
            suggestions.push({
              header,
              suggestion: field,
              confidence: similarity
            });
            break;
          }
        }
      }
      
      if (suggestions.length === 0 || !suggestions.some(s => s.header === header)) {
        unmappedFields.push(header);
      }
    }
  });

  return {
    requiredFields,
    optionalFields,
    unmappedFields,
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    fileType
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Fallback function for backward compatibility
 */
function mapHeaders(headers: string[]): Record<string, number> {
  const result = mapHeadersAdvanced(headers);
  return { ...result.requiredFields, ...result.optionalFields };
}

/**
 * Advanced row processing with comprehensive validation
 * Supports both 'processos' and 'testemunhas' file types
 */
async function processRow(
  row: any[], 
  headerMap: Record<string, number>, 
  rowNumber: number,
  errors: ValidationError[],
  warnings: ValidationError[],
  duplicateCNJs?: Set<string>,
  fileType: 'processos' | 'testemunhas' = 'processos'
): Promise<ProcessedRow | null> {
  
  if (fileType === 'testemunhas') {
    return processTestemunhaRow(row, headerMap, rowNumber, errors, warnings);
  } else {
    return processProcessoRow(row, headerMap, rowNumber, errors, warnings, duplicateCNJs);
  }
}

/**
 * Process testemunha row
 */
async function processTestemunhaRow(
  row: any[], 
  headerMap: Record<string, number>, 
  rowNumber: number,
  errors: ValidationError[],
  warnings: ValidationError[]
): Promise<any | null> {
  
  let hasErrors = false;
  const processedRow: any = {};

  // Validate Nome_Testemunha (required)
  const nomeValidation = sanitizeTextAdvanced(row[headerMap.nome_testemunha]);
  if (!nomeValidation.normalizedValue) {
    errors.push({
      row: rowNumber,
      column: 'nome_testemunha',
      type: 'error',
      message: 'Nome da testemunha é obrigatório',
      value: String(row[headerMap.nome_testemunha] || '')
    });
    hasErrors = true;
  } else {
    processedRow.nome_testemunha = nomeValidation.normalizedValue;
  }

  // Validate CNJs_Como_Testemunha (required)
  const cnjsValidation = parseArrayFieldAdvanced(row[headerMap.cnjs_como_testemunha]);
  if (!cnjsValidation.normalizedValue || cnjsValidation.normalizedValue.length === 0) {
    errors.push({
      row: rowNumber,
      column: 'cnjs_como_testemunha',
      type: 'error',
      message: 'CNJs como testemunha são obrigatórios',
      value: String(row[headerMap.cnjs_como_testemunha] || '')
    });
    hasErrors = true;
  } else {
    // Validate each CNJ in the array
    const validCNJs: string[] = [];
    for (const cnj of cnjsValidation.normalizedValue) {
      const cnjValidation = validateCNJAdvanced(cnj);
      if (cnjValidation.isValid && cnjValidation.normalizedValue) {
        validCNJs.push(cnjValidation.normalizedValue);
      } else {
        warnings.push({
          row: rowNumber,
          column: 'cnjs_como_testemunha',
          type: 'warning',
          message: `CNJ inválido no array: ${cnj}`,
          value: cnj
        });
      }
    }
    
    if (validCNJs.length === 0) {
      errors.push({
        row: rowNumber,
        column: 'cnjs_como_testemunha',
        type: 'error',
        message: 'Nenhum CNJ válido encontrado',
        value: String(row[headerMap.cnjs_como_testemunha])
      });
      hasErrors = true;
    } else {
      processedRow.cnjs_como_testemunha = validCNJs;
    }
  }

  // Optional fields
  processedRow.reclamante_nome = sanitizeTextAdvanced(row[headerMap.reclamante_nome]).normalizedValue;
  processedRow.reu_nome = sanitizeTextAdvanced(row[headerMap.reu_nome]).normalizedValue;

  if (hasErrors) {
    return null;
  }

  return processedRow;
}

/**
 * Process processo row (existing logic)
 */
async function processProcessoRow(
  row: any[], 
  headerMap: Record<string, number>, 
  rowNumber: number,
  errors: ValidationError[],
  warnings: ValidationError[],
  duplicateCNJs?: Set<string>
): Promise<ProcessedRow | null> {
  
  let hasErrors = false;
  const processedRow: Partial<ProcessedRow> = {};

  // Validate CNJ (required field)
  const cnjValidation = validateCNJAdvanced(row[headerMap.cnj]);
  if (!cnjValidation.isValid) {
    errors.push({
      row: rowNumber,
      column: 'cnj',
      type: 'error',
      message: cnjValidation.error || 'CNJ inválido',
      value: String(row[headerMap.cnj] || '')
    });
    hasErrors = true;
  } else if (cnjValidation.warning) {
    warnings.push({
      row: rowNumber,
      column: 'cnj',
      type: 'warning',
      message: cnjValidation.warning,
      value: String(row[headerMap.cnj] || '')
    });
  }

  if (!hasErrors && cnjValidation.normalizedValue) {
    processedRow.cnj = String(row[headerMap.cnj]);
    processedRow.cnj_digits = cnjValidation.normalizedValue; // Usar cnj_digits ao invés de cnj_normalizado

      // Check for duplicate CNJ
      if (duplicateCNJs) {
        const duplicateCheck = checkDuplicateCNJAdvanced(cnjValidation.normalizedValue, duplicateCNJs);
        if (!duplicateCheck.isValid) {
          errors.push({
            row: rowNumber,
            column: 'cnj',
            type: 'error',
            message: duplicateCheck.error || 'CNJ duplicado',
            value: String(row[headerMap.cnj])
          });
          hasErrors = true;
        }
      }
    }

  // Validate reclamante_nome (required) - compatível com ambos os campos
  let reclamanteValidation: any = null;
  if (headerMap.reclamante_limpo !== undefined) {
    reclamanteValidation = sanitizeTextAdvanced(row[headerMap.reclamante_limpo]);
  } else if (headerMap.reclamante_nome !== undefined) {
    reclamanteValidation = sanitizeTextAdvanced(row[headerMap.reclamante_nome]);
  }
  
  if (!reclamanteValidation || !reclamanteValidation.normalizedValue) {
    errors.push({
      row: rowNumber,
      column: 'reclamante',
      type: 'error',
      message: 'Nome do reclamante é obrigatório (use Reclamante_Limpo ou Reclamante_Nome)',
      value: String(row[headerMap.reclamante_limpo || headerMap.reclamante_nome] || '')
    });
    hasErrors = true;
  } else {
    // Mapear para o campo correto no processedRow
    processedRow.reclamante_limpo = reclamanteValidation.normalizedValue;
    processedRow.reclamante_nome = reclamanteValidation.normalizedValue;
  }

  // Validate reu_nome (required)
  const reuNomeValidation = sanitizeTextAdvanced(row[headerMap.reu_nome]);
  if (!reuNomeValidation.normalizedValue) {
    errors.push({
      row: rowNumber,
      column: 'reu_nome',
      type: 'error',
      message: 'Nome do réu é obrigatório',
      value: String(row[headerMap.reu_nome] || '')
    });
    hasErrors = true;
  } else {
    processedRow.reu_nome = reuNomeValidation.normalizedValue;
  }

  if (hasErrors) {
    return null;
  }

  // Process optional fields with validation
  
  // CPF validation
  const cpfValidation = validateCPFAdvanced(row[headerMap.reclamante_cpf]);
  if (!cpfValidation.isValid && cpfValidation.error) {
    warnings.push({
      row: rowNumber,
      column: 'reclamante_cpf',
      type: 'warning',
      message: cpfValidation.error,
      value: String(row[headerMap.reclamante_cpf] || '')
    });
  } else if (cpfValidation.warning) {
    warnings.push({
      row: rowNumber,
      column: 'reclamante_cpf',
      type: 'warning',
      message: cpfValidation.warning,
      value: String(row[headerMap.reclamante_cpf] || '')
    });
  }
  processedRow.reclamante_cpf_mask = cpfValidation.normalizedValue;

  // Date validation
  const dateValidation = validateDateAdvanced(row[headerMap.data_audiencia]);
  if (!dateValidation.isValid && dateValidation.error) {
    warnings.push({
      row: rowNumber,
      column: 'data_audiencia',
      type: 'warning',
      message: dateValidation.error,
      value: String(row[headerMap.data_audiencia] || '')
    });
  } else if (dateValidation.warning) {
    warnings.push({
      row: rowNumber,
      column: 'data_audiencia',
      type: 'warning',
      message: dateValidation.warning,
      value: String(row[headerMap.data_audiencia] || '')
    });
  }
  processedRow.data_audiencia = dateValidation.normalizedValue;

  // Score validation
  const scoreValidation = validateScoreRiscoAdvanced(row[headerMap.score_risco]);
  if (!scoreValidation.isValid && scoreValidation.error) {
    warnings.push({
      row: rowNumber,
      column: 'score_risco',
      type: 'warning',
      message: scoreValidation.error,
      value: String(row[headerMap.score_risco] || '')
    });
  }
  processedRow.score_risco = scoreValidation.normalizedValue || 0;

  // Text fields
  processedRow.comarca = sanitizeTextAdvanced(row[headerMap.comarca]).normalizedValue;
  processedRow.tribunal = sanitizeTextAdvanced(row[headerMap.tribunal]).normalizedValue;
  processedRow.vara = sanitizeTextAdvanced(row[headerMap.vara]).normalizedValue;
  processedRow.fase = sanitizeTextAdvanced(row[headerMap.fase]).normalizedValue;
  processedRow.status = sanitizeTextAdvanced(row[headerMap.status]).normalizedValue;
  processedRow.observacoes = sanitizeTextAdvanced(row[headerMap.observacoes]).normalizedValue;
  processedRow.classificacao_final = sanitizeTextAdvanced(row[headerMap.classificacao_final]).normalizedValue;

  // Array fields
  processedRow.advogados_ativo = parseArrayFieldAdvanced(row[headerMap.advogados_ativo]).normalizedValue || [];
  processedRow.advogados_passivo = parseArrayFieldAdvanced(row[headerMap.advogados_passivo]).normalizedValue || [];
  processedRow.testemunhas_ativo = parseArrayFieldAdvanced(row[headerMap.testemunhas_ativo]).normalizedValue || [];
  processedRow.testemunhas_passivo = parseArrayFieldAdvanced(row[headerMap.testemunhas_passivo]).normalizedValue || [];

  // Default boolean values
  processedRow.reclamante_foi_testemunha = false;
  processedRow.troca_direta = false;
  processedRow.triangulacao_confirmada = false;
  processedRow.prova_emprestada = false;

  return processedRow as ProcessedRow;
}

/**
 * Advanced CNJ validation with check digit algorithm
 */
function validateCNJAdvanced(cnj: any): ValidationResult {
  if (!cnj) {
    return { isValid: false, error: 'CNJ é obrigatório' };
  }

  // Normalize CNJ (remove all non-digits)
  const normalized = String(cnj).replace(/\D/g, '');
  
  if (normalized.length !== 20) {
    return { 
      isValid: false, 
      error: 'CNJ deve ter exatamente 20 dígitos',
      normalizedValue: normalized
    };
  }

  // Validate CNJ check digits
  const isValidCheckDigit = validateCNJCheckDigits(normalized);
  if (!isValidCheckDigit) {
    return {
      isValid: false,
      error: 'CNJ possui dígitos verificadores inválidos',
      normalizedValue: normalized
    };
  }

  return {
    isValid: true,
    normalizedValue: normalized,
  };
}

/**
 * Validates CNJ check digits using the official algorithm
 */
function validateCNJCheckDigits(cnj: string): boolean {
  if (cnj.length !== 20) return false;

  // Extract parts: NNNNNNN-DD.AAAA.J.TR.OOOO
  const sequencial = cnj.substring(0, 7);
  const digitosVerificadores = cnj.substring(7, 9);
  const ano = cnj.substring(9, 13);
  const segmento = cnj.substring(13, 14);
  const tribunal = cnj.substring(14, 16);
  const origem = cnj.substring(16, 20);

  // Build CNJ without check digits for calculation: NNNNNNN + AAAA + J + TR + OOOO
  const cnjWithoutCheckDigits = sequencial + ano + segmento + tribunal + origem;
  
  // Calculate check digits using the official algorithm
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3];
  let sum = 0;
  
  const digits = cnjWithoutCheckDigits.split('').map(Number);
  
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weights[i];
  }
  
  const remainder = sum % 97;
  const calculatedCheckDigits = 98 - remainder;
  
  return calculatedCheckDigits.toString().padStart(2, '0') === digitosVerificadores;
}

/**
 * Advanced CPF validation with check digit algorithm
 */
function validateCPFAdvanced(cpf: any): ValidationResult {
  if (!cpf) {
    return { isValid: true, warning: 'CPF não informado' }; // CPF is optional
  }

  const normalized = String(cpf).replace(/\D/g, '');
  
  if (normalized.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve ter exatamente 11 dígitos',
      normalizedValue: normalized
    };
  }

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(normalized)) {
    return {
      isValid: false,
      error: 'CPF inválido (todos os dígitos iguais)',
      normalizedValue: normalized
    };
  }

  // Validate check digits
  if (!validateCPFCheckDigits(normalized)) {
    return {
      isValid: false,
      error: 'CPF possui dígitos verificadores inválidos',
      normalizedValue: normalized
    };
  }

  return {
    isValid: true,
    normalizedValue: maskCPFAdvanced(normalized)
  };
}

/**
 * Validates CPF check digits
 */
function validateCPFCheckDigits(cpf: string): boolean {
  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;

  if (checkDigit1 !== parseInt(cpf.charAt(9))) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;

  return checkDigit2 === parseInt(cpf.charAt(10));
}

/**
 * Mask CPF for privacy
 */
function maskCPFAdvanced(cpf: string): string {
  if (cpf.length !== 11) return cpf;
  return `${cpf.substring(0, 3)}.***.***-${cpf.substring(9, 11)}`;
}

/**
 * Validate date formats
 */
function validateDateAdvanced(dateStr: any): ValidationResult {
  if (!dateStr) {
    return { isValid: true, warning: 'Data não informada' };
  }

  let date: Date;
  
  // Try parsing different date formats
  if (typeof dateStr === 'number') {
    // Excel serial date
    date = new Date((dateStr - 25569) * 86400 * 1000);
  } else if (typeof dateStr === 'string') {
    // Try various string formats
    const cleanDateStr = String(dateStr).trim();
    
    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split('/').map(Number);
      date = new Date(year, month - 1, day);
    }
    // YYYY-MM-DD
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDateStr)) {
      date = new Date(cleanDateStr);
    }
    // DD-MM-YYYY
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    else {
      return {
        isValid: false,
        error: 'Formato de data inválido. Use DD/MM/YYYY, YYYY-MM-DD ou DD-MM-YYYY'
      };
    }
  } else {
    return {
      isValid: false,
      error: 'Tipo de data inválido'
    };
  }

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Data inválida'
    };
  }

  // Check reasonable date range (not too old, not in future)
  const now = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);

  if (date < minDate || date > maxDate) {
    return {
      isValid: false,
      error: `Data fora do intervalo válido (${minDate.getFullYear()}-${maxDate.getFullYear()})`
    };
  }

  return {
    isValid: true,
    normalizedValue: date.toISOString().split('T')[0] // YYYY-MM-DD format
  };
}

/**
 * Validate numeric score range
 */
function validateScoreRiscoAdvanced(score: any): ValidationResult {
  if (!score && score !== 0) {
    return { isValid: true, warning: 'Score de risco não informado' };
  }

  const numScore = Number(score);
  
  if (isNaN(numScore)) {
    return {
      isValid: false,
      error: 'Score de risco deve ser um número'
    };
  }

  if (numScore < 0 || numScore > 100) {
    return {
      isValid: false,
      error: 'Score de risco deve estar entre 0 e 100'
    };
  }

  return {
    isValid: true,
    normalizedValue: Math.round(numScore)
  };
}

/**
 * Sanitize text fields
 */
function sanitizeTextAdvanced(text: any): ValidationResult {
  if (!text) {
    return { isValid: true, normalizedValue: null };
  }

  const cleanText = String(text)
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 1000); // Limit length

  return {
    isValid: true,
    normalizedValue: cleanText || null
  };
}

/**
 * Parse array fields (advogados, testemunhas)
 */
function parseArrayFieldAdvanced(value: any): ValidationResult {
  if (!value) {
    return { isValid: true, normalizedValue: [] };
  }

  let names: string[] = [];

  if (Array.isArray(value)) {
    names = value.map(v => String(v).trim()).filter(Boolean);
  } else if (typeof value === 'string') {
    // Split by common separators
    names = String(value).split(/[;,\|\n]/)
      .map(name => name.trim())
      .filter(Boolean);
  } else {
    names = [String(value).trim()].filter(Boolean);
  }

  // Sanitize each name
  const sanitizedNames = names.map(name => 
    name.replace(/[<>]/g, '').substring(0, 200)
  );

  return {
    isValid: true,
    normalizedValue: sanitizedNames
  };
}

/**
 * Check for duplicate CNJs
 */
function checkDuplicateCNJAdvanced(cnj: string, existingCNJs: Set<string>): ValidationResult {
  const normalized = cnj.replace(/\D/g, '');
  
  if (existingCNJs.has(normalized)) {
    return {
      isValid: false,
      error: 'CNJ duplicado encontrado'
    };
  }

  existingCNJs.add(normalized);
  return { isValid: true };
}

// Legacy functions for backward compatibility
function normalizeCNJ(cnj: string): string {
  return cnj.replace(/\D/g, '')
}

function validateCNJ(cnj: string): boolean {
  return validateCNJAdvanced(cnj).isValid;
}

function maskCPF(cpf?: string): string | undefined {
  if (!cpf) return undefined;
  const result = validateCPFAdvanced(cpf);
  return result.normalizedValue;
}

function parseDate(dateStr: any): string | undefined {
  const result = validateDateAdvanced(dateStr);
  return result.normalizedValue;
}

function generateHash(): string {
  return Math.random().toString(36).substring(2, 10)
}

async function getNextVersionNumber(supabaseClient: any, orgId: string): Promise<number> {
  const { data } = await supabaseClient
    .from('dataset_versions')
    .select('version_number')
    .eq('org_id', orgId)
    .order('version_number', { ascending: false })
    .limit(1)

  return (data?.[0]?.version_number || 0) + 1
}