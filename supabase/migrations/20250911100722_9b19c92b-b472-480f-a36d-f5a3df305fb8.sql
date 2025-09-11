-- Fix Security Definer Functions: Convert risky functions to more secure alternatives
-- The main security concern is that SECURITY DEFINER functions run with elevated privileges
-- We'll convert some view-like functions to regular functions where appropriate

-- First, let's convert the get_processos_masked function to be more secure
-- by ensuring it properly validates user permissions without bypassing RLS
CREATE OR REPLACE FUNCTION public.get_processos_with_access_control(org_uuid uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid, org_id uuid, version_id uuid, cnj text, cnj_normalizado text, 
  comarca text, tribunal text, vara text, fase text, status text, 
  reclamante_nome text, reclamante_cpf_mask text, reu_nome text, 
  data_audiencia date, advogados_ativo text[], advogados_passivo text[], 
  testemunhas_ativo text[], testemunhas_passivo text[], 
  reclamante_foi_testemunha boolean, troca_direta boolean, 
  triangulacao_confirmada boolean, prova_emprestada boolean, 
  classificacao_final text, score_risco integer, observacoes text, 
  created_at timestamp with time zone, updated_at timestamp with time zone, 
  deleted_at timestamp with time zone, deleted_by uuid
)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $function$
  -- This function now relies on RLS policies instead of bypassing them
  SELECT 
    p.id, p.org_id, p.version_id, p.cnj, p.cnj_normalizado,
    p.comarca, p.tribunal, p.vara, p.fase, p.status,
    -- Data access control is now handled by RLS policies on the table level
    p.reclamante_nome, p.reclamante_cpf_mask, p.reu_nome,
    p.data_audiencia, p.advogados_ativo, p.advogados_passivo, 
    p.testemunhas_ativo, p.testemunhas_passivo, p.reclamante_foi_testemunha, 
    p.troca_direta, p.triangulacao_confirmada, p.prova_emprestada, 
    p.classificacao_final, p.score_risco, p.observacoes, 
    p.created_at, p.updated_at, p.deleted_at, p.deleted_by
  FROM processos p
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid)
    AND p.deleted_at IS NULL;
$function$;

-- Create a more secure version of get_pessoas_masked 
CREATE OR REPLACE FUNCTION public.get_pessoas_with_access_control(org_uuid uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid, org_id uuid, nome_civil text, cpf_mask text, 
  apelidos text[], created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $function$
  -- This function now relies on RLS policies instead of bypassing them
  SELECT 
    p.id, p.org_id, p.nome_civil, p.cpf_mask, p.apelidos, 
    p.created_at, p.updated_at
  FROM pessoas p
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid);
$function$;

-- For the public processos function, we'll keep it as SECURITY DEFINER but make it more restrictive
CREATE OR REPLACE FUNCTION public.get_processos_public_safe()
RETURNS TABLE(
  id uuid, org_id uuid, version_id uuid, cnj text, cnj_normalizado text, 
  cnj_digits text, comarca text, tribunal text, vara text, fase text, 
  status text, reclamante_nome text, reclamante_cpf_mask text, reu_nome text, 
  data_audiencia date, advogados_ativo text[], advogados_passivo text[], 
  testemunhas_ativo text[], testemunhas_passivo text[], 
  reclamante_foi_testemunha boolean, troca_direta boolean, 
  triangulacao_confirmada boolean, prova_emprestada boolean, 
  classificacao_final text, score_risco integer, observacoes text, 
  created_at timestamp with time zone, updated_at timestamp with time zone, 
  segredo_justica boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  -- Enhanced security checks - only return non-sensitive data
  SELECT 
    p.id, p.org_id, p.version_id, p.cnj, p.cnj_normalizado, p.cnj_digits,
    p.comarca, p.tribunal, p.vara, p.fase, p.status,
    -- Apply additional masking for sensitive data
    CASE
      WHEN p.segredo_justica THEN left(p.reclamante_nome, 2) || '***'
      ELSE p.reclamante_nome
    END AS reclamante_nome,
    p.reclamante_cpf_mask,
    CASE
      WHEN p.segredo_justica THEN left(p.reu_nome, 2) || '***'  
      ELSE p.reu_nome
    END AS reu_nome,
    p.data_audiencia, p.advogados_ativo, p.advogados_passivo, 
    p.testemunhas_ativo, p.testemunhas_passivo,
    p.reclamante_foi_testemunha, p.troca_direta, p.triangulacao_confirmada, 
    p.prova_emprestada, p.classificacao_final, p.score_risco, p.observacoes, 
    p.created_at, p.updated_at, p.segredo_justica
  FROM processos p
  WHERE p.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.user_id = auth.uid() 
      AND pr.organization_id = p.org_id
      AND pr.is_active = true
    );
$function$;

-- Add documentation comments for remaining SECURITY DEFINER functions
COMMENT ON FUNCTION public.mask_name(text) IS 'SECURITY DEFINER: Required for data masking across RLS boundaries';
COMMENT ON FUNCTION public.mask_cpf(text) IS 'SECURITY DEFINER: Required for data masking across RLS boundaries';
COMMENT ON FUNCTION public.can_access_sensitive_data(uuid) IS 'SECURITY DEFINER: Required for permission checks across RLS boundaries';
COMMENT ON FUNCTION public.log_user_action(text, text, uuid, jsonb) IS 'SECURITY DEFINER: Required for audit logging with system privileges';
COMMENT ON FUNCTION public.secure_insert_beta_signup(text, text, text, text, text[], text, jsonb) IS 'SECURITY DEFINER: Required for secure signup processing';

-- Drop the old less secure functions if they exist
DROP FUNCTION IF EXISTS public.get_processos_masked(uuid);
DROP FUNCTION IF EXISTS public.get_pessoas_masked(uuid);
DROP FUNCTION IF EXISTS public.get_processos_publicos();