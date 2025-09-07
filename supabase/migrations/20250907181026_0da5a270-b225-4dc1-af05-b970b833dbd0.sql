-- CRITICAL SECURITY FIXES - Phase 1: Data Protection (Corrected)

-- 1. Secure beta_signups table - RESTRICT PUBLIC ACCESS
-- Remove the overly permissive public signup policy
DROP POLICY IF EXISTS "Allow public beta signup creation" ON public.beta_signups;

-- Add rate-limited beta signup policy (more secure)
CREATE POLICY "Controlled beta signup creation" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (
  -- Rate limit: only allow 1 signup per email per day
  NOT EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
      AND created_at > now() - interval '24 hours'
  )
);

-- 2. Drop the unsafe processos_live view and recreate it securely
-- Since we can't add RLS to views, we'll recreate it as a security definer function
DROP VIEW IF EXISTS public.processos_live;

-- Create a secure function to replace the unsafe view
CREATE OR REPLACE FUNCTION public.get_processos_live_secure(org_uuid uuid DEFAULT NULL)
 RETURNS TABLE(
   id uuid, org_id uuid, version_id uuid, cnj text, cnj_normalizado text, 
   cnj_digits text, comarca text, tribunal text, vara text, fase text, 
   status text, reclamante_nome text, reclamante_cpf_mask text, reu_nome text, 
   advogados_ativo text[], advogados_passivo text[], testemunhas_ativo text[], 
   testemunhas_passivo text[], data_audiencia date, reclamante_foi_testemunha boolean, 
   troca_direta boolean, triangulacao_confirmada boolean, prova_emprestada boolean, 
   classificacao_final text, score_risco integer, observacoes text, 
   created_at timestamp with time zone, updated_at timestamp with time zone, 
   deleted_at timestamp with time zone, deleted_by uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Verify user has access to this organization
  SELECT 
    p.id, p.org_id, p.version_id, p.cnj, p.cnj_normalizado, p.cnj_digits,
    p.comarca, p.tribunal, p.vara, p.fase, p.status,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
      ELSE mask_name(p.reclamante_nome)
    END as reclamante_nome,
    p.reclamante_cpf_mask,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
      ELSE mask_name(p.reu_nome)
    END as reu_nome,
    p.advogados_ativo, p.advogados_passivo, p.testemunhas_ativo, p.testemunhas_passivo,
    p.data_audiencia, p.reclamante_foi_testemunha, p.troca_direta, 
    p.triangulacao_confirmada, p.prova_emprestada, p.classificacao_final,
    p.score_risco, p.observacoes, p.created_at, p.updated_at, p.deleted_at, p.deleted_by
  FROM processos p
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid)
    AND p.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.user_id = auth.uid() 
        AND pr.organization_id = p.org_id
    );
$function$;

-- 3. Fix remaining security definer functions - add missing search_path
CREATE OR REPLACE FUNCTION public.rpc_delete_all_processos(p_org_id uuid, p_hard_delete boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_count integer := 0;
  v_user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Check if user is admin
  IF v_user_profile IS NULL OR v_user_profile.role != 'ADMIN' OR v_user_profile.organization_id != p_org_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Acesso negado - apenas administradores podem executar esta operação'
    );
  END IF;

  -- Perform deletion
  IF p_hard_delete THEN
    -- Hard delete (permanent removal)
    DELETE FROM processos 
    WHERE org_id = p_org_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log action
    PERFORM log_user_action(
      'HARD_DELETE_ALL_PROCESSOS',
      'processos',
      NULL,
      jsonb_build_object(
        'org_id', p_org_id,
        'deleted_count', v_deleted_count,
        'operation_type', 'HARD_DELETE_ALL'
      )
    );
  ELSE
    -- Soft delete (recommended)
    UPDATE processos 
    SET deleted_at = now(), 
        deleted_by = auth.uid()
    WHERE org_id = p_org_id 
      AND deleted_at IS NULL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log action
    PERFORM log_user_action(
      'SOFT_DELETE_ALL_PROCESSOS',
      'processos',
      NULL,
      jsonb_build_object(
        'org_id', p_org_id,
        'deleted_count', v_deleted_count,
        'operation_type', 'SOFT_DELETE_ALL'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'operation_type', CASE WHEN p_hard_delete THEN 'HARD_DELETE' ELSE 'SOFT_DELETE' END,
    'message', 'Operação de exclusão concluída com sucesso'
  );
END;
$function$;