-- Fix security definer view issues by recreating views without security definer
-- Drop existing views
DROP VIEW IF EXISTS public.vw_testemunhas_publicas;
DROP VIEW IF EXISTS public.vw_processos_publicos;

-- Create views with proper security (no SECURITY DEFINER)
CREATE OR REPLACE VIEW public.vw_testemunhas_publicas AS
SELECT 
  gen_random_uuid() as id,
  p.id as processo_id,
  p.org_id,
  CASE WHEN p.segredo_justica 
       THEN left(witness_name, 1) || '***'
       ELSE witness_name 
  END as nome,
  'email@masked.com' as email,
  CASE 
    WHEN array_length(p.testemunhas_ativo, 1) > 3 THEN 'Alto'
    WHEN array_length(p.testemunhas_ativo, 1) > 1 THEN 'Médio' 
    ELSE 'Baixo'
  END as risco_sensibilidade
FROM public.processos p
CROSS JOIN LATERAL unnest(COALESCE(p.testemunhas_ativo, ARRAY[]::text[])) as witness_name
WHERE p.deleted_at IS NULL
  AND p.testemunhas_ativo IS NOT NULL 
  AND array_length(p.testemunhas_ativo, 1) > 0

UNION ALL

SELECT 
  gen_random_uuid() as id,
  p.id as processo_id,
  p.org_id,
  CASE WHEN p.segredo_justica 
       THEN left(witness_name, 1) || '***'
       ELSE witness_name 
  END as nome,
  'email@masked.com' as email,
  CASE 
    WHEN array_length(p.testemunhas_passivo, 1) > 3 THEN 'Alto'
    WHEN array_length(p.testemunhas_passivo, 1) > 1 THEN 'Médio'
    ELSE 'Baixo'
  END as risco_sensibilidade
FROM public.processos p
CROSS JOIN LATERAL unnest(COALESCE(p.testemunhas_passivo, ARRAY[]::text[])) as witness_name
WHERE p.deleted_at IS NULL
  AND p.testemunhas_passivo IS NOT NULL 
  AND array_length(p.testemunhas_passivo, 1) > 0;

-- Create processos view with PII masking
CREATE OR REPLACE VIEW public.vw_processos_publicos AS
SELECT 
  p.id,
  p.org_id,
  p.version_id,
  p.cnj,
  p.cnj_normalizado,
  p.cnj_digits,
  p.comarca,
  p.tribunal,
  p.vara,
  p.fase,
  p.status,
  CASE WHEN p.segredo_justica 
       THEN left(p.reclamante_nome, 2) || '***'
       ELSE p.reclamante_nome 
  END as reclamante_nome,
  p.reclamante_cpf_mask,
  CASE WHEN p.segredo_justica 
       THEN left(p.reu_nome, 2) || '***'
       ELSE p.reu_nome 
  END as reu_nome,
  p.data_audiencia,
  p.advogados_ativo,
  p.advogados_passivo,
  p.testemunhas_ativo,
  p.testemunhas_passivo,
  p.reclamante_foi_testemunha,
  p.troca_direta,
  p.triangulacao_confirmada,
  p.prova_emprestada,
  p.classificacao_final,
  p.score_risco,
  p.observacoes,
  p.created_at,
  p.updated_at,
  p.segredo_justica
FROM public.processos p
WHERE p.deleted_at IS NULL;