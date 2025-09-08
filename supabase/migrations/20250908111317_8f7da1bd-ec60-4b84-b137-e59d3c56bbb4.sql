-- Fix Security Definer View issues by checking and fixing the underlying views
-- First, identify which views exist and if they have security definer properties

-- Check if the assistjur schema exists and has staging tables that need RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'assistjur' 
AND rowsecurity = false;

-- Enable RLS on assistjur staging tables that need it
DO $$
BEGIN
  -- Enable RLS on por_processo_staging if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'assistjur' AND tablename = 'por_processo_staging') THEN
    ALTER TABLE assistjur.por_processo_staging ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policy for por_processo_staging
    DROP POLICY IF EXISTS "Organization access policy" ON assistjur.por_processo_staging;
    CREATE POLICY "Organization access policy" ON assistjur.por_processo_staging
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = por_processo_staging.org_id
      )
    );
  END IF;

  -- Enable RLS on por_testemunha_staging if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'assistjur' AND tablename = 'por_testemunha_staging') THEN
    ALTER TABLE assistjur.por_testemunha_staging ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policy for por_testemunha_staging
    DROP POLICY IF EXISTS "Organization access policy" ON assistjur.por_testemunha_staging;
    CREATE POLICY "Organization access policy" ON assistjur.por_testemunha_staging
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = por_testemunha_staging.org_id
      )
    );
  END IF;
END $$;

-- Fix the security definer functions by ensuring they have proper search path
-- These functions currently use security definer which may be creating the view security issues

-- Update the functions that are causing security definer view issues
CREATE OR REPLACE FUNCTION public.get_processos_masked(org_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, org_id uuid, version_id uuid, cnj text, cnj_normalizado text, comarca text, tribunal text, vara text, fase text, status text, reclamante_nome text, reclamante_cpf_mask text, reu_nome text, data_audiencia date, advogados_ativo text[], advogados_passivo text[], testemunhas_ativo text[], testemunhas_passivo text[], reclamante_foi_testemunha boolean, troca_direta boolean, triangulacao_confirmada boolean, prova_emprestada boolean, classificacao_final text, score_risco integer, observacoes text, created_at timestamp with time zone, updated_at timestamp with time zone, deleted_at timestamp with time zone, deleted_by uuid)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.org_id,
    p.version_id,
    p.cnj,
    p.cnj_normalizado,
    p.comarca,
    p.tribunal,
    p.vara,
    p.fase,
    p.status,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
      ELSE mask_name(p.reclamante_nome)
    END as reclamante_nome,
    p.reclamante_cpf_mask,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
      ELSE mask_name(p.reu_nome)
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
    p.deleted_at,
    p.deleted_by
  FROM processos p
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid)
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.user_id = auth.uid() 
    AND pr.organization_id = p.org_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_pessoas_masked(org_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, org_id uuid, nome_civil text, cpf_mask text, apelidos text[], created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.org_id,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.nome_civil
      ELSE mask_name(p.nome_civil)
    END as nome_civil,
    p.cpf_mask,
    p.apelidos,
    p.created_at,
    p.updated_at
  FROM pessoas p
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid)
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.user_id = auth.uid() 
    AND pr.organization_id = p.org_id
  );
$function$;