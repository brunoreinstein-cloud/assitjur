import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

interface ProcessedRow {
  cnj: string
  cnj_normalizado: string
  comarca?: string
  tribunal?: string
  vara?: string
  fase?: string
  status?: string
  reclamante_nome?: string
  reclamante_cpf_mask?: string
  reu_nome?: string
  advogados_ativo?: string[]
  advogados_passivo?: string[]
  testemunhas_ativo?: string[]
  testemunhas_passivo?: string[]
  data_audiencia?: string
  reclamante_foi_testemunha?: boolean
  troca_direta?: boolean
  triangulacao_confirmada?: boolean
  prova_emprestada?: boolean
  classificacao_final?: string
  score_risco?: number
  observacoes?: string
}

interface ValidationResult {
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

// JWT verification function
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Failed to decode JWT: ' + error.message);
  }
}

serve(async (req) => {
  console.log('📊 Base Upload Function Started');
  console.log('Method:', req.method, 'URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Extract JWT from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Decoding JWT token...');
    
    // Decode JWT to get user info
    const payload = decodeJWT(token);
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('Invalid token: no user ID found');
    }
    
    console.log('✅ User ID from JWT:', userId);

    // Create service role client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user profile and verify admin role
    console.log('👤 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      throw new Error('User profile not found');
    }

    if (profile.role !== 'ADMIN') {
      throw new Error('Only admins can upload base data');
    }

    const orgId = profile.organization_id;
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
    const validationResult = await processFileInChunks(file, orgId, userId, profile.email, action, supabase)
    
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
  const headerMap = mapHeaders(headers);
  
  if (!headerMap.cnj) {
    errors.push({
      row: 0,
      column: 'cnj',
      type: 'error',
      message: 'Coluna CNJ é obrigatória'
    });
  }
  
  totalRows = range.e.r; // Total rows minus header
  console.log('📈 Total rows to process:', totalRows);
  
  if (action === 'validate') {
    // For validation, process a sample of rows (max 5000 to avoid memory issues)
    const sampleSize = Math.min(5000, totalRows);
    console.log('🔍 Processing sample of', sampleSize, 'rows for validation');
    
    for (let row = 1; row <= sampleSize; row++) {
      const rowData: any[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      
      try {
        const processedRow = await processRow(rowData, headerMap, row + 1, errors, warnings);
        if (processedRow) {
          validRows++;
        }
      } catch (error: any) {
        errors.push({
          row: row + 1,
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
      .from('hubjuria-bases')
      .upload(storagePath, file);

    if (storageError) {
      console.error('⚠️ Storage upload error:', storageError);
    }

    // Process rows in chunks to avoid memory issues
    const batchData: ProcessedRow[] = [];
    
    for (let row = 1; row <= totalRows; row++) {
      const rowData: any[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      
      try {
        const processedRow = await processRow(rowData, headerMap, row + 1, errors, warnings);
        if (processedRow) {
          batchData.push({
            ...processedRow,
            org_id: orgId,
            version_id: version.id
          } as any);
          validRows++;
        }
      } catch (error: any) {
        errors.push({
          row: row + 1,
          column: 'general',
          type: 'error',
          message: `Error processing row: ${error.message}`
        });
      }
      
      processedCount++;
      
      // Insert batch when it reaches chunk size or we're at the end
      if (batchData.length >= CHUNK_SIZE || row === totalRows) {
        if (batchData.length > 0) {
          console.log(`💾 Inserting batch of ${batchData.length} records...`);
          
          const { error: insertError } = await supabase
            .from('processos')
            .insert(batchData);

          if (insertError) {
            console.error(`❌ Batch insert error:`, insertError);
            throw new Error(`Failed to insert data batch: ${insertError.message}`);
          }
          
          batchData.length = 0; // Clear the batch
        }
      }
      
      // Log progress every 2000 rows
      if (processedCount % 2000 === 0) {
        console.log(`📊 Progress: ${processedCount}/${totalRows} rows processed`);
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

    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        organization_id: orgId,
        email: userEmail,
        role: 'ADMIN',
        action: 'base_published',
        resource: 'dataset_versions',
        result: 'success',
        metadata: {
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

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim()
    
    if (normalized.includes('cnj')) map.cnj = index
    if (normalized.includes('comarca')) map.comarca = index
    if (normalized.includes('tribunal')) map.tribunal = index
    if (normalized.includes('vara')) map.vara = index
    if (normalized.includes('fase')) map.fase = index
    if (normalized.includes('status')) map.status = index
    if (normalized.includes('reclamante') && normalized.includes('nome')) map.reclamante_nome = index
    if (normalized.includes('reclamante') && normalized.includes('cpf')) map.reclamante_cpf = index
    if (normalized.includes('reu') || normalized.includes('réu')) map.reu_nome = index
    if (normalized.includes('audiencia') || normalized.includes('audiência')) map.data_audiencia = index
    if (normalized.includes('observ')) map.observacoes = index
  })
  
  return map
}

async function processRow(
  row: any[], 
  headerMap: Record<string, number>, 
  rowNumber: number,
  errors: ValidationError[],
  warnings: ValidationError[]
): Promise<ProcessedRow | null> {
  
  const cnj = row[headerMap.cnj]?.toString()?.trim()
  
  if (!cnj) {
    errors.push({
      row: rowNumber,
      column: 'cnj',
      type: 'error',
      message: 'CNJ é obrigatório',
      value: cnj
    })
    return null
  }

  // Normalize CNJ
  const cnj_normalizado = normalizeCNJ(cnj)
  if (!validateCNJ(cnj_normalizado)) {
    warnings.push({
      row: rowNumber,
      column: 'cnj',
      type: 'warning',
      message: 'CNJ não segue padrão esperado',
      value: cnj
    })
  }

  // Process other fields
  const processedRow: ProcessedRow = {
    cnj,
    cnj_normalizado,
    comarca: row[headerMap.comarca]?.toString()?.trim() || undefined,
    tribunal: row[headerMap.tribunal]?.toString()?.trim() || undefined,
    vara: row[headerMap.vara]?.toString()?.trim() || undefined,
    fase: row[headerMap.fase]?.toString()?.trim() || undefined,
    status: row[headerMap.status]?.toString()?.trim() || undefined,
    reclamante_nome: row[headerMap.reclamante_nome]?.toString()?.trim() || undefined,
    reclamante_cpf_mask: maskCPF(row[headerMap.reclamante_cpf]?.toString()?.trim()),
    reu_nome: row[headerMap.reu_nome]?.toString()?.trim() || undefined,
    data_audiencia: parseDate(row[headerMap.data_audiencia]),
    observacoes: row[headerMap.observacoes]?.toString()?.trim() || undefined,
    // Default boolean values
    reclamante_foi_testemunha: false,
    troca_direta: false,
    triangulacao_confirmada: false,
    prova_emprestada: false,
    score_risco: 0
  }

  return processedRow
}

function normalizeCNJ(cnj: string): string {
  return cnj.replace(/\D/g, '')
}

function validateCNJ(cnj: string): boolean {
  // Basic CNJ validation (20 digits)
  return /^\d{20}$/.test(cnj)
}

function maskCPF(cpf?: string): string | undefined {
  if (!cpf) return undefined
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return cpf
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`
}

function parseDate(dateStr: any): string | undefined {
  if (!dateStr) return undefined
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return undefined
    return date.toISOString().split('T')[0]
  } catch {
    return undefined
  }
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