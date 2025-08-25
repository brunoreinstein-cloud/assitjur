import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user profile and organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      throw new Error('Only admins can upload base data')
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string // 'validate' or 'publish'

    if (!file) {
      throw new Error('No file provided')
    }

    console.log(`Processing ${action} for file: ${file.name}, size: ${file.size}`)

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get first worksheet
    const worksheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[worksheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row')
    }

    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1)

    console.log(`Processing ${dataRows.length} rows with headers:`, headers)

    // Validate and process data
    const validationResult = await validateAndProcessData(headers, dataRows)
    
    if (action === 'validate') {
      // Just return validation results
      return new Response(
        JSON.stringify({
          success: true,
          validation: validationResult,
          preview: validationResult.processedRows?.slice(0, 10) || []
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
      // Create new dataset version
      const versionHash = generateHash()
      
      const { data: version, error: versionError } = await supabaseClient
        .from('dataset_versions')
        .insert({
          org_id: profile.organization_id,
          status: 'DRAFT',
          hash: versionHash,
          version_number: await getNextVersionNumber(supabaseClient, profile.organization_id),
          description: `Upload from ${file.name}`,
          created_by: user.id
        })
        .select()
        .single()

      if (versionError) {
        throw new Error(`Failed to create version: ${versionError.message}`)
      }

      // Upload file to storage
      const storagePath = `${profile.organization_id}/${Date.now()}_${file.name}`
      const { error: storageError } = await supabaseClient.storage
        .from('hubjuria-bases')
        .upload(storagePath, file)

      if (storageError) {
        console.error('Storage upload error:', storageError)
      }

      // Save file record
      const { error: fileError } = await supabaseClient
        .from('dataset_files')
        .insert({
          version_id: version.id,
          storage_path: storagePath,
          original_filename: file.name,
          file_size: file.size,
          rows_count: validationResult.totalRows,
          validation_report: {
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            validRows: validationResult.validRows
          },
          uploaded_by: user.id
        })

      if (fileError) {
        throw new Error(`Failed to save file record: ${fileError.message}`)
      }

      // Insert processed data
      if (validationResult.processedRows && validationResult.processedRows.length > 0) {
        const processedData = validationResult.processedRows.map(row => ({
          ...row,
          org_id: profile.organization_id,
          version_id: version.id
        }))

        // Insert in batches
        const batchSize = 500
        for (let i = 0; i < processedData.length; i += batchSize) {
          const batch = processedData.slice(i, i + batchSize)
          const { error: insertError } = await supabaseClient
            .from('processos')
            .insert(batch)

          if (insertError) {
            console.error(`Batch insert error (${i}-${i + batch.length}):`, insertError)
            throw new Error(`Failed to insert data batch: ${insertError.message}`)
          }
        }
      }

      // Update version status to PUBLISHED and set as active
      await supabaseClient
        .from('dataset_versions')
        .update({ 
          status: 'PUBLISHED', 
          published_at: new Date().toISOString(),
          is_active: true 
        })
        .eq('id', version.id)

      // Deactivate other versions
      await supabaseClient
        .from('dataset_versions')
        .update({ is_active: false })
        .eq('org_id', profile.organization_id)
        .neq('id', version.id)

      // Log audit trail
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          email: profile.email,
          role: profile.role,
          action: 'base_published',
          resource: 'dataset_versions',
          result: 'success',
          metadata: {
            version_id: version.id,
            hash: versionHash,
            rows_imported: validationResult.validRows,
            filename: file.name
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          version: {
            id: version.id,
            hash: versionHash,
            rowsImported: validationResult.validRows,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length
          }
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

  } catch (error) {
    console.error('Error processing upload:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function validateAndProcessData(headers: string[], dataRows: any[][]): Promise<ValidationResult & { processedRows?: ProcessedRow[] }> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const processedRows: ProcessedRow[] = []

  // Map headers to expected columns
  const headerMap = mapHeaders(headers)
  
  if (!headerMap.cnj) {
    errors.push({
      row: 0,
      column: 'cnj',
      type: 'error',
      message: 'Coluna CNJ é obrigatória'
    })
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNumber = i + 2 // +2 because array is 0-indexed and we skip header

    try {
      const processedRow = await processRow(row, headerMap, rowNumber, errors, warnings)
      if (processedRow) {
        processedRows.push(processedRow)
      }
    } catch (error) {
      errors.push({
        row: rowNumber,
        column: 'general',
        type: 'error',
        message: `Error processing row: ${error.message}`
      })
    }
  }

  return {
    totalRows: dataRows.length,
    validRows: processedRows.length,
    errors,
    warnings,
    processedRows
  }
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