-- Remove the problematic views completely and replace with secure functions
DROP VIEW IF EXISTS public.pessoas_masked CASCADE;
DROP VIEW IF EXISTS public.processos_masked CASCADE;

-- Create secure functions to replace the views with proper access control
CREATE OR REPLACE FUNCTION public.get_pessoas_masked(org_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  org_id uuid, 
  nome_civil text,
  cpf_mask text,
  apelidos text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_processos_masked(org_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  version_id uuid,
  cnj text,
  cnj_normalizado text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  reclamante_nome text,
  reclamante_cpf_mask text,
  reu_nome text,
  data_audiencia date,
  advogados_ativo text[],
  advogados_passivo text[],
  testemunhas_ativo text[],
  testemunhas_passivo text[],
  reclamante_foi_testemunha boolean,
  troca_direta boolean,
  triangulacao_confirmada boolean,
  prova_emprestada boolean,
  classificacao_final text,
  score_risco integer,
  observacoes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone,
  deleted_by uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_pessoas_masked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_processos_masked(uuid) TO authenticated;